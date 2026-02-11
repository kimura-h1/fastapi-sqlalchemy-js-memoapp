import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MemoForm from "./components/MemoForm";

function CreateMemo() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async ({ title, description, priority, dueDate, isCompleted }) => {
    try {
      setError("");
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

  console.log("POST /memos status:", res.status);
  console.log("POST /memos body:", body);

  throw new Error(typeof body === "string" ? body : JSON.stringify(body));
}



      navigate("/list");
    } catch (e) {
      setError(e.message || "登録に失敗しました");
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
      </div>
  );
}

export default CreateMemo;
