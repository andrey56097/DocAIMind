/**
 * DocAIMind — AI Knowledge Base
 * Entry point
 */

import { initEventListeners } from "./handlers";
import { initAuth } from "./handlers/auth";

async function init(): Promise<void> {
  // Auth first — restores session, syncs user, fetches docs if logged in
  await initAuth();

  // Wire up event handlers (upload, ask, delete, sidebar)
  initEventListeners();
}

init();
