import type { APIRoute } from "astro";

type Env = {
  DB: D1Database;
  WORKSPACE_ID?: string;
};

async function tableHasColumn(db: D1Database, table: string, col: string) {
  const res = await db.prepare(`PRAGMA table_info(${table});`).all();
  const rows = (res.results ?? []) as Array<{ name: string }>;
  return rows.some((r) => r.name === col);
}

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const env = (locals as any)?.runtime?.env as Env | undefined;

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

    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50") || 50, 200);

    // Order by created_at if it exists, otherwise rowid
    const hasCreatedAt = await tableHasColumn(env.DB, "leads", "created_at");
    const orderBy = hasCreatedAt ? "created_at DESC" : "rowid DESC";

    const rs = await env.DB
      .prepare(`SELECT * FROM leads WHERE workspace_id = ? ORDER BY ${orderBy} LIMIT ?;`)
      .bind(workspaceId, limit)
      .all();

    return new Response(JSON.stringify({ ok: true, leads: rs.results ?? [] }), {
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
