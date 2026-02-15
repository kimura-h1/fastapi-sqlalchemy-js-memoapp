import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MemoForm from "./components/MemoForm";
import ErrorBox from "./components/ErrorBox";

function formatApiError(body) {
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
  return "登録に失敗しました";
}

function CreateMemo() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async ({ title, description, priority, dueDate, isCompleted }) => {
    setError("");

    // ✅ フロント側バリデーション（ここで止める）
    if (!title || title.trim() === "") {
      setError("タイトルは必須です");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title,
        description,
        status: {
          priority,
          is_completed: Boolean(isCompleted),
          ...(dueDate ? { due_date: `${dueDate}T00:00:00` } : { due_date: null }),
        },
      };

      const res = await fetch("http://localhost:8000/memos/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json")
          ? await res.json().catch(() => ({}))
          : await res.text().catch(() => "");

        throw new Error(formatApiError(body));
      }

      navigate("/list");
    } catch (e) {
      setError(e?.message || "登録に失敗しました");
    } finally {
     
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>メモの作成</h1>
      <Link to="/list">一覧へ戻る</Link>

      <MemoForm
        submitLabel="登録"
        onSubmit={handleCreate}
        submitting={submitting}
        error={error}
      />

      <ErrorBox message={error} onClose={() => setError("")} />
    </div>
  );
}

export default CreateMemo;
