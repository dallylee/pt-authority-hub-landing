/// <reference types="@cloudflare/workers-types" />
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const env = locals.runtime.env as {
            DOWNLOAD_TOKEN_SECRET: string;
            AUDIT_UPLOADS: R2Bucket;
        };

        // Check required bindings
        if (!env.AUDIT_UPLOADS) {
            return new Response('R2 binding not configured', { status: 500 });
        }
        if (!env.DOWNLOAD_TOKEN_SECRET) {
            return new Response('Download token secret not configured', { status: 500 });
        }

        const url = new URL(request.url);
        const token = url.searchParams.get('t');

        if (!token) {
            return new Response('Missing token', { status: 403 });
        }

        // Parse token
        const parts = token.split('.');
        if (parts.length !== 2) {
            return new Response('Invalid token format', { status: 403 });
        }

        const [payloadB64, sigB64] = parts;

        // Verify signature
        const encoder = new TextEncoder();
        const keyData = encoder.encode(env.DOWNLOAD_TOKEN_SECRET);
        const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);

        // Decode signature
        const sigPadded = sigB64.replace(/-/g, '+').replace(/_/g, '/');
        const sigBytes = Uint8Array.from(atob(sigPadded), c => c.charCodeAt(0));

        const isValid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, encoder.encode(payloadB64));

        if (!isValid) {
            return new Response('Invalid token signature', { status: 403 });
        }

        // Decode and parse payload
        const payloadPadded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
        let payload;
        try {
            payload = JSON.parse(atob(payloadPadded));
        } catch {
            return new Response('Invalid token payload', { status: 403 });
        }

        // Check expiry
        const now = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp < now) {
            return new Response('Token expired', { status: 403 });
        }

        // Fetch from R2
        const object = await env.AUDIT_UPLOADS.get(payload.key);
        if (!object) {
            return new Response('File not found', { status: 404 });
        }

        // Get original filename from metadata
        const originalName = object.customMetadata?.originalName || 'download';

        // Return file
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${originalName}"`);
        headers.set('Cache-Control', 'private, no-cache');

        return new Response(object.body, { headers });

    } catch (error: any) {
        console.error('Download API Error:', error);
        return new Response('Download failed', { status: 500 });
    }
};
