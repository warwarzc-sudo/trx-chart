const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);

  // GET /api/tracker-sync?u=warwarzc
  if (request.method === "GET") {
    const userId = url.searchParams.get("u");
    if (!userId) return json({ ok: false, error: "missing user id" }, 400);

    const raw = await env.TRACKER_STATE.get(`state:${userId}`);
    if (!raw) return json({ ok: true, state: null });

    return json({ ok: true, state: JSON.parse(raw) });
  }

  // POST /api/tracker-sync
  if (request.method === "POST") {
    const auth = request.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!env.SYNC_TOKEN || token !== env.SYNC_TOKEN) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "invalid json" }, 400);
    }

    if (!body.userId) {
      return json({ ok: false, error: "missing userId" }, 400);
    }

    const state = {
      userId: body.userId,
      balance: Number(body.balance || 0),
      bets: Array.isArray(body.bets) ? body.bets.slice(0, 500) : [],
      updatedAt: Date.now()
    };

    await env.TRACKER_STATE.put(
      `state:${body.userId}`,
      JSON.stringify(state)
    );

    return json({ ok: true, updatedAt: state.updatedAt, count: state.bets.length });
  }

  return json({ ok: false, error: "method not allowed" }, 405);
}
