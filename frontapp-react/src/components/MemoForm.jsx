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
}) {
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [priority, setPriority] = useState(initialValues.priority);
  const [dueDate, setDueDate] = useState(initialValues.dueDate);
  const [isCompleted, setIsCompleted] = useState(initialValues.isCompleted);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ title, description, priority, dueDate, isCompleted });
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="title">
            タイトル <span className="required">*</span>
          </label>
          <input
            id="title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="メモのタイトルを入力"
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">詳細</label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="詳細を入力（任意）"
            maxLength={255}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="priority">優先度</label>
          <select
            id="priority"
            className="form-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="低">低</option>
            <option value="中">中</option>
            <option value="高">高</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="dueDate">期限日</label>
          <input
            id="dueDate"
            className="form-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">完了</label>
          <div className="form-checkbox-group">
            <input
              id="isCompleted"
              className="form-checkbox"
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
            />
            <label htmlFor="isCompleted" style={{ fontWeight: "normal", cursor: "pointer" }}>
              このメモを完了済みにする
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-success" disabled={submitting}>
            {submitting ? "送信中..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MemoForm;
