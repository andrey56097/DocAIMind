import "@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, authorization",
};

function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let bp = end;
    if (end < text.length) {
      const s = text.slice(Math.max(start, end - 100), end);
      const pb = s.lastIndexOf("\n\n");
      if (pb > 20) bp = Math.max(start, end - 100) + pb + 2;
      else { const sb = Math.max(s.lastIndexOf(". "), s.lastIndexOf("! "), s.lastIndexOf("? "), s.lastIndexOf("\n")); if (sb > 20) bp = Math.max(start, end - 100) + sb + 1; }
    }
    const c = text.slice(start, bp).trim();
    if (c) chunks.push(c);
    start = bp - overlap;
    if (start < 0) start = 0;
  }
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const { filePath, fileName, fileSize } = await req.json();
    if (!filePath || !fileName) {
      return new Response(JSON.stringify({ error: "filePath and fileName required" }), { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    const fileRes = await fetch(`${SUPABASE_URL}/storage/v1/object/documents/${filePath}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!fileRes.ok) return new Response(JSON.stringify({ error: "File not found" }), { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

    const text = new TextDecoder("utf-8", { fatal: false }).decode(await fileRes.arrayBuffer())
      .split("").filter(c => { const code = c.charCodeAt(0); return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9; }).join("").trim();

    if (text.length < 50) return new Response(JSON.stringify({ error: "Could not extract text" }), { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

    const chunks = chunkText(text);

    return new Response(JSON.stringify({ success: true, chunks: chunks.length, textLength: text.length }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});
