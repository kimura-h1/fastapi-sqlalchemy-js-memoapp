import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { BASE_URL, authFetch } from "../utils/api";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatAmount(value) {
  return Number(value).toLocaleString("ja-JP") + " 円";
}

function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");

  const fetchInvoices = async (status) => {
    try {
      setLoading(true);
      setError("");
      const qs = status ? `?status=${status}` : "";
      const res = await authFetch(`${BASE_URL}/invoices/${qs}`);
      if (!res.ok) throw new Error("取得失敗");
      setInvoices(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(statusFilter); }, [statusFilter]);

  const toggleStatus = async (invoice) => {
    const next = invoice.status === "unpaid" ? "paid" : "unpaid";
    try {
      const res = await authFetch(`${BASE_URL}/invoices/${invoice.invoice_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("更新失敗");
      setInvoices((prev) =>
        prev.map((inv) => inv.invoice_id === invoice.invoice_id ? { ...inv, status: next } : inv)
      );
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("削除しますか？")) return;
    try {
      const res = await authFetch(`${BASE_URL}/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除失敗");
      setInvoices((prev) => prev.filter((inv) => inv.invoice_id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const unpaidTotal = invoices
    .filter((inv) => inv.status === "unpaid")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <>
      <Header />
      <main className="page">
        <div className="page-header">
          <h2 className="page-title">請求書一覧</h2>
          <Link to="/invoices/create" className="btn btn-primary">+ 新規作成</Link>
        </div>

        {unpaidTotal > 0 && (
          <div className="summary-card">
            <span className="summary-label">未入金合計</span>
            <span className="summary-amount">{formatAmount(unpaidTotal)}</span>
          </div>
        )}

        <div className="filter-bar">
          <select
            className="form-select filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">状態: 全て</option>
            <option value="unpaid">未入金</option>
            <option value="paid">入金済み</option>
          </select>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <p style={{ color: "#9ca3af" }}>読み込み中...</p>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <p>請求書がありません</p>
            <Link to="/invoices/create" className="btn btn-primary">最初の請求書を作成する</Link>
          </div>
        ) : (
          <div className="invoice-table-wrap">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>請求書番号</th>
                  <th>取引先</th>
                  <th>請求日</th>
                  <th>支払期限</th>
                  <th style={{ textAlign: "right" }}>金額（税込）</th>
                  <th>状態</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.invoice_id} className={inv.status === "paid" ? "row-paid" : ""}>
                    <td>
                      <Link to={`/invoices/${inv.invoice_id}`} className="invoice-number-link">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td>{inv.client_name}</td>
                    <td>{formatDate(inv.issued_at)}</td>
                    <td>{formatDate(inv.due_at)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{formatAmount(inv.total)}</td>
                    <td>
                      <button
                        className={`status-badge ${inv.status === "paid" ? "status-paid" : "status-unpaid"}`}
                        onClick={() => toggleStatus(inv)}
                        title="クリックで切り替え"
                      >
                        {inv.status === "paid" ? "入金済み" : "未入金"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(inv.invoice_id)}
                      >
                        削除
                      </button>
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

export default InvoiceList;
