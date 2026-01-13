/// <reference types="@cloudflare/workers-types" />

interface Env {
    DB: D1Database;
    RESEND_API_KEY: string;
    EMAIL_TO: string;
    EMAIL_FROM: string;
    DOWNLOAD_TOKEN_SECRET: string;
    AUDIT_UPLOADS: R2Bucket;
    WORKSPACE_ID: string;
    UPLOAD_MAX_BYTES?: string;
    UPLOAD_ALLOWED_TYPES?: string;
}

interface CFContext {
    request: Request;
    env: Env;
}

const DEFAULT_MAX_BYTES = 15728640; // 15 MB
const DEFAULT_ALLOWED_TYPES = 'application/pdf,image/jpeg,image/png,text/csv';

export const onRequestPost = async (context: CFContext): Promise<Response> => {
    try {
        // Check required bindings
        if (!context.env.AUDIT_UPLOADS) {
            return new Response(JSON.stringify({ ok: false, error: 'R2 binding AUDIT_UPLOADS missing' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        if (!context.env.DOWNLOAD_TOKEN_SECRET) {
            return new Response(JSON.stringify({ ok: false, error: 'DOWNLOAD_TOKEN_SECRET not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        if (!context.env.RESEND_API_KEY || !context.env.EMAIL_TO || !context.env.EMAIL_FROM) {
            return new Response(JSON.stringify({ ok: false, error: 'Email configuration missing (RESEND_API_KEY, EMAIL_TO, EMAIL_FROM)' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const formData = await context.request.formData();
        const file = formData.get('file') as File | null;
        const email = formData.get('email') as string | null;
        const leadId = formData.get('leadId') as string | null;
        const leadToken = formData.get('leadToken') as string | null;
        const consent = formData.get('consent') as string | null;

        // Validate required fields
        if (!file || !(file instanceof File)) {
            return new Response(JSON.stringify({ ok: false, error: 'No file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        if (consent !== 'true') {
            return new Response(JSON.stringify({ ok: false, error: 'Consent required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate leadToken if provided and DB is available
        let validatedLeadId = leadId;
        if (leadToken && context.env.DB && context.env.WORKSPACE_ID) {
            try {
                // Hash the token to look up in database
                const encoder = new TextEncoder();
                const tokenData = encoder.encode(leadToken);
                const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData);
                const tokenHash = Array.from(new Uint8Array(hashBuffer))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');

                // Look up lead by token hash
                const leadResult = await context.env.DB.prepare(
                    'SELECT id, client_email FROM leads WHERE workspace_id = ? AND lead_token_hash = ?'
                ).bind(context.env.WORKSPACE_ID, tokenHash).first();

                if (leadResult) {
                    validatedLeadId = leadResult.id as string;
                    console.log('Upload linked to lead:', validatedLeadId);
                } else {
                    console.warn('Invalid leadToken provided, upload will be unlinked');
                }
            } catch (err) {
                console.error('Lead token validation error:', err);
                // Continue with upload even if validation fails
            }
        }

        // Validate file size
        const maxBytes = parseInt(context.env.UPLOAD_MAX_BYTES || '') || DEFAULT_MAX_BYTES;
        if (file.size > maxBytes) {
            return new Response(JSON.stringify({ ok: false, error: `File too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate file type
        const allowedTypes = (context.env.UPLOAD_ALLOWED_TYPES || DEFAULT_ALLOWED_TYPES).split(',');
        if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ ok: false, error: `File type not allowed. Accepted: PDF, JPG, PNG, CSV` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate key path
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const uuid = crypto.randomUUID();
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
        const key = `uploads/${year}/${month}/${leadId || 'unknown'}/${uuid}_${sanitizedFilename}`;

        // Store in R2
        await context.env.AUDIT_UPLOADS.put(key, file.stream(), {
            httpMetadata: {
                contentType: file.type
            },
            customMetadata: {
                email: email,
                leadId: validatedLeadId || '',
                originalName: file.name,
                uploadedAt: now.toISOString()
            }
        });

        // Store in D1 if DB is available
        if (context.env.DB && context.env.WORKSPACE_ID) {
            try {
                const uploadId = crypto.randomUUID();

                // Insert upload row
                await context.env.DB.prepare(`
                    INSERT INTO uploads (
                        id, workspace_id, lead_id, file_name, mime_type, 
                        file_size_bytes, storage_key, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
                `).bind(
                    uploadId,
                    context.env.WORKSPACE_ID,
                    validatedLeadId || null,
                    file.name,
                    file.type,
                    file.size,
                    key
                ).run();

                // Update lead upload_status if linked
                if (validatedLeadId) {
                    await context.env.DB.prepare(
                        'UPDATE leads SET upload_status = ?, updated_at = datetime("now") WHERE id = ?'
                    ).bind('RECEIVED', validatedLeadId).run();

                    console.log('Lead upload_status updated to RECEIVED for:', validatedLeadId);
                }
            } catch (dbErr) {
                console.error('D1 upload record error:', dbErr);
                // Don't fail the upload if D1 fails
            }
        }

        // Generate signed download token (valid 30 days)
        const expiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        const payload = JSON.stringify({ key, exp: expiry, nonce: crypto.randomUUID() });
        const payloadB64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const encoder = new TextEncoder();
        const keyData = encoder.encode(context.env.DOWNLOAD_TOKEN_SECRET);
        const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payloadB64));
        const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const token = `${payloadB64}.${sigB64}`;
        const downloadUrl = `https://pt-authority-hub-landing.pages.dev/api/download?t=${token}`;

        // Send notification email via Resend
        let emailNotice = 'sent';
        try {
            const emailHtml = `
                <h2>New Audit File Upload</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Lead ID:</strong> ${leadId || 'N/A'}</p>
                <p><strong>Uploaded At:</strong> ${now.toISOString()}</p>
                <hr>
                <p><strong>File Name:</strong> ${file.name}</p>
                <p><strong>File Type:</strong> ${file.type}</p>
                <p><strong>File Size:</strong> ${(file.size / 1024).toFixed(1)} KB</p>
                <hr>
                <p><strong>Download Link (expires in 30 days):</strong></p>
                <p><a href="${downloadUrl}">${downloadUrl}</a></p>
            `;

            const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: context.env.EMAIL_FROM,
                    to: context.env.EMAIL_TO,
                    subject: `New audit upload received: ${email}`,
                    html: emailHtml
                })
            });

            if (!resendRes.ok) {
                console.error('Resend error:', await resendRes.text());
                emailNotice = 'failed';
            }
        } catch (e) {
            console.error('Email send error:', e);
            emailNotice = 'failed';
        }

        return new Response(JSON.stringify({
            ok: true,
            key: key,
            originalName: file.name,
            size: file.size,
            contentType: file.type,
            emailNotice: emailNotice
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Upload API Error:', error);
        return new Response(JSON.stringify({ ok: false, error: 'Upload failed: ' + (error.message || 'Unknown error') }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
