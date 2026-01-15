/// <reference types="@cloudflare/workers-types" />
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const env = locals.runtime.env as {
            DB: D1Database;
            RESEND_API_KEY: string;
            EMAIL_FROM: string;
            WORKSPACE_ID: string;
            AUTH_TOKEN_SECRET: string;
        };

        if (!env.DB) {
            return new Response(JSON.stringify({ ok: false, error: 'Database not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();
        const email = body.email?.toLowerCase().trim();

        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user exists (don't reveal if not)
        const userResult = await env.DB.prepare(
            'SELECT id FROM pt_users WHERE workspace_id = ? AND email = ?'
        ).bind(env.WORKSPACE_ID, email).first();

        // Always return success to prevent email enumeration
        if (!userResult) {
            return new Response(JSON.stringify({
                ok: true,
                message: 'If that email exists, you will receive a login link shortly.'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate magic link token
        const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');

        // Hash token for storage
        const encoder = new TextEncoder();
        const tokenData = encoder.encode(token + env.AUTH_TOKEN_SECRET);
        const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData);
        const tokenHash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Store token with 15 minute expiry
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const linkId = crypto.randomUUID();

        await env.DB.prepare(`
            INSERT INTO auth_magic_links (id, workspace_id, email, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(linkId, env.WORKSPACE_ID, email, tokenHash, expiresAt).run();

        // Send email via Resend
        const loginUrl = `${new URL(request.url).origin}/api/auth/consume?token=${token}`;

        try {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: env.EMAIL_FROM,
                    to: email,
                    subject: 'Your PT Console Login Link',
                    html: `
                        <h2>PT Console Login</h2>
                        <p>Click the link below to access your PT console:</p>
                        <p><a href="${loginUrl}">${loginUrl}</a></p>
                        <p>This link expires in 15 minutes.</p>
                        <p>If you didn't request this, you can safely ignore this email.</p>
                    `
                })
            });
        } catch (emailError) {
            console.error('Failed to send magic link email:', emailError);
            return new Response(JSON.stringify({ ok: false, error: 'Failed to send email' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            ok: true,
            message: 'If that email exists, you will receive a login link shortly.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Request link error:', error);
        return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
