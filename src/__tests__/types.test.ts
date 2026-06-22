/**
 * DocAIMind — type sanity tests
 */

import { describe, it, expect } from "vitest";
import type { AppDocument, AnswerResult, UsageInfo, Source, AppState } from "../types";

describe("type shapes", () => {
  it("AppDocument has the expected fields", () => {
    const doc: AppDocument = {
      id: "1",
      title: "test.pdf",
      file_path: "123_test.pdf",
      file_size: 1024,
      created_at: "2024-01-01T00:00:00Z",
    };
    expect(doc.id).toBe("1");
    expect(doc.title).toBe("test.pdf");
    expect(doc.file_size).toBe(1024);
  });

  it("AppState has correct default shape", () => {
    const state: AppState = {
      documents: [],
      selectedDocumentIds: new Set(),
      accumulatedUsage: { totalTokens: 0, totalCost: 0 },
      questionCount: 0,
      isLoading: false,
    };
    expect(state.documents).toHaveLength(0);
    expect(state.isLoading).toBe(false);
    expect(state.accumulatedUsage.totalCost).toBe(0);
  });

  it("AnswerResult has answer, sources and usage", () => {
    const result: AnswerResult = {
      answer: "test answer",
      sources: [{ id: "1", title: "doc.pdf", file_path: "path" }],
      usage: { totalTokens: 100, totalCost: "$0.000100" },
    };
    expect(result.answer).toBe("test answer");
    expect(result.sources).toHaveLength(1);
    expect(result.usage.totalTokens).toBe(100);
  });

  it("can have multiple sources", () => {
    const sources: Source[] = [
      { id: "1", title: "doc1.pdf", file_path: "p1" },
      { id: "2", title: "doc2.pdf", file_path: "p2" },
      { id: "3", title: "doc3.pdf", file_path: "p3" },
    ];
    expect(sources.length).toBe(3);
  });

  it("UsageInfo can have zero tokens", () => {
    const usage: UsageInfo = { totalTokens: 0, totalCost: "$0.00" };
    expect(usage.totalTokens).toBe(0);
    expect(usage.totalCost).toBe("$0.00");
  });
});
