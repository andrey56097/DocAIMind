import "@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, authorization",
};

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; ma += a[i] * a[i]; mb += b[i] * b[i];
  }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

function simpleEmbedding(text: string): number[] {
  const dims = 128;
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash |= 0;
    }
    vec[Math.abs(hash) % dims] += 1;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return mag > 0 ? vec.map(v => v / mag) : vec;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const { question, documentIds } = await req.json();
    if (!question) {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const questionVec = simpleEmbedding(question);
    const embeddingTokens = Math.ceil(question.length / 4);

    // Fetch all chunks
    const chunksRes = await fetch(`${SUPABASE_URL}/rest/v1/chunks?select=id,content,document_id,embedding,documents!inner(title,file_path)&order=created_at.desc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });

    if (!chunksRes.ok) {
      return new Response(JSON.stringify({ error: "Search failed" }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let chunks = await chunksRes.json();
    if (documentIds && documentIds.length > 0) {
      chunks = chunks.filter((c: any) => documentIds.includes(c.document_id));
    }

    if (!chunks || chunks.length === 0) {
      return new Response(JSON.stringify({
        answer: "No relevant information found in documents.",
        sources: [],
        usage: { embeddingTokens, inputTokens: 0, outputTokens: 0, totalTokens: embeddingTokens, totalCost: "$0.00" },
      }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    // Score and pick top chunks
    const scored = chunks.map((c: any) => ({ ...c, score: cosineSimilarity(questionVec, c.embedding) }));
    scored.sort((a: any, b: any) => b.score - a.score);
    const topChunks = scored.slice(0, 3);

    const sources = Array.from(
      new Map(topChunks.map((c: any) => [c.document_id, {
        id: c.document_id, title: c.documents.title, file_path: c.documents.file_path,
      }])).values()
    );

    // Return chunks as context — AI call will happen in browser
    return new Response(JSON.stringify({
      chunks: topChunks.map((c: any) => ({
        content: c.content,
        title: c.documents.title,
        score: c.score,
      })),
      sources,
      usage: { embeddingTokens, inputTokens: 0, outputTokens: 0, totalTokens: embeddingTokens, totalCost: "$0.00" },
    }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("ask-question error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
