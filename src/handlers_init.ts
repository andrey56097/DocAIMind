/** DocMind — shared init helper used by handlers + main.ts */

import { state } from "./state";
import { dom } from "./dom";
import { renderDocuments, updateChatSubtitle } from "./ui";
import { fetchDocuments as fetchDocsApi } from "./services/documents";

export async function refreshDocuments(): Promise<void> {
  try {
    state.documents = await fetchDocsApi();
    renderDocuments();
    updateChatSubtitle();

    if (state.documents.length > 0) {
      dom.questionInput.disabled = false;
      dom.sendButton.disabled = false;
    }
  } catch (e) {
    console.error("Failed to fetch documents:", e);
  }
}
