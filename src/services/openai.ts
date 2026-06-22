/**
 * DocMind — OpenAI client
 *
 * Handles embedding generation and chat completion via the OpenAI REST API.
 */

import { OPENAI_API_KEY } from "../config";

async function openaiFetch(path: string, body: unknown): Promise<Response> {
  const res = await fetch(`https://api.openai.com/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
  return res;
}

/** Generate an embedding vector for the given text. */
export async function openaiEmbedding(text: string): Promise<number[]> {
  const res = await openaiFetch("/embeddings", {
    model: "text-embedding-3-small",
    input: text,
  });
  const data = await res.json();
  return data.data[0].embedding;
}

/** Send a chat request to GPT and return the response content + token usage. */
export async function askGPT(
  system: string,
  user: string,
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const res = await openaiFetch("/chat/completions", {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });
  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}
