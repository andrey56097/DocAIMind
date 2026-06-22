/**
 * DocMind — Ask handler
 */

import { state } from "../state";
import { dom } from "../dom";
import {
  addMessage,
  showTypingIndicator,
  removeTypingIndicator,
  updateUsageStats,
} from "../ui";
import { askQuestion as askQuestionApi } from "../services/documents";

/** Handle a user question: get answer, update usage, display result. */
export async function handleAsk(question: string): Promise<void> {
  addMessage(question, "user");
  dom.questionInput.value = "";
  showTypingIndicator();
  state.isLoading = true;
  dom.questionInput.disabled = true;
  dom.sendButton.disabled = true;

  try {
    const res = await askQuestionApi(
      question,
      state.documents,
      state.selectedDocumentIds,
    );
    removeTypingIndicator();

    state.accumulatedUsage.totalTokens += res.usage.totalTokens;
    state.accumulatedUsage.totalCost += parseFloat(
      res.usage.totalCost.replace("$", ""),
    );
    state.questionCount++;
    updateUsageStats();

    addMessage(res.answer, "ai", res.sources, res.usage.totalCost);
  } catch (e) {
    removeTypingIndicator();
    addMessage(
      `Error: ${e instanceof Error ? e.message : "Something went wrong"}`,
      "error",
    );
  } finally {
    state.isLoading = false;
    dom.questionInput.disabled = false;
    dom.sendButton.disabled = false;
    dom.questionInput.focus();
  }
}
