import type { APIRoute } from "astro";

type Env = {
    DB: D1Database;
    WORKSPACE_ID?: string;
    DOWNLOAD_TOKEN_SECRET?: string;
};

// Generate a signed download token
async function generateDownloadToken(key: string, secret: string): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hour expiry
    const payload = { key, exp };
    const payloadB64 = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payloadB64));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return `${payloadB64}.${sigB64}`;
}

export const GET: APIRoute = async ({ params, locals }) => {
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

        const lead = await env.DB
            .prepare(`SELECT * FROM leads WHERE id = ? AND workspace_id = ?;`)
            .bind(id, workspaceId)
            .first();

        if (!lead) {
            return new Response(JSON.stringify({ ok: false, error: "Lead not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get uploads for this lead
        let uploads: any[] = [];
        try {
            const uploadsRes = await env.DB
                .prepare(`SELECT id, file_name, file_size_bytes, mime_type, storage_key, created_at FROM uploads WHERE lead_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC;`)
                .bind(id)
                .all();
            uploads = uploadsRes.results ?? [];

            // Add download URLs if we have the secret
            if (env.DOWNLOAD_TOKEN_SECRET && uploads.length > 0) {
                for (const upload of uploads) {
                    if (upload.storage_key) {
                        const token = await generateDownloadToken(upload.storage_key, env.DOWNLOAD_TOKEN_SECRET);
                        (upload as any).download_url = `/api/download?t=${encodeURIComponent(token)}`;
                    }
                }
            }
        } catch (e) {
            // Table might not exist yet, continue without uploads
        }

        return new Response(JSON.stringify({ ok: true, lead, uploads }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err: any) {
        return new Response(
            JSON.stringify({ ok: false, error: "Internal server error", detail: String(err?.message ?? err) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};

// Update lead notes and status
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

        const body = await request.json() as { notes?: string; status?: string };

        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];

        if (body.notes !== undefined) {
            updates.push("internal_notes = ?");
            values.push(body.notes);
        }

        if (body.status !== undefined) {
            updates.push("status = ?");
            values.push(body.status);
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({ ok: false, error: "No fields to update" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        updates.push("updated_at = datetime('now')");
        values.push(id, workspaceId);

        await env.DB
            .prepare(`UPDATE leads SET ${updates.join(", ")} WHERE id = ? AND workspace_id = ?;`)
            .bind(...values)
            .run();

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err: any) {
        return new Response(
            JSON.stringify({ ok: false, error: "Internal server error", detail: String(err?.message ?? err) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
