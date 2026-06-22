/** DocAIMind — embedding utilities */

const EMBEDDING_DIMS = 1536; // matches OpenAI text-embedding-3-small

/**
 * Simple keyword-based embedding (fallback when OpenAI is unavailable).
 * Produces a normalised vector of the same dimension as OpenAI embeddings.
 */
export function simpleEmbedding(text: string): number[] {
  const vec = new Array(EMBEDDING_DIMS).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash |= 0;
    }
    vec[Math.abs(hash) % EMBEDDING_DIMS] += 1;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return mag > 0 ? vec.map((v) => v / mag) : vec;
}

/** Cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

/**
 * Split text into chunks of roughly `chunkSize` characters,
 * breaking at sentence boundaries when possible.
 */
export function chunkText(text: string, chunkSize = 800): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    if (end < text.length) {
      const snippet = text.slice(Math.max(0, end - 100), end);
      let breakIdx = -1;
      for (const sep of ["\n\n", ". ", "! ", "? ", "\n"]) {
        const idx = snippet.lastIndexOf(sep);
        if (idx > breakIdx) breakIdx = idx;
      }
      if (breakIdx > 10) {
        end = Math.max(0, end - 100) + breakIdx + 1;
      }
    }
    const c = text.slice(start, end).trim();
    if (c) chunks.push(c);
    start = end;
    if (start >= text.length) break;
  }
  return chunks;
}
