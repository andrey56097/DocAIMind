/** DocAIMind — configuration */

// ============================================================
// All config comes from environment variables (VITE_ prefix).
// You must copy .env.development.example or .env.production.example
// to .env and fill in your values BEFORE running the app.
//
// Where to find these values:
//   SUPABASE_URL / SUPABASE_ANON_KEY → Supabase Dashboard → Settings → API
//   OPENAI_API_KEY                    → https://platform.openai.com/api-keys
// ============================================================

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY ?? "";

export const ENV = import.meta.env.VITE_ENV ?? "development";

export const APP_NAME = "DocAIMind";
export const APP_DESCRIPTION = "AI Knowledge Base";
