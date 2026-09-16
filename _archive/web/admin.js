document.addEventListener('DOMContentLoaded', () => {
    const keyInput = document.getElementById('adminKey');
    const status = document.getElementById('adminStatus');
    const uploadTable = document.getElementById('uploadTable');
    const feedbackList = document.getElementById('adminFeedbackList');
    const uploadCount = document.getElementById('uploadCount');
    const feedbackCount = document.getElementById('feedbackCount');
    const btnLoad = document.getElementById('btnLoad');
    const btnClearUploads = document.getElementById('btnClearUploads');
    const btnClearFeedback = document.getElementById('btnClearFeedback');
    const btnDownloadUploads = document.getElementById('btnDownloadUploads');
    const btnDownloadFeedback = document.getElementById('btnDownloadFeedback');

    function getKey() {
        return (sessionStorage.getItem('ADMIN_KEY') || keyInput.value || '').trim();
    }

    function setStatus(text, ok = true) {
        if (!status) return;
        status.textContent = text;
        status.classList.toggle('hidden', !text);
        status.classList.toggle('text-emerald-200', ok);
        status.classList.toggle('text-amber-200', !ok);
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function cropLabel(c) {
        const map = { rice: 'Lúa', chili: 'Ớt', tomato: 'Cà chua', pumpkin: 'Bí ngô' };
        return map[c] || c || 'N/A';
    }

    async function loadState() {
        const key = getKey();
        if (!key) {
            setStatus('Nhập password admin trước khi tải.', false);
            return;
        }
        setStatus('Đang tải...', true);
        try {
            const res = await fetch('/admin/api/state', { headers: { 'X-Admin-Key': key } });
            if (res.status === 401) {
                setStatus('Sai password hoặc chưa được cấp quyền.', false);
                return;
            }
            const data = await res.json();
            sessionStorage.setItem('ADMIN_KEY', key);
            renderUploads(data.uploads || []);
            renderFeedback(data.feedback || []);
            setStatus('Đã tải xong.', true);
        } catch (err) {
            setStatus('Không tải được dữ liệu.', false);
        }
    }

    function renderUploads(rows) {
        if (!uploadTable) return;
        if (!Array.isArray(rows) || !rows.length) {
            uploadTable.innerHTML = '<tr><td colspan="5" class="px-3 py-2 text-slate-300">Chưa có dữ liệu.</td></tr>';
            uploadCount.textContent = '0 bản ghi';
            return;
        }
        uploadCount.textContent = `${rows.length} bản ghi`;
        uploadTable.innerHTML = rows
            .map(
                (r) => `
                <tr class="hover:bg-white/5">
                    <td class="px-3 py-2 align-top">${escapeHtml(r.ts)}</td>
                    <td class="px-3 py-2 align-top">${escapeHtml(r.ip || '')}</td>
                    <td class="px-3 py-2 align-top">${escapeHtml(cropLabel(r.crop))}</td>
                    <td class="px-3 py-2 align-top">${escapeHtml(r.label || r.class)}</td>
                    <td class="px-3 py-2 align-top">${escapeHtml(r.confidence || '')}</td>
                    <td class="px-3 py-2 align-top break-all">${escapeHtml(r.filename || '')}</td>
                </tr>`
            )
            .join('');
    }

    function renderFeedback(items) {
        if (!feedbackList) return;
        if (!Array.isArray(items) || !items.length) {
            feedbackList.innerHTML = '<div class="placeholder-card">Chưa có phản hồi.</div>';
            feedbackCount.textContent = '0 bản ghi';
            return;
        }
        feedbackCount.textContent = `${items.length} bản ghi`;
        feedbackList.innerHTML = items
            .map(
                (f) => `
                <div class="info-card">
                    <div class="flex items-center justify-between text-xs text-slate-300/80">
                        <span>${escapeHtml(f.ts)}</span>
                        <span class="pill">${escapeHtml(cropLabel(f.crop || ''))}</span>
                    </div>
                    <div class="text-sm font-semibold text-emerald-100 mt-1">${escapeHtml(f.name || 'Ẩn danh')}</div>
                    <div class="text-sm text-slate-100 mt-1">${escapeHtml(f.message || '')}</div>
                    ${f.contact ? `<div class="text-xs text-slate-400 mt-1">Liên hệ: ${escapeHtml(f.contact)}</div>` : ''}
                </div>`
            )
            .join('');
    }

    async function clearTarget(target) {
        const key = getKey();
        if (!key) {
            setStatus('Nhập password admin.', false);
            return;
        }
        setStatus(`Đang xoá ${target}...`, true);
        try {
            const res = await fetch('/admin/api/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
                body: JSON.stringify({ target }),
            });
            if (!res.ok) {
                setStatus('Không xoá được, kiểm tra quyền.', false);
                return;
            }
            if (target === 'uploads') {
                renderUploads([]);
            } else {
                renderFeedback([]);
            }
            setStatus('Đã xoá xong.', true);
        } catch (err) {
            setStatus('Không xoá được.', false);
        }
    }

    btnLoad.addEventListener('click', loadState);
    btnClearUploads.addEventListener('click', () => clearTarget('uploads'));
    btnClearFeedback.addEventListener('click', () => clearTarget('feedback'));

    async function download(target) {
        const key = getKey();
        if (!key) {
            setStatus('Nhập password admin.', false);
            return;
        }
        const url = `/admin/api/download?target=${encodeURIComponent(target)}&key=${encodeURIComponent(key)}`;
        window.location.href = url;
    }

    btnDownloadUploads.addEventListener('click', () => download('uploads'));
    btnDownloadFeedback.addEventListener('click', () => download('feedback'));

    // Auto load if key cached
    if (sessionStorage.getItem('ADMIN_KEY')) {
        loadState();
    }
});
