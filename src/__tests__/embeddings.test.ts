/**
 * DocAIMind — embedding utility tests
 */

import { describe, it, expect } from "vitest";
import { simpleEmbedding, cosineSimilarity, chunkText } from "../embeddings";

describe("simpleEmbedding", () => {
  it("returns a vector of 1536 dimensions", () => {
    const vec = simpleEmbedding("hello world");
    expect(vec).toHaveLength(1536);
  });

  it("returns a normalised vector (unit length ≈ 1)", () => {
    const vec = simpleEmbedding("some text here");
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    expect(mag).toBeCloseTo(1, 5);
  });

  it("returns the same vector for the same text", () => {
    const a = simpleEmbedding("repeat");
    const b = simpleEmbedding("repeat");
    expect(a).toEqual(b);
  });

  it("returns different vectors for different words", () => {
    const a = simpleEmbedding("apple");
    const b = simpleEmbedding("banana");
    expect(a).not.toEqual(b);
  });

  it("handles empty string", () => {
    const vec = simpleEmbedding("");
    expect(vec).toHaveLength(1536);
    expect(vec.every((v) => v === 0)).toBe(false); // hashed word ""
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const v = simpleEmbedding("test");
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it("returns a value between -1 and 1", () => {
    const a = simpleEmbedding("hello world");
    const b = simpleEmbedding("goodbye universe");
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThanOrEqual(-1);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it("is symmetric", () => {
    const a = simpleEmbedding("dog");
    const b = simpleEmbedding("cat");
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
  });
});

describe("chunkText", () => {
  it("returns an empty array for empty text", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("returns a single chunk for short text", () => {
    const chunks = chunkText("Hello world.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("Hello world.");
  });

  it("splits long text into multiple chunks", () => {
    const text = "A. ".repeat(200);
    const chunks = chunkText(text, 100);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("breaks at sentence boundaries when possible", () => {
    const text = "First sentence. Second sentence. Third sentence. Fourth sentence.";
    const chunks = chunkText(text, 30);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    // each chunk should end with a sentence-ending punctuation or be the last
    chunks.slice(0, -1).forEach((c) => {
      const trimmed = c.trim();
      // Should end with sentence boundary or be at the natural break
      expect(trimmed.endsWith(".") || trimmed.endsWith("!") || trimmed.endsWith("?")).toBe(true);
    });
  });

  it("respects paragraph breaks", () => {
    const text =
      "Short paragraph.\n\nAnother paragraph here.\n\nAnd a third one.\n\nA fourth paragraph to be safe.";
    const chunks = chunkText(text, 40);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
  });

  it("uses default chunk size of 800", () => {
    const text = "Word. ".repeat(500);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    // each chunk should be ≤ 800 chars
    chunks.forEach((c) => {
      expect(c.length).toBeLessThanOrEqual(800);
    });
  });
});
