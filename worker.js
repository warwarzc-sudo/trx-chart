function resultFromHash(hash) {
  const part = hash.length > 16 ? hash.slice(16) : hash;
  for (let i = part.length - 1; i >= 0; i--) {
    const ch = part[i];
    if (ch >= "0" && ch <= "9") return parseInt(ch, 10);
  }
  for (let i = hash.length - 1; i >= 0; i--) {
    const ch = hash[i];
    if (ch >= "0" && ch <= "9") return parseInt(ch, 10);
  }
  return 0;
}

function toPeriod(ts) {
  const d = new Date(ts);
  return (
    String(d.getUTCFullYear()) +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    String(d.getUTCDate()).padStart(2, "0") +
    String(d.getUTCHours()).padStart(2, "0") +
    String(d.getUTCMinutes()).padStart(2, "0")
  );
}

function toBlockTime(ts) {
  const d = new Date(ts);
  return (
    String(d.getUTCHours()).padStart(2, "0") + ":" +
    String(d.getUTCMinutes()).padStart(2, "0") + ":" +
    String(d.getUTCSeconds()).padStart(2, "0")
  );
}

function toRecord(row) {
  const ts = row.timestamp;
  const sec = new Date(ts).getUTCSeconds();
  if (sec !== 54) return null;

  const result = resultFromHash(row.hash);
  return {
    period: toPeriod(ts),
    blockHeight: row.number,
    blockTime: toBlockTime(ts),
    hash: row.hash,
    timestamp: ts,
    second: sec,
    result,
    bigSmall: result >= 5 ? "Big" : "Small"
  };
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return jsonResponse({ ok: true });
    }

    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "latest";
    const start = Math.max(0, parseInt(url.searchParams.get("start") || "0", 10));
    const limit = Math.min(60, Math.max(1, parseInt(url.searchParams.get("limit") || "40", 10)));
    const ts = Date.now();

    const upstreamUrl =
      `https://apilist.tronscanapi.com/api/block?sort=-number&start=${start}&limit=${limit}&_ts=${ts}`;

    const upstreamResp = await fetch(upstreamUrl, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    const upstreamData = await upstreamResp.json();
    const rows = Array.isArray(upstreamData.data) ? upstreamData.data : [];

    if (mode === "latest") {
      const records = rows
        .map(toRecord)
        .filter(Boolean)
        .sort((a, b) => b.timestamp - a.timestamp);

      return jsonResponse({
        record: records.length ? records[0] : null
      });
    }

    const records = rows
      .map(toRecord)
      .filter(Boolean)
      .sort((a, b) => a.period.localeCompare(b.period));

    return jsonResponse({
      records,
      oldestTs: rows.length ? rows[rows.length - 1].timestamp : null,
      newestTs: rows.length ? rows[0].timestamp : null,
      rowCount: rows.length
    });
  }
};
