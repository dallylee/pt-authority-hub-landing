export const prerender = false;

import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();

    // Access bindings provided by Cloudflare adapter
    const env = context.locals.runtime?.env;
    const DB = env?.DB;

    if (!DB) {
      return new Response(JSON.stringify({ ok: false, error: "Missing DB binding" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // TODO: validate body, compute triage score, create lead_token_hash, insert into D1
    // TODO: send email via Resend

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown error" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
};
