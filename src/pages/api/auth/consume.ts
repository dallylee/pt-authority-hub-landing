/// <reference types="@cloudflare/workers-types" />
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals, redirect }) => {
    try {
        const env = locals.runtime.env as {
            DB: D1Database;
            WORKSPACE_ID: string;
            AUTH_TOKEN_SECRET: string;
            SESSION_SECRET: string;
        };

        if (!env.DB) {
            return new Response('Database not configured', { status: 500 });
        }

        const url = new URL(request.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return new Response('Missing token', { status: 400 });
        }

        // Hash token for lookup
        const encoder = new TextEncoder();
        const tokenData = encoder.encode(token + env.AUTH_TOKEN_SECRET);
        const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData);
        const tokenHash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Look up magic link
        const linkResult = await env.DB.prepare(`
            SELECT id, email, expires_at, used_at 
            FROM auth_magic_links 
            WHERE workspace_id = ? AND token_hash = ?
        `).bind(env.WORKSPACE_ID, tokenHash).first();

        if (!linkResult) {
            return new Response('Invalid or expired link', { status: 403 });
        }

        // Check if already used
        if (linkResult.used_at) {
            return new Response('Link already used', { status: 403 });
        }

        // Check if expired
        const now = new Date();
        const expiresAt = new Date(linkResult.expires_at as string);
        if (now > expiresAt) {
            return new Response('Link expired', { status: 403 });
        }

        // Mark as used
        await env.DB.prepare(
            'UPDATE auth_magic_links SET used_at = datetime("now") WHERE id = ?'
        ).bind(linkResult.id).run();

        // Get user
        const userResult = await env.DB.prepare(
            'SELECT id, email, name, role FROM pt_users WHERE workspace_id = ? AND email = ?'
        ).bind(env.WORKSPACE_ID, linkResult.email).first();

        if (!userResult) {
            return new Response('User not found', { status: 403 });
        }

        // Create session
        const sessionToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');

        // Hash session token
        const sessionData = encoder.encode(sessionToken + env.SESSION_SECRET);
        const sessionHashBuffer = await crypto.subtle.digest('SHA-256', sessionData);
        const sessionTokenHash = Array.from(new Uint8Array(sessionHashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // 7 day expiry
        const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const sessionId = crypto.randomUUID();

        await env.DB.prepare(`
            INSERT INTO pt_sessions (id, workspace_id, user_id, session_token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(sessionId, env.WORKSPACE_ID, userResult.id, sessionTokenHash, sessionExpiresAt).run();

        // Set cookie and redirect
        const headers = new Headers();
        headers.set('Set-Cookie', `pt_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
        headers.set('Location', '/pt');

        return new Response(null, {
            status: 302,
            headers
        });

    } catch (error: any) {
        console.error('Consume token error:', error);
        return new Response('Login failed', { status: 500 });
    }
};
