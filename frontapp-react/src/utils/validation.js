// src/utils/validation.js
export function validateMemo({ title }) {
  if (!title || title.trim() === "") return "タイトルは必須です";
  if (title.length > 100) return "タイトルは100文字以内です";
  return "";
}
