import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { BASE_URL, authFetch } from "../utils/api";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatAmount(value) {
  return Number(value).toLocaleString("ja-JP") + " 円";
}

function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch(`${BASE_URL}/invoices/${id}`)
      .then((r) => { if (!r.ok) throw new Error("取得失敗"); return r.json(); })
      .then(setInvoice)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleStatus = async () => {
    const next = invoice.status === "unpaid" ? "paid" : "unpaid";
    const res = await authFetch(`${BASE_URL}/invoices/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) setInvoice((prev) => ({ ...prev, status: next }));
  };

  const handleDelete = async () => {
    if (!window.confirm("削除しますか？")) return;
    const res = await authFetch(`${BASE_URL}/invoices/${id}`, { method: "DELETE" });
    if (res.ok) navigate("/invoices");
  };

  if (loading) return <><Header /><div className="page"><p>読み込み中...</p></div></>;
  if (error || !invoice) return <><Header /><div className="page"><div className="alert-error">{error}</div></div></>;

  return (
    <>
      <Header />
      <main className="page">
        <div className="page-header">
          <h2 className="page-title">{invoice.invoice_number}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`status-badge ${invoice.status === "paid" ? "status-paid" : "status-unpaid"}`}
              onClick={toggleStatus}
            >
              {invoice.status === "paid" ? "入金済み" : "未入金"}
            </button>
            <button className="btn btn-sm btn-danger" onClick={handleDelete}>削除</button>
            <Link to="/invoices" className="btn btn-ghost btn-sm">← 一覧へ</Link>
          </div>
        </div>

        <div className="form-card" style={{ marginBottom: 16 }}>
          <div className="detail-grid">
            <div><span className="detail-label">取引先</span><span className="detail-value">{invoice.client_name}</span></div>
            <div><span className="detail-label">請求日</span><span className="detail-value">{formatDate(invoice.issued_at)}</span></div>
            <div><span className="detail-label">支払期限</span><span className="detail-value">{formatDate(invoice.due_at)}</span></div>
            {invoice.notes && <div style={{ gridColumn: "1 / -1" }}><span className="detail-label">備考</span><span className="detail-value">{invoice.notes}</span></div>}
          </div>
        </div>

        <div className="form-card" style={{ marginBottom: 16 }}>
          <h3 className="section-title">明細</h3>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>品目</th>
                <th style={{ textAlign: "right" }}>数量</th>
                <th style={{ textAlign: "right" }}>単価</th>
                <th style={{ textAlign: "right" }}>税率</th>
                <th style={{ textAlign: "right" }}>小計（税込）</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.item_id}>
                  <td>{item.name}</td>
                  <td style={{ textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>{formatAmount(item.unit_price)}</td>
                  <td style={{ textAlign: "right" }}>{(Number(item.tax_rate) * 100).toFixed(0)}%</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{formatAmount(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="invoice-totals">
            <div className="total-row"><span>小計</span><span>{formatAmount(invoice.subtotal)}</span></div>
            <div className="total-row"><span>消費税</span><span>{formatAmount(invoice.tax_amount)}</span></div>
            <div className="total-row total-final"><span>合計（税込）</span><span>{formatAmount(invoice.total)}</span></div>
          </div>
        </div>
      </main>
    </>
  );
}

export default InvoiceDetail;
