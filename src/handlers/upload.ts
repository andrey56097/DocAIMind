/**
 * DocAIMind — Upload handler
 */

import { uploadFile } from "../services/supabase";
import { extractFileText, cleanText } from "../services/pdf";
import { createDocumentWithChunks } from "../services/documents";
import { refreshDocuments } from "../handlers_init";
import { addMessage, setProgress, hideProgress, showUploadLoading, hideUploadLoading } from "../ui";

/** Handle a file upload: upload to storage, extract text, chunk, and embed. */
export async function handleUpload(file: File): Promise<void> {
  showUploadLoading();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${Date.now()}_${safeName}`;

  setProgress(10, "Uploading to storage...");
  try {
    await uploadFile(file, filePath);
  } catch (e) {
    console.error("Upload storage error:", e);
    throw e;
  }

  setProgress(20, "Extracting text...");
  let rawText: string;
  try {
    rawText = await extractFileText(file);
  } catch (e) {
    console.error("PDF extraction failed:", e instanceof Error ? e.message : e);
    throw new Error(
      "Could not read this PDF on your device. Try using a desktop browser.",
    );
  }
  const clean = cleanText(rawText);

  if (clean.length < 50)
    throw new Error("Could not extract meaningful text from this PDF.");

  setProgress(30, "Saving document...");
  const { totalChunks } = await createDocumentWithChunks(
    file.name,
    filePath,
    file.size,
    clean,
    (done, total) => {
      const pct = Math.round(30 + (done / total) * 55);
      setProgress(pct, `Creating embedding ${done}/${total}...`);
    },
  );

  hideUploadLoading();
  setProgress(100, `${totalChunks} chunks created!`);
  setTimeout(hideProgress, 1500);

  await refreshDocuments();
  addMessage(`📄 **${file.name}** uploaded and processed!`, "ai");
}
