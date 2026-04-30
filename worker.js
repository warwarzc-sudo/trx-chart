export default {
    async fetch(request) {
        const url = new URL(request.url);
        const start = url.searchParams.get("start") || "0";
        const limit = url.searchParams.get("limit") || "40";
        const ts = Date.now();

        const apiUrl = `https://apilist.tronscanapi.com/api/block?sort=-number&start=${start}&limit=${limit}&_ts=${ts}`;

        const resp = await fetch(apiUrl, {
            headers: {
                "Accept": "application/json"
            }
        });

        const data = await resp.json();

        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store"
            }
        });
    }
};
