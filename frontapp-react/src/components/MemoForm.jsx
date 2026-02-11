import { useState } from "react";
import "./../styles.css";

function MemoForm({
  initialValues = {
    title: "",
    description: "",
    priority: "低",
    dueDate: "",
    isCompleted: false,
  },
  submitLabel = "登録",
  onSubmit,
  submitting = false,
  error = "",
}) {
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [priority, setPriority] = useState(initialValues.priority);
  const [dueDate, setDueDate] = useState(initialValues.dueDate);
  const [isCompleted, setIsCompleted] = useState(initialValues.isCompleted);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({
      title,
      description,
      priority,
      dueDate,
      isCompleted,
    });
  };

  return (
    <div className="form-container">
      {error && <p style={{ marginTop: 12 }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>タイトル</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label>詳細</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label>優先度</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="低">低</option>
            <option value="中">中</option>
            <option value="高">高</option>
          </select>
        </div>

        <div>
          <label>期限日</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <label>完了</label>
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
          />
        </div>

        <div className="button-container">
          <button type="submit" disabled={submitting}>
            {submitting ? "送信中..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MemoForm;
