/** DocAIMind — application state */

import type { AppState } from "./types";

/** Global application state */
export const state: AppState = {
  user: null,
  documents: [],
  selectedDocumentIds: new Set(),
  accumulatedUsage: { totalTokens: 0, totalCost: 0 },
  questionCount: 0,
  isLoading: false,
  isAuthReady: false,
};
