import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./styles.css";


// ★ ここに追加
function formatDate(value) {
  if (!value) return "";

  const d = new Date(value);

  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ListMemos() {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("http://localhost:8000/memos");
        if (!res.ok) throw new Error(`取得失敗 (status: ${res.status})`);

        const data = await res.json();
        console.log("memos:", data);

        setMemos(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "一覧取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
    
  }, []);

  
  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h1>メモ一覧</h1>

      <Link to="/create">新規作成へ</Link>

      {error && <p style={{ marginTop: 12 }}>{error}</p>}

      <ul>
        {memos.map((m) => (
          <li key={m.memo_id}>
            <strong>{m.title}</strong>{" "}
            <Link to={`/memos/${m.memo_id}/edit`}>編集</Link>

            <div style={{ fontSize: 12, color: "#666" }}>
              作成: {formatDate(m.created_at)}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              更新: {formatDate(m.updated_at)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListMemos;
