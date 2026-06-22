/**
 * DocMind — Supabase REST client
 *
 * Generic helpers for interacting with the Supabase REST API
 * (used instead of the supabase-js SDK).
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

/** Generic Supabase REST call — returns parsed JSON or undefined for empty responses. */
export async function supabaseFetch<T>(
  path: string,
  opts: RequestInit = {},
): Promise<T | undefined> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    let msg: string;
    try {
      msg = JSON.parse(text).message || text;
    } catch {
      msg = text;
    }
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json") && res.status !== 204) {
    return res.json();
  }
  return undefined;
}

/** Supabase insert/update with return value. */
export async function supabaseApi<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }
  return res.json();
}

/** Upload a raw file to Supabase Storage. */
export async function uploadFileToStorage(
  file: File,
  filePath: string,
): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/documents/${filePath}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: file,
    },
  );
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
}

/** Delete a file from Supabase Storage (best-effort). */
export async function deleteFileFromStorage(filePath: string): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/storage/v1/object/documents/${filePath}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
  } catch {
    // best-effort
  }
}
