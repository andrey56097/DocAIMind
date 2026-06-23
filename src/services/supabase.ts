/**
 * DocAIMind — Supabase client
 *
 * Single shared instance of @supabase/supabase-js used for all
 * database, storage, and auth operations.
 *
 * Using the official client ensures correct JWT lifecycle, role
 * switching (anon ↔ authenticated), and proper RLS enforcement.
 */

import { createClient, type User } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../config";

const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!anonKey) throw new Error("VITE_SUPABASE_ANON_KEY is not set");

const supabase = createClient(SUPABASE_URL, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

// ============================================
// Database
// ============================================

/** Raw Supabase client instance (for advanced use cases). */
export { supabase };

// ============================================
// Auth
// ============================================

let cachedUser: User | null = null;

/** Try to restore an existing session on page load. */
export async function restoreSession(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  cachedUser = session?.user ?? null;
  return cachedUser;
}

/** Sign in with Google — opens Supabase-hosted OAuth flow. */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  cachedUser = null;
}

/** Get the cached user (after restoreSession). */
export function getUser(): User | null {
  return cachedUser;
}

/** Listen for auth state changes (login / logout across tabs). */
export function onAuthStateChange(
  cb: (user: User | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null;
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") cachedUser = user;
    else if (event === "SIGNED_OUT") cachedUser = null;
    cb(user);
  });
  return () => subscription.unsubscribe();
}

// ============================================
// Storage
// ============================================

const STORAGE_BUCKET = "documents";

/** Upload a file to Supabase Storage. */
export async function uploadFile(
  file: File,
  filePath: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

/** Delete a file from Supabase Storage. */
export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);
  if (error) console.error("Storage delete error:", error.message);
}
