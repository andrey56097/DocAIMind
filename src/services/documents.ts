/**
 * DocMind — Document CRUD
 *
 * High-level operations for creating, reading, and deleting documents
 * along with their chunk embeddings.
 */

import type { AppDocument, AnswerResult } from "../types";
import { supabaseFetch, supabaseApi, deleteFileFromStorage } from "./supabase";
import { openaiEmbedding, askGPT } from "./openai";
import { cosineSimilarity, chunkText, simpleEmbedding } from "../embeddings";

// ============================================
// Create
// ============================================

/**
 * Create a document record and its chunk embeddings. Returns the chunk count.
 */
export async function createDocumentWithChunks(
  title: string,
  filePath: string,
  fileSize: number,
  cleanText: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ docId: string; totalChunks: number; totalTokens: number }> {
  // Create document
  const doc = await supabaseApi<AppDocument | AppDocument[]>(
    "POST",
    "/rest/v1/documents",
    { title, file_path: filePath, file_size: fileSize },
  );
  const docId = ((doc as any)[0]?.id ?? (doc as any).id) as string;

  // Chunk
  const chunks = chunkText(cleanText);
  let totalTokens = 0;

  for (let i = 0; i < chunks.length; i++) {
    const text = chunks[i];
    if (!text || text.length < 10) continue;
    onProgress?.(i + 1, chunks.length);

    try {
      let embedding: number[];
      try {
        embedding = await openaiEmbedding(text);
        totalTokens += Math.ceil(text.length / 4);
      } catch {
        embedding = simpleEmbedding(text);
      }
      await supabaseApi("POST", "/rest/v1/chunks", {
        document_id: docId,
        content: text,
        embedding,
        order: i,
      });
    } catch (e) {
      console.error(`Chunk ${i} failed:`, e);
    }
  }

  return { docId, totalChunks: chunks.length, totalTokens };
}

// ============================================
// Read
// ============================================

/** Fetch all documents from Supabase. */
export async function fetchDocuments(): Promise<AppDocument[]> {
  return (
    (await supabaseFetch<AppDocument[]>(
      "/rest/v1/documents?order=created_at.desc",
    )) ?? []
  );
}

// ============================================
// Delete
// ============================================

/** Delete a document and its chunks from DB + storage. */
export async function deleteDocument(
  id: string,
  filePath: string,
): Promise<void> {
  await deleteFileFromStorage(filePath);

  try {
    await supabaseFetch(`/rest/v1/chunks?document_id=eq.${id}`, {
      method: "DELETE",
    });
  } catch {}
  try {
    await supabaseFetch(`/rest/v1/documents?id=eq.${id}`, {
      method: "DELETE",
    });
  } catch {}
}

// ============================================
// Ask / Search
// ============================================

const GPT_INPUT_COST_PER_TOKEN = 0.15 / 1_000_000;
const GPT_OUTPUT_COST_PER_TOKEN = 0.6 / 1_000_000;
const EMBED_COST_PER_TOKEN = 0.02 / 1_000_000;

/**
 * Answer a question against the loaded documents.
 * Uses OpenAI for embedding + GPT, with simple fallback.
 */
export async function askQuestion(
  question: string,
  documents: AppDocument[],
  selectedIds: Set<string>,
): Promise<AnswerResult> {
  const docIds =
    selectedIds.size > 0
      ? Array.from(selectedIds)
      : documents.map((d) => d.id);

  if (docIds.length === 0) {
    return {
      answer: "No documents available.",
      sources: [],
      usage: { totalTokens: 0, totalCost: "$0.00" },
    };
  }

  // Question embedding
  const questionVec = await openaiEmbedding(question);
  const embedTokens = Math.ceil(question.length / 4);

  // Fetch chunks
  const allChunks =
    (await supabaseFetch<any[]>(
      "/rest/v1/chunks?select=id,content,document_id,embedding,order",
    )) ?? [];
  const chunks = allChunks.filter((c) => docIds.includes(c.document_id));

  if (chunks.length === 0) {
    return {
      answer: "No relevant information found in the selected documents.",
      sources: [],
      usage: { totalTokens: 0, totalCost: "$0.00" },
    };
  }

  // Score
  const scored = chunks.map((c) => ({
    ...c,
    score: cosineSimilarity(questionVec, c.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);

  // Build context
  const docMap = new Map(documents.map((d) => [d.id, d]));
  const context = top
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${docMap.get(c.document_id)?.title ?? "Unknown"}]\n${c.content}`,
    )
    .join("\n\n---\n\n");

  // GPT
  const gptRes = await askGPT(
    "You answer questions based on the provided document context. Be concise and cite sources.",
    `${context}\n\nQuestion: ${question}`,
  );

  const inputCost = gptRes.inputTokens * GPT_INPUT_COST_PER_TOKEN;
  const outputCost = gptRes.outputTokens * GPT_OUTPUT_COST_PER_TOKEN;
  const embedCost = embedTokens * EMBED_COST_PER_TOKEN;
  const totalCost = inputCost + outputCost + embedCost;

  // Deduplicate sources
  const seen = new Set<string>();
  const sources = [];
  for (const c of top) {
    if (!seen.has(c.document_id)) {
      seen.add(c.document_id);
      const d = docMap.get(c.document_id);
      if (d) sources.push({ id: d.id, title: d.title, file_path: d.file_path });
    }
  }

  return {
    answer: gptRes.content,
    sources,
    usage: {
      totalTokens: embedTokens + gptRes.inputTokens + gptRes.outputTokens,
      totalCost: `$${totalCost.toFixed(6)}`,
    },
  };
}
