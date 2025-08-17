const apiUrl = 'http://localhost:8000/memos/';
const params = new URLSearchParams(window.location.search);
const memoId = params.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch(apiUrl + memoId);
    const memo = await response.json();

    document.getElementById('title').value = memo.title;
    document.getElementById('description').value = memo.description || '';
    document.getElementById('priority').value = memo.status.priority;
    document.getElementById('due_date').value = memo.status.due_date?.split('T')[0] || '';
    document.getElementById('is_completed').checked = memo.status.is_completed;
});

document.getElementById('editMemoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        status: {
            priority: document.getElementById('priority').value,
            due_date: document.getElementById('due_date').value || null,
            is_completed: document.getElementById('is_completed').checked
        }
    };

    const response = await fetch(apiUrl + memoId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert('更新しました');
        window.location.href = 'list.html';
    } else {
        const data = await response.json();
        console.error("エラー詳細:", data);
        alert('エラー: ' + JSON.stringify(data));
    }
});
