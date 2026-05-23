import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles.css";
import { BASE_URL, authFetch } from "./utils/api";
import Header from "./components/Header";

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

function buildQuery(search, priority, isCompleted) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (priority) params.set("priority", priority);
  if (isCompleted !== "") params.set("is_completed", isCompleted);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function ListMemos() {
  const navigate = useNavigate();
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [isCompleted, setIsCompleted] = useState("");

  const fetchMemos = useCallback(async (s, p, c) => {
    try {
      setLoading(true);
      setError("");
      const qs = buildQuery(s, p, c);
      const res = await authFetch(`${BASE_URL}/memos/${qs}`);
      if (!res.ok) throw new Error(`取得失敗 (status: ${res.status})`);
      const data = await res.json();
      setMemos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "一覧取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemos(search, priority, isCompleted);
  }, [search, priority, isCompleted, fetchMemos]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async (id) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      const res = await authFetch(`${BASE_URL}/memos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`削除失敗 (status: ${res.status})`);
      setMemos((prev) => prev.filter((m) => m.memo_id !== id));
      setSuccessMsg("メモを削除しました");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      alert(e.message || "削除に失敗しました");
    }
  };

  const hasFilter = searchInput || priority || isCompleted !== "";

  return (
    <>
      <Header />

      <main className="page">
        <div className="page-header">
          <h2 className="page-title">メモ一覧</h2>
          <Link to="/create" className="btn btn-primary">+ 新規作成</Link>
        </div>

        <div className="filter-bar">
          <input
            className="form-input filter-search"
            type="text"
            placeholder="タイトルで検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className="form-select filter-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">優先度: 全て</option>
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
          <select
            className="form-select filter-select"
            value={isCompleted}
            onChange={(e) => setIsCompleted(e.target.value)}
          >
            <option value="">状態: 全て</option>
            <option value="false">未完</option>
            <option value="true">完了</option>
          </select>
          {hasFilter && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPriority("");
                setIsCompleted("");
              }}
            >
              リセット
            </button>
          )}
        </div>

        {error && <div className="alert-error">{error}</div>}
        {successMsg && <div className="alert-success">{successMsg}</div>}

        {loading ? (
          <p style={{ color: "#9ca3af", padding: "20px 0" }}>読み込み中...</p>
        ) : memos.length === 0 ? (
          <div className="empty-state">
            {hasFilter ? (
              <p>条件に一致するメモがありません</p>
            ) : (
              <>
                <p>まだメモがありません</p>
                <Link to="/create" className="btn btn-primary">最初のメモを作成する</Link>
              </>
            )}
          </div>
        ) : (
          <ul className="memo-list">
            {memos.map((m) => {
              const status = m.status ?? {};
              const completed = Boolean(status.is_completed);
              const dueDate = status.due_date ? formatDate(status.due_date) : null;
              const createdAt = formatDate(m.created_at);

              return (
                <li key={m.memo_id} className={`memo-card${completed ? " completed" : ""}`}>
                  <div className="memo-card-top">
                    <span className="memo-title">{m.title}</span>
                    <div className="memo-badges">
                      <span className={priorityBadge(status.priority)}>
                        {status.priority ?? "-"}
                      </span>
                      <span className={completed ? "badge badge-done" : "badge badge-pending"}>
                        {completed ? "完了" : "未完"}
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
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/memos/${m.memo_id}/edit`)}
                      >
                        編集
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
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
