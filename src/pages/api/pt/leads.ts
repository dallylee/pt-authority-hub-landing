import type { APIRoute } from "astro";

type Env = {
  DB: D1Database;
  WORKSPACE_ID?: string;
};

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
    const segmentFilter = url.searchParams.get("segment");
    const uploadFilter = url.searchParams.get("upload_status");

    // Build query with optional filters
    let query = `SELECT 
      id, workspace_id, created_at, updated_at,
      client_email, client_first_name, client_location,
      goal, start_timeline, biggest_blocker, training_days_now, 
      time_commitment_weekly, budget_monthly, coaching_preference,
      injury_flag, injury_notes, wants_upload_stats, upload_status,
      triage_score, triage_segment, inferred_bottleneck, inferred_confidence,
      bottleneck_reasons, bottleneck_breakdown, bottleneck_version,
      internal_notes, status,
      analysis_draft, analysis_sent_at
    FROM leads WHERE workspace_id = ?`;

    const bindings: any[] = [workspaceId];

    // Add segment filter
    if (segmentFilter && segmentFilter !== 'all') {
      query += ` AND triage_segment = ?`;
      bindings.push(segmentFilter.toUpperCase());
    }

    // Add upload status filter
    if (uploadFilter && uploadFilter !== 'all') {
      query += ` AND upload_status = ?`;
      bindings.push(uploadFilter.toUpperCase());
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    bindings.push(limit);

    const rs = await env.DB
      .prepare(query)
      .bind(...bindings)
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
