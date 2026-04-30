export default {
  async fetch(request) {
    const url = new URL(request.url);
    const start = url.searchParams.get("start") || "0";
    const limit = url.searchParams.get("limit") || "40";
    const ts = Date.now();

    const apiUrl = `https://apilist.tronscanapi.com/api/block?sort=-number&start=${start}&limit=${limit}&_ts=${ts}`;

    const resp = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      cf: {
        cacheTtl: 0,
        cacheEverything: false
      }
    });

    const data = await resp.text();

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  }
};
