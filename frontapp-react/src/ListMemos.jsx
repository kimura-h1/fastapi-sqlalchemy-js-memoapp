import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./styles.css";
import { BASE_URL } from "./utils/api";

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function priorityBadge(priority) {
  const map = {
    高: "badge badge-high",
    中: "badge badge-mid",
    低: "badge badge-low",
  };
  return map[priority] ?? "badge badge-low";
}

function ListMemos() {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${BASE_URL}/memos/`);
        if (!res.ok) throw new Error(`取得失敗 (status: ${res.status})`);
        const data = await res.json();
        setMemos(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "一覧取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchMemos();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      const res = await fetch(`${BASE_URL}/memos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`削除失敗 (status: ${res.status})`);
      setMemos((prev) => prev.filter((m) => m.memo_id !== id));
      setSuccessMsg("メモを削除しました");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      alert(e.message || "削除に失敗しました");
    }
  };

  if (loading) return (
    <>
      <header className="app-header"><h1>メモアプリ</h1></header>
      <div className="page"><p>読み込み中...</p></div>
    </>
  );

  return (
    <>
      <header className="app-header">
        <h1>メモアプリ</h1>
      </header>

      <main className="page">
        <div className="page-header">
          <h2 className="page-title">メモ一覧</h2>
          <Link to="/create" className="btn btn-primary">+ 新規作成</Link>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {successMsg && <div className="alert-success">{successMsg}</div>}

        {memos.length === 0 ? (
          <div className="empty-state">
            <p>まだメモがありません</p>
            <Link to="/create" className="btn btn-primary">最初のメモを作成する</Link>
          </div>
        ) : (
          <ul className="memo-list">
            {memos.map((m) => {
              const status = m.status ?? {};
              const isCompleted = Boolean(status.is_completed);
              const dueDate = status.due_date ? formatDate(status.due_date) : null;
              const createdAt = formatDate(m.created_at);

              return (
                <li key={m.memo_id} className={`memo-card${isCompleted ? " completed" : ""}`}>
                  <div className="memo-card-top">
                    <span className="memo-title">{m.title}</span>
                    <div className="memo-badges">
                      <span className={priorityBadge(status.priority)}>
                        {status.priority ?? "-"}
                      </span>
                      <span className={isCompleted ? "badge badge-done" : "badge badge-pending"}>
                        {isCompleted ? "完了" : "未完"}
                      </span>
                    </div>
                  </div>

                  {m.description && (
                    <p className="memo-description">{m.description}</p>
                  )}

                  <div className="memo-card-bottom">
                    <div className="memo-meta">
                      {dueDate && <span>期限: {dueDate}</span>}
                      {createdAt && <span>作成: {createdAt}</span>}
                    </div>
                    <div className="memo-actions">
                      <Link to={`/memos/${m.memo_id}/edit`} className="btn-icon">
                        編集
                      </Link>
                      <button
                        className="btn-danger-icon"
                        onClick={() => handleDelete(m.memo_id)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

export default ListMemos;
