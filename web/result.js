document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'predictResult';
    const statusBadge = document.getElementById('status');
    const diseaseName = document.getElementById('diseaseName');
    const summaryText = document.getElementById('summaryText');
    const severityBadge = document.getElementById('severityBadge');
    const cropBadge = document.getElementById('cropBadge');
    const modelBadge = document.getElementById('modelBadge');
    const modelNote = document.getElementById('modelNote');
    const confidenceValue = document.getElementById('confidenceValue');
    const confBar = document.getElementById('confBar');
    const heroImg = document.getElementById('heroImg');
    const heroHeatmap = document.getElementById('heroHeatmap');
    const segmentationImg = document.getElementById('segmentationImg');
    const segRatio = document.getElementById('segRatio');
    const btnHeatmapToggle = document.getElementById('btnHeatmapToggle');
    const btnNewScan = document.getElementById('btnNewScan');
    const btnDownload = document.getElementById('btnDownload');
    const chatWindow = document.getElementById('chatWindow2');
    const chatInput = document.getElementById('chatInput2');
    const chatSend = document.getElementById('chatSend2');
    const typing = document.getElementById('typing2');
    const quickPrompts = document.getElementById('quickPrompts');
    const chatLoading = document.createElement('div');
    chatLoading.className = 'typing-indicator hidden';
    chatLoading.innerHTML = '<span></span><span></span><span></span>';
    chatWindow?.appendChild(chatLoading);
    const treatmentLight = document.getElementById('treat-light');
    const treatmentMedium = document.getElementById('treat-medium');
    const treatmentHeavy = document.getElementById('treat-heavy');
    const preventionList = document.getElementById('preventionList');

    const recommendedModelByCrop = {
        rice: 'cnn',
        chili: 'dsvm',
        tomato: 'cnn',
        pumpkin: 'dknn',
    };

    const modelNotes = {
        cnn: 'CNN: độ chính xác cao, hợp bộ PlantVillage lớn.',
        dsvm: 'DSVM: suy luận nhanh, ổn định dữ liệu nhỏ/mất cân bằng.',
        dknn: 'DKNN: chống nhiễu tốt, hợp mẫu hiếm và môi trường thực địa.',
        auto: 'Tự động: chọn theo gợi ý cây (CNN/DSVM/DKNN).'
    };

    const articleContext = 'Bài báo: 3 mô hình CNN/DSVM/DKNN huấn luyện PlantVillage; CNN chính xác cao; DSVM nhanh cho dữ liệu nhỏ; DKNN ổn định nhiễu. Cây: rice→CNN, chili→DSVM, tomato→CNN, pumpkin→DKNN.';

    // Load payload
    const payloadRaw = localStorage.getItem(STORAGE_KEY);
    if (!payloadRaw) {
        window.location.href = '/upload.html';
        return;
    }
    const payload = JSON.parse(payloadRaw);
    const image = payload.image;
    const result = payload.result || {};
    const crop = result.crop || payload.crop || 'rice';
    const modelUsed = (result.model || payload.model || recommendedModelByCrop[crop] || 'cnn').toLowerCase();

    // Header actions
    btnNewScan?.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = '/upload.html';
    });
    btnDownload?.addEventListener('click', () => window.print());

    // Health badge
    checkHealth();

    // Render main info
    const confPct = Math.round((result.confidence || 0) * 100);
    const severity = result.severity || severityFromConfidence(confPct);
    diseaseName.textContent = result.disease || 'Không xác định';
    summaryText.textContent = result.summary || 'Theo dõi thêm và giữ lá khô, thoáng. Đây là gợi ý tổng quát.';
    cropBadge.textContent = `Cây: ${cropLabel(crop)}`;
    modelBadge.textContent = `Model: ${modelLabel(modelUsed)}`;
    modelBadge.title = modelNotes[modelUsed] || modelNotes.auto;
    if (modelNote) modelNote.textContent = modelNotes[modelUsed] || modelNotes.auto;
    confidenceValue.textContent = `Độ tin cậy: ${confPct}%`;
    confBar.style.width = `${Math.min(confPct, 100)}%`;

    applySeverity(severityBadge, severity);

    heroImg.src = image;
    heroHeatmap.src = result.heatmap || image;
    segmentationImg.src = result.segmentation || image;
    segRatio.textContent = `${Math.round((result.segmentation_ratio || 0) * 100)}% nhiễm`;

    // Heatmap toggle
    let showHeatmap = true;
    btnHeatmapToggle?.addEventListener('click', () => {
        showHeatmap = !showHeatmap;
        heroHeatmap.classList.toggle('hidden', !showHeatmap);
    });

    // Treatments by severity (fallbacks)
    fillList(treatmentLight, result.treatment_light || result.treatment || [
        'Cắt bỏ lá bệnh, dọn lá rụng, không để ẩm kéo dài.',
        'Tưới gốc, tránh phun lên lá; giữ thoáng gió.',
        'Phun sinh học nhẹ (Trichoderma/gốc đồng nhẹ) theo nhãn.'
    ]);

    fillList(treatmentMedium, result.treatment_medium || [
        'Luân phiên hoạt chất phù hợp tác nhân (nấm: mancozeb/chlorothalonil/strobilurin+triazole).',
        'Tăng Kali/Canxi/Mg, giảm đạm, cải thiện thoát nước.',
        'Kiểm tra sau 3-5 ngày, cắt tỉa tiếp nếu còn ổ bệnh.'
    ]);

    fillList(treatmentHeavy, result.treatment_heavy || [
        'Loại bỏ lá/cây nhiễm nặng để giảm nguồn bệnh.',
        'Phun đặc trị đúng liều, đúng thời điểm, mang bảo hộ.',
        'Tăng thông thoáng, tạm giảm tưới; che mưa nhẹ nếu cần.'
    ]);

    fillList(preventionList, Array.isArray(result.prevention) && result.prevention.length ? result.prevention : [
        'Giữ lá khô, tưới gốc, tránh tưới chiều tối.',
        'Bón cân đối, tránh thừa đạm; bổ sung Kali/Canxi.',
        'Khử trùng dụng cụ cắt tỉa, không chạm cây khỏe sau cây bệnh.',
        'Thu gom lá rụng, thoát nước tốt trước/sau mưa kéo dài.'
    ]);

    // Quick prompts for chat
    const prompts = [
        'Tôi nên phun thuốc gì và liều bao nhiêu?',
        'Có cần cắt bỏ toàn bộ lá bệnh không?',
        'Phòng lây sang cây khác thế nào?',
        'Bao lâu kiểm tra lại sau khi xử lý?'
    ];
    prompts.forEach((p) => {
        const btn = document.createElement('button');
        btn.className = 'chat-quick';
        btn.textContent = p;
        btn.addEventListener('click', () => sendMessage(p));
        quickPrompts.appendChild(btn);
    });

    const seedTreat = [...(result.treatment_light || []), ...(result.treatment_medium || []), ...(result.treatment_heavy || [])]
        .filter(Boolean)
        .slice(0, 3);
    if (seedTreat.length) {
        addBubble('Gợi ý nhanh từ phác đồ: ' + seedTreat.join(' · '), 'ai');
    }
    addBubble(`AI sẵn sàng. Mô hình dùng: ${modelLabel(modelUsed)}. Hỏi về xử lý, liều lượng, phòng ngừa.`, 'ai');

    chatSend?.addEventListener('click', () => sendMessage());
    chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

    async function sendMessage(preset) {
        const text = preset || chatInput.value.trim();
        if (!text) return;
        addBubble(text, 'user');
        chatInput.value = '';
        setTyping(true);
        setChatLoading(true);
        chatSend.disabled = true;
        try {
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    disease: result.disease,
                    crop,
                    model: modelUsed,
                    context: articleContext,
                }),
            });
            const data = await res.json();
            addBubble(data.reply || 'AI chưa phản hồi, thử lại sau.', 'ai');
        } catch (err) {
            addBubble('Lỗi khi gọi AI. Vui lòng thử lại.', 'ai');
        } finally {
            setTyping(false);
            setChatLoading(false);
            chatSend.disabled = false;
        }
    }

    function addBubble(text, role = 'ai') {
        const div = document.createElement('div');
        div.className = `bubble ${role} slide-in`;
        div.textContent = text;
        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function setTyping(active) { typing?.classList.toggle('hidden', !active); }
    function setChatLoading(active) { chatLoading?.classList.toggle('hidden', !active); }

    function fillList(el, arr) {
        el.innerHTML = (arr || []).map((t) => `<li>${t}</li>`).join('');
    }

    function applySeverity(el, sev) {
        el.classList.remove('severity-low', 'severity-medium', 'severity-high');
        if (sev === 'high') {
            el.classList.add('severity-high');
            el.textContent = 'Nặng';
        } else if (sev === 'medium') {
            el.classList.add('severity-medium');
            el.textContent = 'Trung bình';
        } else {
            el.classList.add('severity-low');
            el.textContent = 'Nhẹ';
        }
    }

    function severityFromConfidence(pct) { return pct >= 90 ? 'high' : pct >= 80 ? 'medium' : 'low'; }
    function modelLabel(key) { return ({ cnn: 'CNN', dsvm: 'DSVM', dknn: 'DKNN', auto: 'Tự động' }[key] || key); }
    function cropLabel(c) { return ({ rice: 'Lúa', chili: 'Ớt', tomato: 'Cà chua', pumpkin: 'Bí ngô' }[c] || c); }

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
});
