import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { BASE_URL, authFetch } from "../utils/api";

const DEFAULT_ITEM = { name: "", quantity: 1, unit_price: "", tax_rate: "0.10" };

function calcItem(item) {
  const subtotal = Number(item.unit_price) * Number(item.quantity);
  const tax = Math.floor(subtotal * Number(item.tax_rate));
  return { subtotal, tax, total: subtotal + tax };
}

function formatAmount(n) {
  return Number(n).toLocaleString("ja-JP");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function InvoiceCreate() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [issuedAt, setIssuedAt] = useState(today());
  const [dueAt, setDueAt] = useState(nextMonth());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ ...DEFAULT_ITEM }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch(`${BASE_URL}/invoices/clients`)
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  const updateItem = (i, field, value) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems((prev) => [...prev, { ...DEFAULT_ITEM }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const totals = items.reduce(
    (acc, item) => {
      const { subtotal, tax, total } = calcItem(item);
      return { subtotal: acc.subtotal + subtotal, tax: acc.tax + tax, total: acc.total + total };
    },
    { subtotal: 0, tax: 0, total: 0 }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!clientId) { setError("取引先を選択してください"); return; }
    if (items.some((item) => !item.name || !item.unit_price)) {
      setError("品目名と単価を入力してください");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        client_id: Number(clientId),
        issued_at: `${issuedAt}T00:00:00`,
        due_at: `${dueAt}T00:00:00`,
        notes: notes || null,
        items: items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          tax_rate: Number(item.tax_rate),
        })),
      };
      const res = await authFetch(`${BASE_URL}/invoices/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("作成に失敗しました");
      const data = await res.json();
      navigate(`/invoices/${data.invoice_id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="page">
        <div className="page-header">
          <h2 className="page-title">請求書作成</h2>
          <Link to="/invoices" className="btn btn-ghost">← 一覧へ</Link>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-card" style={{ marginBottom: 16 }}>
            <h3 className="section-title">基本情報</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">取引先 <span className="required">*</span></label>
                <select className="form-select" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                  <option value="">選択してください</option>
                  {clients.map((c) => (
                    <option key={c.client_id} value={c.client_id}>{c.name}</option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    <Link to="/clients">取引先を先に登録してください</Link>
                  </p>
                )}
              </div>
            </div>
            <div className="form-row two-col">
              <div className="form-group">
                <label className="form-label">請求日 <span className="required">*</span></label>
                <input className="form-input" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">支払期限 <span className="required">*</span></label>
                <input className="form-input" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">備考</label>
              <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          <div className="form-card" style={{ marginBottom: 16 }}>
            <h3 className="section-title">明細</h3>
            <table className="items-edit-table">
              <thead>
                <tr>
                  <th>品目名</th>
                  <th style={{ width: 80 }}>数量</th>
                  <th style={{ width: 130 }}>単価（円）</th>
                  <th style={{ width: 100 }}>税率</th>
                  <th style={{ width: 120, textAlign: "right" }}>小計（税込）</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const { total } = calcItem(item);
                  return (
                    <tr key={i}>
                      <td>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="例: Webサイト制作"
                          value={item.name}
                          onChange={(e) => updateItem(i, "name", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(i, "quantity", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="number"
                          min={0}
                          placeholder="300000"
                          value={item.unit_price}
                          onChange={(e) => updateItem(i, "unit_price", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <select className="form-select" value={item.tax_rate} onChange={(e) => updateItem(i, "tax_rate", e.target.value)}>
                          <option value="0.10">10%</option>
                          <option value="0.08">8%</option>
                          <option value="0.00">非課税</option>
                        </select>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {item.unit_price ? formatAmount(total) + " 円" : "-"}
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(i)}>×</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={addItem}>
              + 行を追加
            </button>

            <div className="invoice-totals">
              <div className="total-row"><span>小計</span><span>{formatAmount(totals.subtotal)} 円</span></div>
              <div className="total-row"><span>消費税</span><span>{formatAmount(totals.tax)} 円</span></div>
              <div className="total-row total-final"><span>合計（税込）</span><span>{formatAmount(totals.total)} 円</span></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "作成中..." : "請求書を作成する"}
            </button>
            <Link to="/invoices" className="btn btn-ghost">キャンセル</Link>
          </div>
        </form>
      </main>
    </>
  );
}

export default InvoiceCreate;
