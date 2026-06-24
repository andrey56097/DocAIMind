/**
 * DocAIMind — UI rendering
 */

import type { Source } from "../types";
import { state } from "../state";
import { dom } from "../dom";

/** Close sidebar on mobile. */
function closeSidebarIfMobile(): void {
  if (window.innerWidth <= 768) {
    dom.sidebar.classList.remove("open");
  }
}

// ============================================
// Helpers
// ============================================

function escape(text: string): string {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function formatDate(ds: string): string {
  const d = new Date(ds);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ============================================
// Documents
// ============================================

export function renderDocuments(): void {
  const list = dom.documentsList;
  const hasDocs = state.documents.length > 0;
  dom.deleteAllBtn.style.display = hasDocs ? "" : "none";

  if (!hasDocs) {
    list.innerHTML =
      '<p class="empty-state">No documents yet.<br/>Upload a PDF to get started.</p>';
    return;
  }

  list.innerHTML = state.documents
    .map(
      (doc) => `
    <div class="document-item ${state.selectedDocumentIds.has(doc.id) ? "active" : ""}" data-id="${doc.id}">
      <div class="document-icon">📄</div>
      <div class="document-info">
        <div class="document-name" title="${escape(doc.title)}">${escape(doc.title)}</div>
        <div class="document-date">${formatDate(doc.created_at)}</div>
      </div>
      <span class="document-check">✓</span>
      <button class="delete-btn" data-id="${doc.id}" title="Delete">✕</button>
    </div>`,
    )
    .join("");

  // Remove past delegation listener
  const oldHandler = (list as any)._clickHandler;
  if (oldHandler) list.removeEventListener("click", oldHandler);

  const handler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const item = target.closest(".document-item") as HTMLElement | null;
    if (!item) return;
    const id = item.dataset.id!;

    if (
      target.classList.contains("delete-btn") ||
      target.closest(".delete-btn")
    ) {
      if (confirm("Delete this document?")) {
        deleteDocumentHandler(id).catch(console.error);
      }
      return;
    }

    if (state.selectedDocumentIds.has(id))
      state.selectedDocumentIds.delete(id);
    else state.selectedDocumentIds.add(id);
    renderDocuments();
    updateChatSubtitle();
    closeSidebarIfMobile();
  };

  list.addEventListener("click", handler);
  (list as any)._clickHandler = handler;
}

/** Set externally — imported to avoid circular deps with handlers. */
export let deleteDocumentHandler: (id: string) => Promise<void> = async () => {};

export function setDeleteDocumentHandler(
  fn: (id: string) => Promise<void>,
): void {
  deleteDocumentHandler = fn;
}

export function updateChatSubtitle(): void {
  const total = state.documents.length;
  if (total === 0) {
    dom.chatSubtitle.textContent =
      "Upload a PDF and ask questions about its content";
    return;
  }
  const sel = state.selectedDocumentIds.size;
  if (sel > 0 && sel < total) {
    dom.chatSubtitle.textContent = `${sel} of ${total} document${total > 1 ? "s" : ""} selected`;
  } else {
    dom.chatSubtitle.textContent = `${total} document${total > 1 ? "s" : ""} — searching across all`;
  }
}

// ============================================
// Chat messages
// ============================================

export function addMessage(
  content: string,
  role: "user" | "ai" | "error",
  sources?: Source[],
  usageStr?: string,
): void {
  if (role === "user") dom.welcomeMessage.style.display = "none";

  const div = document.createElement("div");
  div.className = `message ${role}`;
  const avatar =
    role === "user" ? "🧑" : role === "error" ? "⚠️" : "🤖";

  const formatted = content
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => `<p>${escape(l)}</p>`)
    .join("");

  let sourcesHtml = "";
  if (sources && sources.length > 0) {
    sourcesHtml = `
      <details class="message-sources">
        <summary>Sources (${sources.length})</summary>
        <ul>${sources.map((s) => `<li><span class="source-badge">${escape(s.title)}</span></li>`).join("")}</ul>
      </details>`;
  }

  let usageHtml = "";
  if (usageStr) {
    usageHtml = `<div class="message-usage"><span>💵 ${usageStr}</span></div>`;
  }

  div.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">${formatted}${sourcesHtml}${usageHtml}</div>`;
  dom.messagesContainer.appendChild(div);
  dom.messagesContainer.scrollTop = dom.messagesContainer.scrollHeight;
}

// ============================================
// Typing indicator
// ============================================

export function showTypingIndicator(): void {
  const div = document.createElement("div");
  div.className = "typing-indicator";
  div.id = "typing-indicator";
  div.innerHTML =
    '<div class="message-avatar">🤖</div><div class="typing-dots"><span></span><span></span><span></span></div>';
  dom.messagesContainer.appendChild(div);
  dom.messagesContainer.scrollTop = dom.messagesContainer.scrollHeight;
}

export function removeTypingIndicator(): void {
  document.getElementById("typing-indicator")?.remove();
}

// ============================================
// Progress bar
// ============================================

export function setProgress(pct: number, text: string): void {
  dom.uploadProgress.classList.remove("hidden");
  dom.progressFill.style.width = `${pct}%`;
  dom.progressText.textContent = text;
}

export function hideProgress(): void {
  dom.uploadProgress.classList.add("hidden");
  dom.progressFill.style.width = "0%";
}

// ============================================
// Usage stats
// ============================================

export function updateUsageStats(): void {
  dom.totalTokens.textContent =
    state.accumulatedUsage.totalTokens.toLocaleString();
  dom.totalCost.textContent = `$${state.accumulatedUsage.totalCost.toFixed(6)}`;
  dom.questionCount.textContent = String(state.questionCount);
}

/** Show/hide the login hint in the welcome message based on auth state. */
export function updateWelcomeAuthHint(): void {
  if (!state.user) {
    dom.welcomeMessage.classList.add("logged-out");
  } else {
    dom.welcomeMessage.classList.remove("logged-out");
  }
}
