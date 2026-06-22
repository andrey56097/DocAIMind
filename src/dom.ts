/** DocMind — DOM element references */

const $ = (id: string) => document.getElementById(id)!;

export const dom = {
  // Sidebar
  sidebar: $("sidebar"),
  sidebarToggle: $("sidebar-toggle"),

  // Upload
  fileInput: $("file-input") as HTMLInputElement,
  uploadProgress: $("upload-progress"),
  progressFill: document.querySelector(".progress-fill") as HTMLElement,
  progressText: document.querySelector(".progress-text") as HTMLElement,

  // Documents
  documentsList: $("documents-list"),
  deleteAllBtn: $("delete-all-btn"),

  // Chat
  messagesContainer: $("messages-container"),
  welcomeMessage: $("welcome-message"),
  questionForm: $("question-form") as HTMLFormElement,
  questionInput: $("question-input") as HTMLInputElement,
  sendButton: $("send-button") as HTMLButtonElement,
  chatSubtitle: $("chat-subtitle"),

  // Usage stats
  totalTokens: $("total-tokens"),
  totalCost: $("total-cost"),
  questionCount: $("question-count"),
};
