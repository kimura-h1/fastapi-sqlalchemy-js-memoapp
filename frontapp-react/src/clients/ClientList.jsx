import { useEffect, useState } from "react";
import Header from "../components/Header";
import { BASE_URL, authFetch } from "../utils/api";

const EMPTY_FORM = { name: "", contact_name: "", address: "", email: "" };

function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/invoices/clients`);
      setClients(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true); };
  const openEdit = (client) => {
    setForm({ name: client.name, contact_name: client.contact_name || "", address: client.address || "", email: client.email || "" });
    setEditTarget(client);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editTarget
        ? `${BASE_URL}/invoices/clients/${editTarget.client_id}`
        : `${BASE_URL}/invoices/clients`;
      const method = editTarget ? "PUT" : "POST";
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("保存失敗");
      setShowForm(false);
      fetchClients();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("削除しますか？")) return;
    await authFetch(`${BASE_URL}/invoices/clients/${id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.client_id !== id));
  };

  return (
    <>
      <Header />
      <main className="page">
        <div className="page-header">
          <h2 className="page-title">取引先管理</h2>
          <button className="btn btn-primary" onClick={openCreate}>+ 追加</button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {showForm && (
          <div className="form-card" style={{ marginBottom: 20 }}>
            <h3 className="section-title">{editTarget ? "取引先を編集" : "取引先を追加"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row two-col">
                <div className="form-group">
                  <label className="form-label">会社名 <span className="required">*</span></label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">担当者名</label>
                  <input className="form-input" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                </div>
              </div>
              <div className="form-row two-col">
                <div className="form-group">
                  <label className="form-label">メールアドレス</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">住所</label>
                  <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "保存中..." : "保存"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>キャンセル</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: "#9ca3af" }}>読み込み中...</p>
        ) : clients.length === 0 ? (
          <div className="empty-state"><p>取引先がまだありません</p></div>
        ) : (
          <div className="invoice-table-wrap">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>会社名</th>
                  <th>担当者</th>
                  <th>メール</th>
                  <th>住所</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.client_id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.contact_name || "-"}</td>
                    <td>{c.email || "-"}</td>
                    <td>{c.address || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(c)}>編集</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.client_id)}>削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

export default ClientList;
