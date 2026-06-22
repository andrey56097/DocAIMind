/**
 * DocMind — PDF text extraction
 *
 * Uses pdfjs-dist to extract text content from PDF files.
 */

/** Extract text from a PDF using pdfjs-dist. */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str).join(" "));
  }
  return pages.join("\n\n");
}

/** Extract text from any supported file type. */
export async function extractFileText(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return extractPdfText(file);
  }
  return file.text();
}

/**
 * Strip non-printable characters, keeping only ASCII printable + newlines/tabs.
 */
export function cleanText(raw: string): string {
  return raw
    .split("")
    .filter((c) => {
      const code = c.charCodeAt(0);
      return (
        (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9
      );
    })
    .join("")
    .trim();
}
