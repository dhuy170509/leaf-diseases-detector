document.addEventListener('DOMContentLoaded', () => {
    const statusBadge = document.getElementById('status');
    const fileInput = document.getElementById('fileInput');
    const drop = document.getElementById('drop');
    const previewContainer = document.getElementById('previewContainer');
    const preview = document.getElementById('preview');
    const predictBtn = document.getElementById('predictBtn');
    const btnLabel = document.getElementById('btnLabel');
    const btnPulse = document.getElementById('btnPulse');
    const progressShell = document.getElementById('progressShell');
    const progressFill = document.getElementById('progressFill');
    const results = document.getElementById('results');
    const resetBtn = document.getElementById('resetBtn');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatWindow = document.getElementById('chatWindow');
    const typing = document.getElementById('typing');
    const navDrawer = document.getElementById('nav-drawer');
    const navToggle = document.getElementById('nav-toggle');
    const diseaseList = document.getElementById('disease-list');
    const diseaseModal = document.getElementById('diseaseModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalCause = document.getElementById('modalCause');
    const modalEffect = document.getElementById('modalEffect');
    const modalClose = document.getElementById('modalClose');
    const contactForm = document.getElementById('contactForm');
    const contactStatus = document.getElementById('contactStatus');
    const toast = document.getElementById('toast');

    let selectedFile = null;
    let previewDataUrl = '';

    // Smooth scroll navigation
    document.querySelectorAll('[data-target]').forEach((link) => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-target');
            const el = document.getElementById(target);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            navDrawer?.classList.add('hidden');
        });
    });
    navToggle?.addEventListener('click', () => navDrawer?.classList.toggle('hidden'));

    // Drag & drop upload (keeps File reference so FormData is never lost)
    ['dragenter', 'dragover'].forEach((eventName) => {
        drop?.addEventListener(eventName, (e) => {
            e.preventDefault();
            drop.classList.add('ring-2', 'ring-emerald-400/70');
        });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
        drop?.addEventListener(eventName, (e) => {
            e.preventDefault();
            drop.classList.remove('ring-2', 'ring-emerald-400/70');
        });
    });
    drop?.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) setSelectedFile(file);
    });
    drop?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) setSelectedFile(file);
    });
    resetBtn?.addEventListener('click', resetPredict);

    function setSelectedFile(file) {
        selectedFile = file;
        const url = URL.createObjectURL(file);
        preview.src = url;
        previewContainer.classList.remove('hidden');
        predictBtn.disabled = false;
        results.innerHTML = '<div class="placeholder-card">Sẵn sàng dự đoán.</div>';
        const reader = new FileReader();
        reader.onload = () => { previewDataUrl = reader.result; };
        reader.readAsDataURL(file);
    }

    predictBtn?.addEventListener('click', async () => {
        if (!selectedFile) return;
        setLoading(true);
        results.innerHTML = '';
        progressShell?.classList.remove('hidden');
        animateProgress(0);

        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.name);

        let progressTimer;
        try {
            progressTimer = setInterval(() => {
                const current = parseInt(progressFill.style.width || '0', 10);
                if (current < 85) animateProgress(current + 7);
            }, 250);

            const res = await fetch('/predict', { method: 'POST', body: formData });
            const data = await res.json();
            animateProgress(100);
            renderPrediction(data);
            cacheAndRedirect(data);
        } catch (err) {
            console.error(err);
            results.innerHTML = '<div class="placeholder-card">Lỗi khi dự đoán.</div>';
        } finally {
            clearInterval(progressTimer);
            setTimeout(() => progressShell?.classList.add('hidden'), 450);
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        predictBtn.disabled = isLoading;
        btnLabel.textContent = isLoading ? 'Đang phân tích...' : 'Phân tích ảnh';
        btnPulse.style.opacity = isLoading ? 1 : 0;
    }

    function animateProgress(value) {
        if (progressFill) progressFill.style.width = `${Math.min(value, 100)}%`;
    }

    function renderPrediction(data) {
        if (!data || !data.disease) {
            results.innerHTML = '<div class="placeholder-card">Không có kết quả.</div>';
            return;
        }

        function cacheAndRedirect(data) {
            if (!previewDataUrl) return;
            const payload = { image: previewDataUrl, result: data };
            sessionStorage.setItem('predictResult', JSON.stringify(payload));
            window.location.href = '/predict.html';
        }
        const pct = Math.round((data.confidence || 0) * 100);
        const solution = data.solution || 'Theo dõi thêm và vệ sinh ruộng vườn.';
        results.innerHTML = `
            <div class="accordion glow-card">
                <div class="accordion-header">
                    <div>
                        <div class="text-sm text-emerald-100/70">Chẩn đoán</div>
                        <div class="text-xl font-bold">${data.disease}</div>
                    </div>
                    <div class="text-lg font-semibold">${pct}%</div>
                </div>
                <div class="accordion-content open" style="max-height: 220px;">
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                    <p class="mt-3 text-sm text-slate-200/85">Giải pháp: ${solution}</p>
                </div>
            </div>`;
    }

    function resetPredict() {
        selectedFile = null;
        previewDataUrl = '';
        fileInput.value = '';
        preview.src = '';
        previewContainer.classList.add('hidden');
        progressShell?.classList.add('hidden');
        animateProgress(0);
        predictBtn.disabled = true;
        results.innerHTML = '<div class="placeholder-card">Tải ảnh để xem kết quả.</div>';
    }

    // Disease flip cards + modal
    const diseases = [
        { name: 'Đạo ôn lúa', cause: 'Nấm Pyricularia oryzae', effect: 'Vết cháy lá hình thoi, lan nhanh khi ẩm.', action: 'Giữ ruộng thoáng, phun thuốc đặc trị sớm.' },
        { name: 'Bạc lá lúa', cause: 'Vi khuẩn Xanthomonas oryzae', effect: 'Lá bạc trắng, cháy khô từ chóp.', action: 'Bón cân đối, thoát nước tốt, dùng thuốc vi khuẩn.' },
        { name: 'Thán thư mận', cause: 'Nấm Colletotrichum', effect: 'Đốm lõm trên quả, lá cháy viền.', action: 'Tỉa tán, phun đồng hoặc thuốc đặc trị thán thư.' },
        { name: 'Rỉ sắt mận', cause: 'Tác nhân nấm', effect: 'Đốm nâu đỏ mặt dưới lá, rụng sớm.', action: 'Dọn lá rụng, phun thuốc gốc đồng/nhóm triazole.' },
    ];

    diseaseList.innerHTML = diseases
        .map(
            (d) => `
                <div class="flip-card animate-on-scroll">
                    <div class="flip-inner">
                        <div class="flip-face">
                            <div class="text-lg font-semibold mb-1">${d.name}</div>
                            <div class="text-sm text-emerald-100/80">${d.cause}</div>
                            <button class="primary-btn mt-4 w-full" data-disease="${d.name}">Xem chi tiết</button>
                        </div>
                        <div class="flip-face flip-back">
                            <div class="text-sm text-slate-200/85">${d.effect}</div>
                        </div>
                    </div>
                </div>`
        )
        .join('');

    diseaseList.querySelectorAll('button[data-disease]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const d = diseases.find((x) => x.name === btn.dataset.disease);
            if (!d) return;
            modalTitle.textContent = d.name;
            modalCause.textContent = d.cause;
            modalEffect.textContent = `${d.effect} Giải pháp: ${d.action}`;
            diseaseModal?.classList.remove('hidden');
        });
    });
    modalClose?.addEventListener('click', () => diseaseModal?.classList.add('hidden'));
    diseaseModal?.addEventListener('click', (e) => {
        if (e.target === diseaseModal) diseaseModal.classList.add('hidden');
    });

    // Chat with typing indicator
    function addBubble(text, role = 'ai') {
        const div = document.createElement('div');
        div.className = `bubble ${role}`;
        div.textContent = text;
        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    addBubble('AI đã sẵn sàng. Hỏi về bệnh cây hoặc quy trình xử lý.', 'ai');

    chatSend?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        addBubble(text, 'user');
        chatInput.value = '';
        setTyping(true);
        chatSend.disabled = true;
        try {
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });
            const data = await res.json();
            addBubble(data.reply || 'Không nhận được phản hồi.', 'ai');
        } catch (err) {
            addBubble('Lỗi gọi AI.', 'ai');
        } finally {
            setTyping(false);
            chatSend.disabled = false;
        }
    }

    function setTyping(active) {
        if (!typing) return;
        typing.classList.toggle('hidden', !active);
    }

    // Health check
    async function checkHealth() {
        try {
            const res = await fetch('/health');
            if (res.ok) {
                statusBadge.textContent = 'Mô hình sẵn sàng';
                statusBadge.classList.add('text-emerald-200');
                statusBadge.classList.remove('text-amber-200');
            } else {
                statusBadge.textContent = 'Chưa sẵn sàng';
                statusBadge.classList.add('text-amber-200');
            }
        } catch (err) {
            statusBadge.textContent = 'Không truy cập được';
            statusBadge.classList.add('text-amber-200');
        }
    }
    checkHealth();

    // Contact form → POST /contact
    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('contactName').value.trim(),
            email: document.getElementById('contactEmail').value.trim(),
            message: document.getElementById('contactMessage').value.trim(),
        };
        contactStatus.classList.remove('hidden');
        contactStatus.textContent = 'Đang gửi...';
        try {
            const res = await fetch('/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                contactStatus.textContent = 'Đã ghi nhận thông tin.';
                contactForm.reset();
                showToast('Đã gửi liên hệ thành công');
            } else {
                contactStatus.textContent = 'Gửi thất bại.';
            }
        } catch (err) {
            contactStatus.textContent = 'Lỗi kết nối.';
        }
        setTimeout(() => contactStatus.classList.add('hidden'), 2500);
    });

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2600);
    }

    // Scroll-trigger animations
    const animated = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    animated.forEach((el) => observer.observe(el));

    // Parallax micro-motion
    const parallaxItems = document.querySelectorAll('.parallax');
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        parallaxItems.forEach((el) => {
            const depth = Number(el.dataset.depth || 12);
            el.style.transform = `translateY(${y * (depth / 1200)}px)`;
        });
    });
});
