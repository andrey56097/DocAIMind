/**
 * DocAIMind — Event handlers entry point
 *
 * Wires up all DOM event listeners and re-exports handler functions.
 */

import { state } from "../state";
import { dom } from "../dom";
import { addMessage, setDeleteDocumentHandler, hideProgress } from "../ui";
import { handleUpload } from "./upload";
import { handleDeleteDocument, handleDeleteAll } from "./delete";
import { handleAsk } from "./ask";

// Wire up the delete handler for the delegation pattern in ui.ts
setDeleteDocumentHandler(handleDeleteDocument);

/** Wire up all DOM event listeners. */
export function initEventListeners(): void {
  // Upload
  dom.fileInput.addEventListener("change", async () => {
    const file = dom.fileInput.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
      addMessage("Please upload a PDF file.", "error");
      dom.fileInput.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addMessage("File is too large (max 10 MB).", "error");
      dom.fileInput.value = "";
      return;
    }

    try {
      await handleUpload(file);
    } catch (e) {
      hideProgress();
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg.includes("42501") || msg.includes("row-level security") || msg.includes("violates row-level security")) {
        addMessage(
          "Upload failed: You must be signed in to upload documents. " +
          "Please sign in with Google using the button in the sidebar.",
          "error",
        );
      } else {
        addMessage(`Upload failed: ${msg}`, "error");
      }
    }
  });

  // Ask
  dom.questionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = dom.questionInput.value.trim();
    if (!q || state.isLoading) return;
    if (state.documents.length === 0) {
      addMessage("Please upload a document first.", "error");
      return;
    }
    await handleAsk(q);
  });

  // Delete all
  dom.deleteAllBtn.addEventListener("click", handleDeleteAll);

  // Sidebar toggle (mobile)
  dom.sidebarToggle.addEventListener("click", () => {
    dom.sidebar.classList.toggle("open");
  });

  // Click outside sidebar to close (mobile)
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 768 &&
      dom.sidebar.classList.contains("open") &&
      !dom.sidebar.contains(e.target as HTMLElement) &&
      (e.target as HTMLElement) !== dom.sidebarToggle &&
      !dom.sidebarToggle.contains(e.target as HTMLElement)
    ) {
      dom.sidebar.classList.remove("open");
    }
  });
}
