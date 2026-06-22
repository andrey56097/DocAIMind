/**
 * DocAIMind — AI Knowledge Base
 * Entry point
 */

import { initEventListeners } from "./handlers";
import { refreshDocuments } from "./handlers_init";

async function init(): Promise<void> {
  initEventListeners();
  try {
    await refreshDocuments();
  } catch (e) {
    console.error("Init error:", e);
  }
}

init();
