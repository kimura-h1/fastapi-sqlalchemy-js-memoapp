import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./styles.css";

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
          <li key={m.id}>
            <strong>{m.title}</strong>{" "}
            <Link to={`/memos/${m.id}/edit`}>編集</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListMemos;
