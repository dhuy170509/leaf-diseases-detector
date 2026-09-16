// Shared frontend2 interactions (vanilla JS, no animation CDN dependency so
// pages also work on LAN/offline - only transform/opacity, spring easing).

const svgWrap = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const ICONS = {
    home: svgWrap('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>'),
    scan: svgWrap('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3.5"/>'),
    leaf: svgWrap('<path d="M5 19C5 9 13 4 20 4c0 8-5 15-15 15"/><path d="M5 19c3-5 7-9 11-11"/>'),
    chat: svgWrap('<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/>'),
    gear: svgWrap('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    sun: svgWrap('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svgWrap('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
};

// Single shared bottom navigation. Real <a> links to real pages, so the
// browser back/forward buttons and refresh work natively (no state-only tabs).
export const ROUTES = [
    { key: 'index', href: '/frontend2/index.html', label: 'Trang Chủ', icon: ICONS.home },
    { key: 'predict', href: '/frontend2/predict.html', label: 'Phân Tích Ảnh', icon: ICONS.scan },
    { key: 'disease', href: '/frontend2/disease.html', label: 'Thư Viện Bệnh', icon: ICONS.leaf },
    { key: 'support', href: '/frontend2/support.html', label: 'Hỗ Trợ', icon: ICONS.chat },
    { key: 'admin', href: '/frontend2/admin.html', label: 'Quản Trị', icon: ICONS.gear },
];

const THEME_KEY = 'lg-theme';

export function initTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') {
            document.documentElement.dataset.theme = saved;
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.documentElement.dataset.theme = 'light';
        }
    } catch { /* ignore */ }
}

export function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    syncThemeToggle();
}

function syncThemeToggle() {
    const btn = document.querySelector('.bn-toggle');
    if (!btn) return;
    const light = document.documentElement.dataset.theme === 'light';
    btn.querySelector('.icon-light').style.display = light ? 'none' : 'grid';
    btn.querySelector('.icon-dark').style.display = light ? 'grid' : 'none';
    btn.setAttribute('aria-label', light ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng');
}

export function initBottomNav() {
    initTheme();
    if (document.querySelector('.bottom-nav')) { syncThemeToggle(); return; }
    const path = window.location.pathname;
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.setAttribute('aria-label', 'Điều hướng chính');
    nav.innerHTML = ROUTES.map(r => {
        const active = path.endsWith(`/${r.key}.html`) || (r.key === 'index' && (path === '/' || path.endsWith('/frontend2/') || path.endsWith('/frontend2')));
        return `<a href="${r.href}" class="${active ? 'active' : ''}" aria-current="${active ? 'page' : 'false'}"><span class="bn-icon">${r.icon}</span><span>${r.label}</span></a>`;
    }).join('') +
        `<button type="button" class="bn-toggle"><span class="bn-icon icon-light">${ICONS.sun}</span><span class="bn-icon icon-dark" style="display:none">${ICONS.moon}</span><span> Giao diện</span></button>`;
    document.body.append(nav);
    nav.querySelector('.bn-toggle').addEventListener('click', toggleTheme);
    syncThemeToggle();
}

export function animateHero() {
    const els = document.querySelectorAll('.hero');
    els.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
        els.forEach(el => {
            el.style.transition = 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }));
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
    // Single reveal effect (IO-based, same as registerReveal) to avoid
    // multiple competing animation styles across the site.
    registerReveal(selector);
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
      <button class="chat-toggle" aria-label="Mở chat hỗ trợ">${ICONS.chat}</button>
      <div class="chat-panel">
                <div class="chat-panel__header">
                    <span>${title}<span class="muted" style="font-size:12px;">${apiEndpoint ? '(AI)' : '(demo)'}</span></span>
                    ${allowClientKey ? '<button class="chat-key" type="button">🔑</button>' : ''}
                </div>
        <div class="chat-panel__body" id="chatDockMessages">
          <div class="chat-msg bot">Chào bạn! Hỏi mình về cách dùng LeafGuard nhé.</div>
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
        if (apiEndpoint) {
            sendToApi(text);
        } else {
            push('bot', 'Chat chưa được cấu hình endpoint.');
        }
    };

    function push(who, text) {
        const div = document.createElement('div');
        div.className = `chat-msg ${who}`;
        div.textContent = text;
        box.append(div);
        box.scrollTop = box.scrollHeight;
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
            if (!res.ok) throw new Error(data.detail || data.error || 'Chat API lỗi');
            const suffix = data.source && data.source !== 'openai' ? ` (${data.source})` : '';
            push('bot', (data.message || data.reply || JSON.stringify(data)) + suffix);
        } catch (err) {
            push('bot', `Không gọi được AI: ${err.message}`);
        }
    }

    requestAnimationFrame(() => dock.classList.add('show'));
}
