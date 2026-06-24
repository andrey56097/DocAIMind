/**
 * DocAIMind — PDF text extraction
 *
 * Uses pdfjs-dist to extract text content from PDF files.
 */

/** Extract text from a PDF using pdfjs-dist. */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Disable worker for mobile compatibility
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
    disableFontFace: true,
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
  }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str).join(" "));
  }
  return pages.join("\n\n");
}

/** Extract text from a PDF using the native browser PDF reader (mobile fallback). */
async function extractPdfTextNative(file: File): Promise<string> {
  const text = await file.text();
  // Try to extract text between parentheses (common in simple PDFs)
  const matches = text.match(/\(([^)]*)\)/g);
  if (!matches) return "";
  return matches
    .map((m) => m.slice(1, -1))
    .filter((s) => s.length > 2)
    .join(" ")
    .trim();
}

/** Extract text from any supported file type. */
export async function extractFileText(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    try {
      return await extractPdfText(file);
    } catch (e) {
      console.warn("pdfjs-dist failed, trying native fallback:", e);
      const fallback = await extractPdfTextNative(file);
      if (fallback.length > 50) return fallback;
      throw e; // re-throw if native also failed
    }
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
