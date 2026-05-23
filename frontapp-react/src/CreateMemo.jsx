import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MemoForm from "./components/MemoForm";
import ErrorBox from "./components/ErrorBox";
import { formatApiError } from "./utils/apiError";
import { validateMemo } from "./utils/validation";
import { BASE_URL } from "./utils/api";

function CreateMemo() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (form) => {
    setError("");

    const validationError = validateMemo(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const { title, description, priority, dueDate, isCompleted } = form;

    try {
      setSubmitting(true);
      const payload = {
        title,
        description,
        status: {
          priority,
          is_completed: Boolean(isCompleted),
          due_date: dueDate ? `${dueDate}T00:00:00` : null,
        },
      };

      const res = await fetch(`${BASE_URL}/memos/`, {
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
    <>
      <header className="app-header">
        <h1>メモアプリ</h1>
      </header>

      <main className="page">
        <div className="page-header">
          <h2 className="page-title">メモの作成</h2>
          <Link to="/list" className="btn btn-ghost">← 一覧へ戻る</Link>
        </div>

        <MemoForm
          submitLabel="登録する"
          onSubmit={handleCreate}
          submitting={submitting}
        />

        <ErrorBox message={error} onClose={() => setError("")} />
      </main>
    </>
  );
}

export default CreateMemo;
