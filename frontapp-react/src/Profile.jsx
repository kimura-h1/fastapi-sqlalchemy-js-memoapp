import { useEffect, useState } from "react";
import Header from "./components/Header";
import { BASE_URL, authFetch } from "./utils/api";

const EMPTY = { display_name: "", company_name: "", address: "", phone: "", bank_info: "" };

function Profile() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch(`${BASE_URL}/invoices/profile/me`)
      .then((r) => r.json())
      .then((data) => { if (data) setForm(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setSubmitting(true);
    try {
      const res = await authFetch(`${BASE_URL}/invoices/profile/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      setSuccess("保存しました");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <><Header /><div className="page"><p>読み込み中...</p></div></>;

  return (
    <>
      <Header />
      <main className="page">
        <div className="page-header">
          <h2 className="page-title">プロフィール設定</h2>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div className="form-card">
          <h3 className="section-title">請求書に表示される情報</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row two-col">
              <div className="form-group">
                <label className="form-label">氏名 <span className="required">*</span></label>
                <input className="form-input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">屋号・会社名</label>
                <input className="form-input" value={form.company_name || ""} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              </div>
            </div>
            <div className="form-row two-col">
              <div className="form-group">
                <label className="form-label">住所</label>
                <input className="form-input" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">電話番号</label>
                <input className="form-input" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">振込先口座情報</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={"例:\n〇〇銀行 △△支店 普通 1234567\n口座名義: 山田 太郎"}
                value={form.bank_info || ""}
                onChange={(e) => setForm({ ...form, bank_info: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "保存中..." : "保存する"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

export default Profile;
