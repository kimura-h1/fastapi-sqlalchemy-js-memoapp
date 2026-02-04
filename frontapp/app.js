// APIのURL
const apiUrl = 'http://localhost:8000/memos/';

// メモ一覧取得（キャッシュ回避付き）
async function fetchAndDisplayMemos() {
    try {
         const response = await fetch(apiUrl + '?t=' + new Date().getTime(), { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const memos = await response.json();
        const memosTableBody = document.querySelector('#memos tbody');
        memosTableBody.innerHTML = '';

        memos.forEach(memo => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${memo.title}</td>
                <td>${memo.description}</td>
                <td>${memo.status.priority}</td>
                <td>${memo.status.due_date ? memo.status.due_date.split('T')[0] : ''}</td>
                <td>
                    <input type="checkbox" class="toggle-completed" data-id="${memo.memo_id}" ${memo.status.is_completed ? 'checked' : ''}>
                </td>
                    <button class="edit" data-id="${memo.memo_id}">編集</button>
                    <button class="delete" data-id="${memo.memo_id}">削除</button>
                </td>
            `;
            memosTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('メモ一覧取得中にエラー:', error);
    }
}

// ページ読み込み後に実行
document.addEventListener('DOMContentLoaded', fetchAndDisplayMemos);


async function deleteMemo(memoId) {
    try {
        // APIに「DELETEリクエスト」を送信してメモを削除します。
        const response = await fetch(`${apiUrl}${memoId}`, {
            method: 'DELETE'
        });
        // レスポンスのボディをJSONとして解析
        const data = await response.json();
        // レスポンスが成功した場合（HTTPステータスコード：200）
        if (response.ok) {
            // 成功メッセージをアラートで表示
            displayMessage(data.message);
            // メモ一覧を最新の状態に更新
            await fetchAndDisplayMemos();
        } else {
            // レスポンスが失敗した場合、エラーメッセージを表示
            displayMessage(data.detail);
        }
    } catch (error) {
        // ネットワークエラーやその他の理由でリクエスト自体が失敗した場合
        console.error('メモ削除中にエラーが発生しました:', error);
    }
}

// ページ読み込み後に一覧を取得
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayMemos();

    // 削除ボタンのクリックイベント（イベントデリゲーション）
    document.querySelector('#memos tbody').addEventListener('click', (e) => {
        const btn = e.target.closest('button.delete'); // 安全にボタンを取得
        if (btn) {
            const memoId = btn.dataset.id;
            if (!memoId) {
                console.error("削除対象のIDが取得できません", btn);
                return;
            }
            if (confirm(`ID ${memoId} のメモを削除しますか？`)) {
                deleteMemo(memoId);
            }
        }
    });
});


document.querySelector('#memos tbody').addEventListener('click', (e) => {
  const editBtn = e.target.closest('button.edit');
  if (editBtn) {
    const id = editBtn.dataset.id;
    // 例: edit.html?id=123 に遷移
    window.location.href = `edit.html?id=${encodeURIComponent(id)}`;
    return;
  }
  // 既存の削除処理はそのまま
});

// 完了トグル
document.querySelector('#memos tbody').addEventListener('change', (e) => {
    const checkbox = e.target.closest('input.toggle-completed');
    if (checkbox) {
        const id = checkbox.dataset.id;
        const newStatus = checkbox.checked;
        fetch(`${apiUrl}${id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ is_completed: newStatus })
        })
        .then(res => res.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(err => console.error('完了トグル失敗:', err));
    }
});
