/**
 * DocMind — Upload handler
 */

import { uploadFileToStorage } from "../services/supabase";
import { extractFileText, cleanText } from "../services/pdf";
import { createDocumentWithChunks } from "../services/documents";
import { refreshDocuments } from "../handlers_init";
import { addMessage, setProgress, hideProgress } from "../ui";

/** Handle a file upload: upload to storage, extract text, chunk, and embed. */
export async function handleUpload(file: File): Promise<void> {
  const filePath = `${Date.now()}_${file.name}`;

  setProgress(10, "Uploading to storage...");
  await uploadFileToStorage(file, filePath);

  setProgress(20, "Extracting text...");
  const rawText = await extractFileText(file);
  const clean = cleanText(rawText);

  if (clean.length < 50)
    throw new Error("Could not extract meaningful text");

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

  setProgress(100, `${totalChunks} chunks created!`);
  setTimeout(hideProgress, 1500);

  await refreshDocuments();
  addMessage(`📄 **${file.name}** uploaded and processed!`, "ai");
}
