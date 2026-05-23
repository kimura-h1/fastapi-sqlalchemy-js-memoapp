export function validateMemo({ title, description }) {
  if (!title || title.trim() === "") return "タイトルは必須です";
  if (title.length > 50) return "タイトルは50文字以内です";
  if (description && description.length > 255) return "詳細は255文字以内です";
  return "";
}
