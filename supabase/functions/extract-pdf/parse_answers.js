import * as pdfjsLib from "./vendor/package/legacy/build/pdf.mjs";
import * as pdfjsWorker from "./vendor/package/legacy/build/pdf.worker.mjs";

if (!globalThis.pdfjsWorker) {
  globalThis.pdfjsWorker = pdfjsWorker;
}


function toWordItem(item) {
  const [, , , , e, f] = item.transform;
  return {
    text: (item.str ?? "").trim(),
    x: e ?? 0,
    y: f ?? 0,
  };
}

export async function parseAnswersFromBuffer(pdfBuffer) {
  const data = new Uint8Array(pdfBuffer);

  const pdf = await pdfjsLib.getDocument({
    data,
    disableWorker: true,
  }).promise;

  const answers = [];
  let fullText = "";

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const content = await page.getTextContent();

    const words = content.items
      .map(toWordItem)
      .filter(w => w.text);

    // 累積全文（給備註用）
    fullText += words.map(w => w.text).join("");

    // === 抓答案 ===
    for (const w of words) {
      // 依你實際答案格式調整
      if (/^[ABCDE]$/.test(w.text)) {
        answers.push(w.text);
      }
      // 如果是數字答案
      // if (/^[1-5]$/.test(w.text)) answers.push(w.text);
    }
  }

  // === 抓備註 ===
  const notesMatch = fullText.match(/備\s*註：.*/);
  const notes = notesMatch ? notesMatch[0] : "";

  return {
    notes,
    answers,
  };
}
