import type { APIRoute } from "astro";

type Env = {
    DB: D1Database;
    WORKSPACE_ID?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
};

export const POST: APIRoute = async ({ params, request, locals }) => {
    try {
        const env = (locals as any)?.runtime?.env as Env | undefined;
        const { id } = params;

        if (!id) {
            return new Response(JSON.stringify({ ok: false, error: "Lead ID required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!env?.DB) {
            return new Response(JSON.stringify({ ok: false, error: "DB binding missing" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const workspaceId = env.WORKSPACE_ID;
        if (!workspaceId) {
            return new Response(JSON.stringify({ ok: false, error: "WORKSPACE_ID missing" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
            return new Response(JSON.stringify({ ok: false, error: "Email configuration missing" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Parse request body
        const body = await request.json() as {
            draft: string;
            subject?: string;
        };

        if (!body.draft || body.draft.trim().length === 0) {
            return new Response(JSON.stringify({ ok: false, error: "Analysis draft is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get lead details
        const lead = await env.DB
            .prepare(`SELECT id, client_email, client_first_name, triage_segment FROM leads WHERE id = ? AND workspace_id = ?;`)
            .bind(id, workspaceId)
            .first();

        if (!lead) {
            return new Response(JSON.stringify({ ok: false, error: "Lead not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!lead.client_email) {
            return new Response(JSON.stringify({ ok: false, error: "Lead has no email address" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get workspace for booking link (if HOT lead)
        let bookingLink = '';
        if (lead.triage_segment === 'HOT') {
            try {
                const workspace = await env.DB
                    .prepare(`SELECT booking_link_url FROM workspaces WHERE id = ?;`)
                    .bind(workspaceId)
                    .first();
                if (workspace?.booking_link_url) {
                    bookingLink = workspace.booking_link_url as string;
                }
            } catch (e) {
                // Workspace may not exist, continue without booking link
            }
        }

        // Prepare email
        const subject = body.subject || `Your Performance Analysis - PT Authority Hub`;
        const firstName = lead.client_first_name || 'there';

        let emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Hi ${firstName},</h2>
                <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">
${body.draft}
                </div>
        `;

        // Add booking CTA for HOT leads
        if (bookingLink && lead.triage_segment === 'HOT') {
            emailHtml += `
                <div style="margin-top: 32px; padding: 24px; background: #f8f8f8; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 16px 0; color: #333;"><strong>Ready to get started?</strong></p>
                    <a href="${bookingLink}" style="display: inline-block; padding: 12px 32px; background: #00ff88; color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600;">Book Your Discovery Call</a>
                </div>
            `;
        }

        emailHtml += `
                <p style="margin-top: 32px; color: #666; font-size: 14px;">
                    Best regards,<br>
                    PT Authority Hub
                </p>
            </div>
        `;

        // Send via Resend
        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: env.EMAIL_FROM,
                to: lead.client_email,
                subject: subject,
                html: emailHtml
            })
        });

        if (!resendRes.ok) {
            const errorText = await resendRes.text();
            console.error('Resend error:', errorText);
            return new Response(JSON.stringify({ ok: false, error: "Failed to send email" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Update lead with analysis_draft and analysis_sent_at
        await env.DB.prepare(`
            UPDATE leads 
            SET analysis_draft = ?, analysis_sent_at = datetime('now'), updated_at = datetime('now') 
            WHERE id = ? AND workspace_id = ?;
        `).bind(body.draft, id, workspaceId).run();

        return new Response(JSON.stringify({
            ok: true,
            message: `Analysis sent to ${lead.client_email}`,
            sentAt: new Date().toISOString()
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error('Send analysis error:', err);
        return new Response(
            JSON.stringify({ ok: false, error: "Internal server error", detail: String(err?.message ?? err) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
