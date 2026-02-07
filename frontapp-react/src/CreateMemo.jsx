import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles.css";

function CreateMemo() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("低");
  const [dueDate, setDueDate] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");

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

      {error && <p style={{ marginTop: 12 }}>{error}</p>}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div>
            <label>タイトル</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label>詳細</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label>優先度</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="低">低</option>
              <option value="中">中</option>
              <option value="高">高</option>
            </select>
          </div>

          <div>
            <label>期限日</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div>
            <label>完了</label>
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
            />
          </div>

          <div className="button-container">
            <button type="submit">登録</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateMemo;
