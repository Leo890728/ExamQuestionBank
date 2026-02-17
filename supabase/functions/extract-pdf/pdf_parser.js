import * as pdfjsLib from "./vendor/package/legacy/build/pdf.mjs";
import * as pdfjsWorker from "./vendor/package/legacy/build/pdf.worker.mjs";

if (!globalThis.pdfjsWorker) {
  globalThis.pdfjsWorker = pdfjsWorker;
}

export const Flag = Object.freeze({
  BEGIN: -2,
  QUESTION: -1,
  OPTION_1: 0,
  OPTION_2: 1,
  OPTION_3: 2,
  OPTION_4: 3,
});


function toWordItem(item) {
  const [, , , , e, f] = item.transform;
  return {
    text: item.str ?? "",
    x0: e ?? 0,
    bottom: f ?? 0,
  };
}

// 先不分詞：直接回傳
function splitEnKeepZh(text) {
  return text;
}

function isJunkLine(t) {
  // 你原本會移除代號/頁次，這裡再加一些常見抬頭
  return (
    /^(代號：[0-9]+|頁次：[0-9]+－[0-9]+)$/.test(t) ||
    /^第.試/.test(t) ||
    /試題$/.test(t) ||
    /^座號：?$/.test(t) ||
    /^[0-9]+－[0-9]+$/.test(t) // 例如 10－2
  );
}

function tryParseHeader(t, meta) {
  // 用關鍵字抓，不靠座標
  let m;
  if ((m = t.match(/^別：(.*)$/))) meta.level = m[1].trim();
  else if ((m = t.match(/^科：(.*)$/))) meta.category = m[1].trim();
  else if ((m = t.match(/^目：(.*)$/))) meta.subject = m[1].trim();
  else if ((m = t.match(/^考試時間：(.*)$/))) meta.time_length = m[1].trim();
  else if ((m = t.match(/^([0-9]+小時[0-9]+分)$/))) meta.time_length ||= m[1].trim(); // 你這份看起來是「1小時20分」
}

function isQuestionNumber(word) {
  // 關鍵：必須在題號區（靠左）+ 內容是數字題號
  if (!(word.x0 < 55)) return false;
  const t = (word.text || "").trim();
  // 只接受純數字（避免把「4301」這種亂入：可加上合理上限 1~100）
  if (!/^\d{1,3}$/.test(t)) return false;
  const n = Number(t);
  return n >= 1 && n <= 100;
}

export async function parseQuestionsFromBuffer(pdfBuffer) {
  const data = new Uint8Array(pdfBuffer);

  const pdf = await pdfjsLib.getDocument({
    data,
    disableWorker: true,
  }).promise;

  const meta = { level: "", category: "", subject: "", time_length: "" };

  const questions = [];
  let temp = { question: "", options: ["", "", "", ""] };
  let flag = Flag.BEGIN;
  let started = false; // 避免抬頭被當題目：直到遇到第一個題號才開始收

  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex + 1);
    const content = await page.getTextContent();

    const words = content.items
      .filter((it) => (it.str ?? "").trim() !== "")
      .map(toWordItem)
      // 讓閱讀順序比較合理：先 bottom 再 x0（若你發現順序反了，我再教你換方向）
      .sort((a, b) => (b.bottom !== a.bottom ? b.bottom - a.bottom : a.x0 - b.x0));

    for (const word of words) {
      const t = word.text.trim();
      if (!t) continue;

      // 先抓 header（通常都在第一頁出現）
      if (pageIndex === 0) {
        tryParseHeader(t, meta);
      }

      // 垃圾行略過
      if (isJunkLine(t)) continue;

      // ✅ 新題開始：只接受真正題號
      if (isQuestionNumber(word)) {
        started = true;

        if (flag !== Flag.BEGIN) {
          temp.question = splitEnKeepZh(temp.question);
          temp.options = temp.options.map(splitEnKeepZh);
          questions.push(temp);
          temp = { question: "", options: ["", "", "", ""] };
        }

        flag = Flag.QUESTION;
        continue;
      }

      // ✅ 還沒開始（沒遇到第一題）一律不收，避免把抬頭塞進 question
      if (!started) continue;

      // 選項旗標
      const firstChar = t[0];
      if (firstChar === "\ue18c") flag = Flag.OPTION_1;
      else if (firstChar === "\ue18d") flag = Flag.OPTION_2;
      else if (firstChar === "\ue18e") flag = Flag.OPTION_3;
      else if (firstChar === "\ue18f") flag = Flag.OPTION_4;

      if (flag === Flag.QUESTION) {
        temp.question += t;
      } else if (flag >= 0 && flag <= 3) {
        const optionContent = t.replace(/^[\ue18c\ue18d\ue18e\ue18f]+/, "");
        if (optionContent) temp.options[flag] += optionContent;
      }
    }
  }

  // push last question (如果真的有開始)
  if (started) {
    temp.question = splitEnKeepZh(temp.question);
    temp.options = temp.options.map(splitEnKeepZh);
    questions.push(temp);
  }

  return { ...meta, questions };
}
