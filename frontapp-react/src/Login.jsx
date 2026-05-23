import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "./utils/api";
import { setToken } from "./utils/auth";
import "./styles.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "ログインに失敗しました");
      }
      const data = await res.json();
      setToken(data.access_token);
      navigate("/list");
    } catch (e) {
      setError(e.message);
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
        <div className="form-card" style={{ maxWidth: 400, margin: "0 auto" }}>
          <h2 className="page-title" style={{ marginBottom: "1.5rem" }}>ログイン</h2>

          {error && <div className="alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">メールアドレス</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">パスワード</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={submitting}
            >
              {submitting ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem" }}>
            アカウントをお持ちでない方は{" "}
            <Link to="/register">新規登録</Link>
          </p>
        </div>
      </main>
    </>
  );
}

export default Login;
