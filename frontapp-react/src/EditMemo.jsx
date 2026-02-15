import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import MemoForm from "./components/MemoForm";
import ErrorBox from "./components/ErrorBox";

function EditMemo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // MemoFormに渡す初期値
  const [initialValues, setInitialValues] = useState(null);

  // 既存メモの読み込み
  useEffect(() => {
    const fetchMemo = async () => {
      try {
        setLoading(true);
        setError("");
        
        const res = await fetch(`http://localhost:8000/memos/${id}`);
        if (!res.ok) throw new Error(`取得に失敗しました (status: ${res.status})`);

        const data = await res.json();

        // あなたのFastAPIスキーマは status の中に priority/due_date/is_completed がある前提
        const status = data.status ?? {};

        setInitialValues({
          title: data.title ?? "",
          description: data.description ?? "",
          priority: status.priority ?? "低",
          // date inputは YYYY-MM-DD が必要なので 10文字に切る
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

  // 更新（MemoFormから値を受け取る）
  const handleUpdate = async ({ title, description, priority, dueDate, isCompleted }) => {
    try {
      setSubmitting(true);
      setError("");

      const payload = {
        title,
        description,
        status: {
          priority,
          due_date: dueDate ? `${dueDate}T00:00:00` : null,
          is_completed: Boolean(isCompleted),
        },
      };

        const res = await fetch(`http://localhost:8000/memos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? `更新に失敗しました (status: ${res.status})`);
      }

      navigate("/list");
    } catch (e) {
      setError(e.message || "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>読み込み中...</p>;
  if (!initialValues) return <p>データが取得できませんでした</p>;

  return (
    <div>
     <h1>メモ編集</h1>
      <Link to="/list">一覧へ戻る</Link>

      <MemoForm
        initialValues={initialValues}
        submitLabel="更新"
        onSubmit={handleUpdate}
        submitting={submitting}
        error={error}
      />
      
       <ErrorBox message={error} onClose={() => setError("")} />
    </div>
  );
}

export default EditMemo;
