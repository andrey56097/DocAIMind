/**
 * DocAIMind — Delete handlers
 */

import { state } from "../state";
import { dom } from "../dom";
import { renderDocuments, updateChatSubtitle } from "../ui";
import { deleteDocument as deleteDocApi } from "../services/documents";

/** Delete a single document by ID. */
export async function handleDeleteDocument(id: string): Promise<void> {
  const doc = state.documents.find((d) => d.id === id);
  if (!doc) return;

  await deleteDocApi(id, doc.file_path);
  state.documents = state.documents.filter((d) => d.id !== id);
  state.selectedDocumentIds.delete(id);
  renderDocuments();
  updateChatSubtitle();

  if (state.documents.length === 0) {
    dom.questionInput.disabled = true;
    dom.sendButton.disabled = true;
  }
}

/** Delete all documents. */
export async function handleDeleteAll(): Promise<void> {
  if (state.documents.length === 0) return;
  if (!confirm(`Delete all ${state.documents.length} documents?`)) return;

  for (const doc of [...state.documents]) {
    try {
      await handleDeleteDocument(doc.id);
    } catch (e) {
      console.error(e);
    }
  }
}
