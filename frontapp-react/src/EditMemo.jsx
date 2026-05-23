import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import MemoForm from "./components/MemoForm";
import ErrorBox from "./components/ErrorBox";
import { formatApiError } from "./utils/apiError";
import { validateMemo } from "./utils/validation";
import { BASE_URL } from "./utils/api";

function EditMemo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    const fetchMemo = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${BASE_URL}/memos/${id}`);
        if (!res.ok) throw new Error(`取得に失敗しました (status: ${res.status})`);

        const data = await res.json();
        const status = data.status ?? {};

        setInitialValues({
          title: data.title ?? "",
          description: data.description ?? "",
          priority: status.priority ?? "低",
          dueDate: status.due_date ? String(status.due_date).slice(0, 10) : "",
          isCompleted: Boolean(status.is_completed ?? false),
        });
      } catch (e) {
        setError(e.message || "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchMemo();
  }, [id]);

  const handleUpdate = async (form) => {
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
          due_date: dueDate ? `${dueDate}T00:00:00` : null,
          is_completed: Boolean(isCompleted),
        },
      };

      const res = await fetch(`${BASE_URL}/memos/${id}`, {
        method: "PUT",
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
      setError(e.message || "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <>
      <header className="app-header"><h1>メモアプリ</h1></header>
      <div className="page"><p>読み込み中...</p></div>
    </>
  );

  if (!initialValues) return (
    <>
      <header className="app-header"><h1>メモアプリ</h1></header>
      <div className="page"><p>データが取得できませんでした</p></div>
    </>
  );

  return (
    <>
      <header className="app-header">
        <h1>メモアプリ</h1>
      </header>

      <main className="page">
        <div className="page-header">
          <h2 className="page-title">メモの編集</h2>
          <Link to="/list" className="btn btn-ghost">← 一覧へ戻る</Link>
        </div>

        <MemoForm
          initialValues={initialValues}
          submitLabel="更新する"
          onSubmit={handleUpdate}
          submitting={submitting}
        />

        <ErrorBox message={error} onClose={() => setError("")} />
      </main>
    </>
  );
}

export default EditMemo;
