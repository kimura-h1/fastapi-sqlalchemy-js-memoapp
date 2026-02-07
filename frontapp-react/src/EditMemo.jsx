import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./styles.css";

function EditMemo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("中");
  const [dueDate, setDueDate] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 既存メモの読み込み（edit.js の代わり）
  useEffect(() => {
    const fetchMemo = async () => {
      try {
        setLoading(true);
        setError("");

        // ✅ ここはあなたのFastAPIのエンドポイントに合わせて変更してOK
        const res = await fetch(`http://localhost:8000/memos/${id}`);

        if (!res.ok) {
          throw new Error(`取得に失敗しました (status: ${res.status})`);
        }

        const data = await res.json();

        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setPriority(data.priority ?? "中");
        // FastAPI側が due_date / dueDate どっちで返すかで調整
        setDueDate((data.due_date ?? data.dueDate ?? "").slice(0, 10));
        setIsCompleted(Boolean(data.is_completed ?? data.isCompleted));
      } catch (e) {
        setError(e.message || "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchMemo();
  }, [id]);

  // 更新処理（updateButton / submit の代わり）
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const payload = {
        title,
        description,
        priority,
        due_date: dueDate || null,
        is_completed: isCompleted,
      };

      // ✅ ここもFastAPIのエンドポイントに合わせて変更してOK
      const res = await fetch(`http://localhost:8000/memos/${id}`, {
        method: "PUT", // PATCH にしたいならここ変える
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`更新に失敗しました (status: ${res.status}) ${text}`);
      }

      alert("更新しました！");
      navigate("/list"); // 一覧へ戻す
    } catch (e) {
      setError(e.message || "更新に失敗しました");
    }
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h1>メモ編集</h1>

      <Link to="/list">一覧へ戻る</Link>

      {error && <p style={{ marginTop: 12 }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          タイトル:
          <input
            value={title}
            required
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <br />

        <label>
          詳細:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <br />

        <label>
          優先度:
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        </label>
        <br />

        <label>
          期限:
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
        <br />

        <label>
          完了:
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
          />
        </label>
        <br />

        <button type="submit">更新</button>
      </form>
    </div>
  );
}

export default EditMemo;
