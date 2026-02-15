export default function ErrorBox({ message, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        width: "min(520px, calc(100vw - 32px))",
        minHeight: "60px",

        backgroundColor: "white",
        border: "1px solid #ddd",
        borderLeft: "6px solid red",
        borderRadius: 8,
        padding: "12px 14px",

        boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
        zIndex: 99999,
      }}
    >
      {message ? (
        <div style={{ color: "red", whiteSpace: "pre-wrap" }}>
          {message}
        </div>
      ) : (
        <div style={{ color: "#aaa" }}>
          エラーメッセージはここに表示されます
        </div>
      )}

      {message && onClose && (
        <button
          onClick={onClose}
          style={{
            marginTop: "8px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#666",
          }}
        >
          閉じる
        </button>
      )}
    </div>
  );
}
