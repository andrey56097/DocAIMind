/**
 * DocAIMind — Persistent AI Usage Service
 *
 * Saves and loads per-user AI usage stats (tokens, cost, question count)
 * to/from Supabase so stats survive page reloads and sessions.
 */

import { supabase } from "./supabase";

export interface UsageRecord {
  total_tokens: number;
  total_cost: number;
  question_count: number;
}

const USAGE_TABLE = "user_usage";

/**
 * Fetch persisted usage for a given user.
 * Returns null if no record exists yet.
 */
export async function fetchUsage(
  userId: string,
): Promise<UsageRecord | null> {
  const { data, error } = await supabase
    .from(USAGE_TABLE)
    .select("total_tokens,total_cost,question_count")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch usage:", error.message);
    return null;
  }

  return data;
}

/**
 * Upsert usage for a given user.
 * Creates a record if one doesn't exist, otherwise updates it.
 */
export async function updateUsage(
  userId: string,
  tokens: number,
  cost: number,
  questionCount: number,
): Promise<void> {
  // First check if record exists
  const { data: existing } = await supabase
    .from(USAGE_TABLE)
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  console.log("updateUsage: userId=%s tokens=%d cost=%f count=%d", userId, tokens, cost, questionCount);

  if (existing) {
    console.log("updateUsage: updating existing record", existing.id);
    const { error } = await supabase
      .from(USAGE_TABLE)
      .update({
        total_tokens: tokens,
        total_cost: cost,
        question_count: questionCount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to update usage:", error.message);
    } else {
      console.log("updateUsage: update succeeded");
    }
  } else {
    console.log("updateUsage: inserting new record for user", userId);
    const { error } = await supabase.from(USAGE_TABLE).insert({
      user_id: userId,
      total_tokens: tokens,
      total_cost: cost,
      question_count: questionCount,
    });

    if (error) {
      console.error("Failed to insert usage:", error.message);
    } else {
      console.log("updateUsage: insert succeeded");
    }
  }
}
