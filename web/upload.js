document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'predictResult';
    const statusBadge = document.getElementById('status');
    const cropSelect = document.getElementById('cropSelect');
    const modelSelect = document.getElementById('modelSelect');
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

    let selectedFile = null;
    let previewDataUrl = '';
    let progressTimer = null;

    const recommendedModelByCrop = {
        rice: 'cnn',
        chili: 'dsvm',
        tomato: 'cnn',
        pumpkin: 'dknn',
    };

    const modelNotes = {
        cnn: 'CNN: độ chính xác cao, phù hợp bộ dữ liệu lớn (PlantVillage).',
        dsvm: 'DSVM: suy luận nhanh, ổn định khi dữ liệu nhỏ hoặc mất cân bằng.',
        dknn: 'DKNN: chống nhiễu, phù hợp mẫu hiếm và môi trường thực địa.',
        auto: 'Tự động: chọn mô hình gợi ý theo cây từ bài báo (CNN/DSVM/DKNN).'
    };

    // Health check for model readiness
    checkHealth();

    // Sync model suggestion when crop changes
    const initCrop = (cropSelect?.value || 'rice').toLowerCase();
    setRecommendedModel(initCrop, true);
    cropSelect?.addEventListener('change', (e) => {
        const crop = (e.target.value || 'rice').toLowerCase();
        setRecommendedModel(crop, false);
    });

    // Drag & drop handling preserves File reference
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
        const crop = (cropSelect?.value || 'rice').toLowerCase();
        formData.append('crop', crop);
        const modelChoice = getModelChoice(crop);
        formData.append('model', modelChoice);

        try {
            progressTimer = setInterval(() => {
                const current = parseInt(progressFill.style.width || '0', 10);
                if (current < 85) animateProgress(current + 7);
            }, 220);

            const res = await fetch('/predict', { method: 'POST', body: formData });
            const data = await res.json();

            if (data && data.error) {
                animateProgress(5);
                results.innerHTML = `<div class="placeholder-card">${data.error}</div>`;
                return;
            }

            animateProgress(100);
            renderPrediction(data);
            cacheAndRedirect(data, crop, modelChoice);
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
        if (!data) {
            results.innerHTML = '<div class="placeholder-card">Không có kết quả.</div>';
            return;
        }
        if (data.error) {
            results.innerHTML = `<div class="placeholder-card">${data.error}</div>`;
            return;
        }
        const pct = Math.round((data.confidence || 0) * 100);
        const disease = data.disease || 'Không xác định';
        const solution = data.solution || 'Theo dõi thêm và vệ sinh ruộng vườn.';
        results.innerHTML = `
            <div class="accordion glow-card">
                <div class="accordion-header">
                    <div>
                        <div class="text-sm text-emerald-100/70">Chẩn đoán</div>
                        <div class="text-xl font-bold">${disease}</div>
                    </div>
                    <div class="text-lg font-semibold">${pct}%</div>
                </div>
                <div class="accordion-content open" style="max-height: 220px;">
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                    <p class="mt-3 text-sm text-slate-200/85">Giải pháp: ${solution}</p>
                </div>
            </div>`;
    }

    function cacheAndRedirect(data, crop, modelChoice) {
        if (!previewDataUrl || !data) return;
        const payload = { image: previewDataUrl, result: data, crop, model: modelChoice };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        window.location.href = '/result.html';
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

    function getModelChoice(crop) {
        const selected = (modelSelect?.value || 'auto').toLowerCase();
        if (selected !== 'auto') return selected;
        return recommendedModelByCrop[crop] || 'cnn';
    }

    function setRecommendedModel(crop, onInit = false) {
        const suggested = recommendedModelByCrop[crop] || 'cnn';
        if (modelSelect && (onInit || modelSelect.value === 'auto')) {
            modelSelect.value = 'auto';
            modelSelect.dataset.suggested = suggested;
            modelSelect.title = modelNotes.auto + ` Gợi ý hiện tại: ${modelLabel(suggested)}.`;
        }
        if (statusBadge) {
            statusBadge.title = modelNotes[modelSelect?.value] || '';
        }
    }

    function modelLabel(key) {
        return ({ cnn: 'CNN', dsvm: 'DSVM', dknn: 'DKNN', auto: 'Tự động' }[key] || key);
    }

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
