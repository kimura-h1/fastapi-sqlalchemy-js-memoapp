// src/utils/apiError.js
export function formatApiError(body, fallback = "処理に失敗しました") {
  if (body && typeof body === "object" && Array.isArray(body.detail)) {
    const messages = body.detail.map((d) => {
      const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "";
      const fieldJa =
        field === "title" ? "タイトル" :
        field === "description" ? "詳細" :
        field || "入力";

      if (d.type === "string_too_short" || d.type === "missing") {
        return `${fieldJa}は必須です`;
      }
      return field ? `${fieldJa}: ${d.msg}` : d.msg;
    });
    return messages.join("\n");
  }

  if (typeof body === "string" && body.trim() !== "") return body;
  return fallback;
}
