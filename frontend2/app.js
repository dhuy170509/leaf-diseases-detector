// Shared frontend2 interactions: GSAP animations, toast, drag-drop helper, fetch helpers
import gsap from "https://cdn.skypack.dev/gsap";

export function animateHero() {
    gsap.from(".hero", { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" });
}

export function toast(msg) {
    const t = document.querySelector('.toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

export function initDropdownSearch(selectEl, inputEl) {
    const options = Array.from(selectEl.options);
    const filter = () => {
        const q = inputEl.value.toLowerCase();
        selectEl.innerHTML = '';
        options.filter(o => o.text.toLowerCase().includes(q)).forEach(o => selectEl.append(o));
    };
    inputEl.addEventListener('input', filter);
}

export function bindDropzone(dropEl, fileInput) {
    dropEl.addEventListener('dragover', e => { e.preventDefault(); dropEl.classList.add('dragover'); });
    dropEl.addEventListener('dragleave', () => dropEl.classList.remove('dragover'));
    dropEl.addEventListener('drop', e => {
        e.preventDefault(); dropEl.classList.remove('dragover');
        const f = e.dataTransfer.files[0];
        if (f) fileInput.files = e.dataTransfer.files;
    });
}

export async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Request failed');
    return data;
}

export function animateIn(selector) {
    gsap.from(selector, { y: 24, opacity: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" });
}

export function registerReveal(selector) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                en.target.classList.add('show');
                obs.unobserve(en.target);
            }
        });
    }, { threshold: 0.2 });
    els.forEach(el => { el.classList.add('reveal'); obs.observe(el); });
}

export function initFloatingChat(opts = {}) {
    const existing = document.querySelector('.chat-dock');
    if (existing) return;
    const { title = 'LeafGuard AI Chat', placeholder = 'Hỏi về bệnh, model, triển khai...', apiEndpoint = '', allowClientKey = true } = opts;
    const storageKey = 'CHAT_API_KEY';
    let apiKey = allowClientKey ? (localStorage.getItem(storageKey) || '') : '';
    const dock = document.createElement('div');
    dock.className = 'chat-dock reveal';
    dock.innerHTML = `
      <button class="chat-toggle">💬</button>
      <div class="chat-panel">
                <div class="chat-panel__header">
                    <span>${title}<span class="muted" style="font-size:12px;">${apiEndpoint ? '(AI)' : '(demo)'}</span></span>
                    ${allowClientKey ? '<button class="chat-key" type="button">🔑</button>' : ''}
                </div>
        <div class="chat-panel__body" id="chatDockMessages">
          <div class="chat-msg bot">Chào bạn! Mình là bot demo, có thể gợi ý cách dùng LeafGuard.</div>
        </div>
        <form class="chat-panel__input" id="chatDockForm">
          <input id="chatDockInput" class="input" placeholder="${placeholder}" />
          <button class="btn" type="submit">Gửi</button>
        </form>
      </div>`;
    document.body.append(dock);

    const toggle = dock.querySelector('.chat-toggle');
    toggle.onclick = () => dock.classList.toggle('open');

    const form = dock.querySelector('#chatDockForm');
    const input = dock.querySelector('#chatDockInput');
    const box = dock.querySelector('#chatDockMessages');
    const keyBtn = dock.querySelector('.chat-key');

    if (keyBtn) {
        keyBtn.onclick = () => {
            const v = prompt('Nhập API key cho chat (Bearer)');
            if (v) {
                apiKey = v.trim();
                localStorage.setItem(storageKey, apiKey);
            }
        };
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        push('user', text);
        input.value = '';
        if (apiEndpoint && apiKey) {
            sendToApi(text);
        } else {
            setTimeout(() => push('bot', botReply(text)), 380);
        }
    };

    function push(who, text) {
        const div = document.createElement('div');
        div.className = `chat-msg ${who}`;
        div.textContent = text;
        box.append(div);
        box.scrollTop = box.scrollHeight;
    }

    function botReply(text) {
        const t = text.toLowerCase();
        if (t.includes('deploy') || t.includes('triển')) return 'Triển khai: dùng hot_swap để activate release, rollback nếu lỗi. API chạy 0 downtime.';
        if (t.includes('model') || t.includes('ensemble')) return 'Ensemble đang active, inference local-only, có thể upload release mới ở trang quản trị.';
        if (t.includes('predict') || t.includes('ảnh')) return 'Vào trang Dự đoán, chọn cây, tải ảnh lá rõ và bấm Dự đoán. Bạn sẽ nhận gợi ý xử lý.';
        if (t.includes('lock') || t.includes('khoá')) return 'Bạn có thể khoá cứng hệ thống trong trang admin (hard lock) khi cần bảo trì.';
        return 'Mình là bot demo, chưa nối LLM. Bạn cần thêm gì?';
    }

    async function sendToApi(text) {
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Chat API lỗi');
            push('bot', data.reply || JSON.stringify(data));
        } catch (err) {
            push('bot', `Không gọi được AI: ${err.message}`);
        }
    }

    requestAnimationFrame(() => dock.classList.add('show'));
}
