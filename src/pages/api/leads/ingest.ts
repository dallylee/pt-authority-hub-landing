export const prerender = false;

import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
  const env = context.locals.runtime?.env;
  const DB = env?.DB;

  if (!DB) {
    return new Response(JSON.stringify({ ok: false, error: "Missing DB binding" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const body = await context.request.json();

  // TODO: paste your existing validation, scoring, D1 insert, and Resend code here.

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
