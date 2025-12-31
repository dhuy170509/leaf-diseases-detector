const DEFAULT_PORT = 8000;

const normalizeApiBase = (raw) => {
    if (!raw) return "";
    const trimmed = raw.replace(/\/$/, "");
    if (trimmed.startsWith("http")) return trimmed;
    return `${window.location.protocol}//${trimmed}`.replace(/\/$/, "");
};

const params = new URLSearchParams(window.location.search);
const paramApi = params.get("api") || params.get("api_base");
const storedApi = localStorage.getItem("api_base") || "";
const host = window.location.hostname && !["localhost", "127.0.0.1", ""].includes(window.location.hostname)
    ? window.location.hostname
    : "0.0.0.0";
const fallbackPort = window.location.port || DEFAULT_PORT;
const fallbackBase = `${window.location.protocol}//${host}:${fallbackPort}`;
const API_BASE = normalizeApiBase(paramApi || storedApi || fallbackBase);
if (paramApi) localStorage.setItem("api_base", API_BASE);

const API_URL = `${API_BASE}/predict`;
const HEALTH_URL = `${API_BASE}/health`;
const PROGRESS_URL = `${API_BASE}/progress`;
const MODELS_URL = `${API_BASE}/models`;
const SYSTEM_STATUS_URL = `${API_BASE}/system_status`;
const CIRC = 339;

let currentImageDataUrl = null;
let lastResult = null;
let progressStream = null;
let systemLocked = false;
let cameraStream = null;

const els = {
    dropZone: document.getElementById("dropZone"),
    fileInput: document.getElementById("fileInput"),
    selectBtn: document.getElementById("selectBtn"),
    preview: document.getElementById("preview"),
    scanLine: document.getElementById("scanLine"),
    statusBadge: document.getElementById("statusBadge"),
    crop: document.getElementById("crop"),
    disease: document.getElementById("disease"),
    confidence: document.getElementById("confidence"),
    severity: document.getElementById("severity"),
    chem: document.getElementById("chemList"),
    treat: document.getElementById("treatList"),
    prev: document.getElementById("prevList"),
    reliabilityScore: document.getElementById("reliabilityScore"),
    reliabilityStatus: document.getElementById("reliabilityStatus"),
    validatorList: document.getElementById("validatorList"),
    rejectReason: document.getElementById("rejectReason"),
    healthModelList: document.getElementById("healthModelList"),
    fpsFill: document.getElementById("fpsFill"),
    fpsLabel: document.getElementById("fpsLabel"),
    memFill: document.getElementById("memFill"),
    memLabel: document.getElementById("memLabel"),
    progressBar: document.getElementById("progressBar"),
    ring: document.getElementById("ring"),
    ringIndicator: document.getElementById("ringIndicator"),
    ringText: document.getElementById("ringText"),
    progressStatus: document.getElementById("progressStatus"),
    heatmapOverlay: document.getElementById("heatmapOverlay"),
    top3List: document.getElementById("top3List"),
    historyList: document.getElementById("historyList"),
    historyCard: document.getElementById("historyCard"),
    historyBtn: document.getElementById("historyBtn"),
    clearHistory: document.getElementById("clearHistory"),
    shareBtn: document.getElementById("shareBtn"),
    pdfBtn: document.getElementById("pdfBtn"),
    offlineBadge: document.getElementById("offlineBadge"),
    cropSelect: document.getElementById("cropSelect"),
    serverStatus: document.getElementById("serverStatus"),
    liveVideo: document.getElementById("liveVideo"),
    cameraBtn: document.getElementById("cameraBtn"),
    captureBtn: document.getElementById("captureBtn"),
};

function setProgress(v) {
    const val = Math.min(100, Math.max(0, v));
    els.progressBar.style.width = `${val}%`;
    if (els.ringIndicator) {
        const offset = CIRC - (CIRC * val) / 100;
        els.ringIndicator.style.strokeDashoffset = offset;
    }
    if (els.ringText) {
        els.ringText.textContent = val >= 99 ? "Hoàn tất" : `Đang tải ${val}%`;
    }
}

function setProgressStatus(text) {
    if (!els.progressStatus) return;
    els.progressStatus.textContent = text;
}

function openProgressStream() {
    closeProgressStream();
    try {
        progressStream = new EventSource(PROGRESS_URL);
        progressStream.onmessage = (evt) => {
            try {
                const payload = JSON.parse(evt.data || "{}");
                if (typeof payload.progress === "number") {
                    setProgress(Math.round(payload.progress * 100));
                }
                if (payload.detail) {
                    setStatus(payload.detail, "soft");
                    setProgressStatus(payload.detail);
                }
                if (payload.event === "predict_fail") {
                    setStatus(payload.detail || "Lỗi", "danger");
                    toggleRing(false);
                    setProgressStatus(payload.detail || "Lỗi");
                }
                if (payload.event === "predict_done") {
                    toggleRing(false);
                    setProgressStatus("Hoàn tất");
                }
            } catch (err) {
                console.warn("Progress stream parse fail", err);
            }
        };
        progressStream.onerror = () => {
            closeProgressStream();
        };
    } catch (err) {
        console.warn("Cannot open progress stream", err);
    }
}

function closeProgressStream() {
    if (progressStream) {
        progressStream.close();
        progressStream = null;
    }
}

function toggleRing(show, text) {
    if (!els.ring) return;
    els.ring.hidden = !show;
    if (text) els.ringText.textContent = text;
}

function toggleScan(show) {
    if (!els.scanLine) return;
    els.scanLine.style.opacity = show ? 1 : 0;
}

function setStatus(text, tone = "soft") {
    els.statusBadge.textContent = text;
    els.statusBadge.className = "pill " + (tone === "danger" ? "pill-danger" : tone === "strong" ? "pill-strong" : "pill-soft");
    if (tone === "danger") {
        els.statusBadge.style.background = "rgba(255,122,162,0.18)";
        els.statusBadge.style.borderColor = "rgba(255,122,162,0.45)";
    } else if (tone === "strong") {
        els.statusBadge.style.background = "rgba(124,242,195,0.18)";
        els.statusBadge.style.borderColor = "rgba(124,242,195,0.45)";
    } else {
        els.statusBadge.style.background = "rgba(255,255,255,0.08)";
        els.statusBadge.style.borderColor = "rgba(255,255,255,0.15)";
    }
}

function setServerStatus(text, tone = "soft") {
    if (!els.serverStatus) return;
    els.serverStatus.textContent = text;
    els.serverStatus.className = "pill " + (tone === "danger" ? "pill-danger" : tone === "strong" ? "pill-strong" : "pill-soft");
}

function renderPreview(file) {
    const url = URL.createObjectURL(file);
    currentImageDataUrl = url;
    els.preview.innerHTML = "";
    els.preview.style.position = "relative";
    const img = document.createElement("img");
    img.src = url;
    els.preview.appendChild(img);
    if (els.heatmapOverlay) {
        els.heatmapOverlay.hidden = true;
        els.heatmapOverlay.src = "";
        els.heatmapOverlay.style.position = "absolute";
        els.heatmapOverlay.style.inset = "0";
        els.heatmapOverlay.style.mixBlendMode = "screen";
        els.heatmapOverlay.style.opacity = "0.65";
        els.heatmapOverlay.style.pointerEvents = "none";
        els.preview.appendChild(els.heatmapOverlay);
    }
}

function renderList(el, arr) {
    el.innerHTML = "";
    if (!arr || arr.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Không có gợi ý.";
        el.appendChild(li);
        return;
    }
    arr.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        el.appendChild(li);
    });
}

async function loadModels() {
    try {
        const statusRes = await fetch(SYSTEM_STATUS_URL);
        if (!statusRes.ok) throw new Error("AI server offline");
        const status = await statusRes.json();
        systemLocked = status?.system === "LOCKED";
        if (systemLocked) {
            setServerStatus("AI server locked", "danger");
            if (els.cropSelect) {
                els.cropSelect.innerHTML = "";
                const opt = document.createElement("option");
                opt.value = "";
                opt.textContent = "Server locked";
                els.cropSelect.appendChild(opt);
                els.cropSelect.disabled = true;
            }
            return;
        }

        const res = await fetch(MODELS_URL);
        if (!res.ok) throw new Error("AI server offline");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Phản hồi không hợp lệ");
        const okModels = data.filter((m) => m.status === "OK");
        if (els.cropSelect) {
            els.cropSelect.innerHTML = "";
            okModels.forEach((m) => {
                const opt = document.createElement("option");
                opt.value = m.name;
                opt.textContent = m.name;
                els.cropSelect.appendChild(opt);
            });
            if (!okModels.length) {
                const opt = document.createElement("option");
                opt.value = "";
                opt.textContent = "Không có model";
                els.cropSelect.appendChild(opt);
            }
        }
        setServerStatus(okModels.length ? "AI server online" : "AI server offline", okModels.length ? "strong" : "danger");
    } catch (err) {
        console.error(err);
        if (els.cropSelect) {
            els.cropSelect.innerHTML = "";
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "Server offline";
            els.cropSelect.appendChild(opt);
        }
        setServerStatus("AI server offline", "danger");
    }
}

function renderValidators(validators = {}, failSafe = false, reason = "") {
    if (!els.validatorList) return;
    els.validatorList.innerHTML = "";
    const entries = Object.entries(validators || {});
    const nameMap = {
        consensus: "Đồng thuận",
        ood: "Ngoài phân bố",
        adversarial: "Nhiễu đối kháng",
        quality: "Chất lượng ảnh",
        calibration: "Hiệu chuẩn",
    };
    if (!entries.length) {
        const li = document.createElement("li");
        li.textContent = "Chưa có kết quả";
        els.validatorList.appendChild(li);
    } else {
        entries.forEach(([k, v]) => {
            const li = document.createElement("li");
            const passed = Boolean(v?.passed);
            li.className = passed ? "validator-pass" : "validator-fail";
            const label = nameMap[k] || k;
            li.innerHTML = `<span>${label}</span><span>${passed ? "OK" : "Chặn"}</span>`;
            li.title = v?.detail || "";
            els.validatorList.appendChild(li);
        });
    }
    if (els.rejectReason) {
        if (failSafe) {
            els.rejectReason.hidden = false;
            els.rejectReason.textContent = reason || "Chụp lại ảnh";
        } else {
            els.rejectReason.hidden = true;
            els.rejectReason.textContent = "";
        }
    }
}

function renderTop3(items = []) {
    if (!els.top3List) return;
    els.top3List.innerHTML = "";
    if (!items.length) {
        const li = document.createElement("li");
        li.textContent = "Chưa có kết quả";
        els.top3List.appendChild(li);
        return;
    }
    items.forEach((it, idx) => {
        const li = document.createElement("li");
        const pct = typeof it.probability === "number" ? (it.probability * 100).toFixed(1) : "-";
        li.innerHTML = `<span>${idx + 1}. ${it.label}</span><span>${pct}%</span>`;
        els.top3List.appendChild(li);
    });
}

function renderHealth(snapshot) {
    if (!snapshot || !els.healthModelList) return;
    const statuses = snapshot.summary || snapshot.statuses || {};
    const modelsOrder = ["vit", "cnn", "densenet", "dsvm", "dknn", "gpu", "memory"];
    els.healthModelList.innerHTML = "";
    modelsOrder.forEach((key) => {
        const li = document.createElement("li");
        const status = statuses[key] || "UNKNOWN";
        const dot = document.createElement("span");
        dot.className = "status-dot " + (status === "OK" ? "dot-ok" : status === "FAIL" ? "dot-fail" : "dot-unknown");
        li.appendChild(dot);
        const label = document.createElement("span");
        label.textContent = key.toUpperCase();
        li.appendChild(label);
        const text = document.createElement("span");
        text.textContent = status;
        li.appendChild(text);
        els.healthModelList.appendChild(li);
    });

    const fps = snapshot.detail?.fps_avg ?? snapshot.fps_avg;
    if (els.fpsFill && typeof fps === "number") {
        const pct = Math.min(100, fps * 5); // scale: 20 fps -> 100%
        els.fpsFill.style.width = `${pct}%`;
        if (els.fpsLabel) els.fpsLabel.textContent = `${fps.toFixed(1)} fps`;
    }

    const mem = snapshot.detail?.memory || snapshot.memory || {};
    if (els.memFill && typeof mem.percent === "number") {
        const pct = Math.min(100, mem.percent);
        els.memFill.style.width = `${pct}%`;
        if (els.memLabel) els.memLabel.textContent = `${mem.percent.toFixed(1)}% • ${(mem.used_mb || 0).toFixed(0)} / ${(mem.avail_mb || 0).toFixed(0)} MB`;
    }
}

function saveHistory(entry) {
    const history = JSON.parse(localStorage.getItem("history") || "[]");
    history.unshift(entry);
    localStorage.setItem("history", JSON.stringify(history.slice(0, 30)));
    renderHistory();
    loadModels();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem("history") || "[]");
    els.historyList.innerHTML = "";
    if (!history.length) {
        const li = document.createElement("li");
        li.textContent = "Chưa có lịch sử.";
        els.historyList.appendChild(li);
        return;
    }
    history.forEach((h) => {
        const li = document.createElement("li");
        li.innerHTML = `<div class="title">${h.disease || h.label}</div><div class="meta">${(h.confidence * 100).toFixed(1)}% • ${new Date(h.time).toLocaleString()}</div>`;
        els.historyList.appendChild(li);
    });
}

function updateUI(res) {
    els.crop.textContent = res.crop || "-";
    els.disease.textContent = res.disease || res.label;
    els.confidence.textContent = typeof res.confidence === "number" ? `${(res.confidence * 100).toFixed(1)}%` : "-";
    els.reliabilityScore.textContent = typeof res.reliability_score === "number" ? `${(res.reliability_score * 100).toFixed(1)}%` : "-";
    els.reliabilityStatus.textContent = res.reliability_label || (res.fail_safe ? "Chụp lại ảnh" : "Đã tự kiểm");
    els.severity.textContent = res.severity || "-";
    setStatus(res.fail_safe ? "Chụp lại ảnh" : res.uncertain ? "Không chắc chắn" : "Đã nhận diện", res.fail_safe || res.uncertain ? "danger" : "strong");
    renderList(els.chem, res.chemical_suggestions);
    renderList(els.treat, res.treatment);
    renderList(els.prev, res.prevention);
    renderValidators(res.validators, res.fail_safe, res.rejection_reason || res.message);
    renderTop3(res.top3 || []);
    if (els.heatmapOverlay) {
        if (res.heatmap_url) {
            els.heatmapOverlay.src = res.heatmap_url;
            els.heatmapOverlay.hidden = false;
        } else {
            els.heatmapOverlay.hidden = true;
            els.heatmapOverlay.src = "";
        }
    }
}

function buildPDFContent(result) {
    return `<html><head><title>Báo cáo</title></head><body style="font-family:Arial;padding:24px;">` +
        `<h2>Báo cáo chẩn đoán</h2>` +
        `<p><strong>Bệnh:</strong> ${result.disease}</p>` +
        `<p><strong>Cây:</strong> ${result.crop || "-"}</p>` +
        `<p><strong>Độ tin cậy:</strong> ${(result.confidence * 100).toFixed(1)}%</p>` +
        `<p><strong>Mức độ:</strong> ${result.severity || "-"}</p>` +
        `<h3>Hóa học</h3><ul>${(result.chemical_suggestions || []).map(i => `<li>${i}</li>`).join("")}</ul>` +
        `<h3>Hữu cơ/Xử lý</h3><ul>${(result.treatment || []).map(i => `<li>${i}</li>`).join("")}</ul>` +
        `<h3>Phòng ngừa</h3><ul>${(result.prevention || []).map(i => `<li>${i}</li>`).join("")}</ul>` +
        `</body></html>`;
}

function downloadPDF(result) {
    if (!result) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(buildPDFContent(result));
    w.document.close();
    w.print();
}

async function shareShot() {
    if (!currentImageDataUrl || !lastResult) return alert("Hãy chẩn đoán trước");
    try {
        const blob = await (await fetch(currentImageDataUrl)).blob();
        const file = new File([blob], "leaf.jpg", { type: blob.type || "image/jpeg" });
        const text = `${lastResult.disease} • ${(lastResult.confidence * 100).toFixed(1)}%`;
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "Chẩn đoán lá", text });
        } else {
            window.open(currentImageDataUrl, "_blank");
        }
    } catch (e) {
        console.error(e);
        alert("Thiếu quyền chia sẻ trên thiết bị này");
    }
}

async function classify(file) {
    if (systemLocked) {
        setStatus("Hệ thống đang khóa", "danger");
        setServerStatus("AI server locked", "danger");
        return;
    }
    setStatus("Đang chẩn đoán...", "soft");
    setProgressStatus("Đang tiền xử lý");
    toggleScan(true);
    toggleRing(true, "Đang tải...");
    setProgress(18);
    openProgressStream();
    const form = new FormData();
    form.append("file", file);
    const cropName = els.cropSelect?.value;
    if (!cropName) {
        setStatus("Chưa chọn cây", "danger");
        setServerStatus("AI server offline", "danger");
        return;
    }
    form.append("crop_name", cropName);
    try {
        const res = await fetch(API_URL, { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
            renderValidators(data?.validators || {}, true, data?.rejection_reason || data?.error || "Lỗi máy chủ");
            throw new Error(data?.detail || data?.error || data?.message || "Lỗi máy chủ");
        }

        const info = data.disease_info || {};
        const raw = data.raw || {};
        const result = {
            label: data.disease_name || raw.label,
            crop: cropName,
            disease: data.disease_name || raw.label_vi || raw.label,
            confidence: data.confidence,
            reliability_score: raw.reliability_score,
            reliability_label: raw.reliability_label,
            calibrated_confidence: raw.calibrated_confidence,
            severity: info.severity || "-",
            treatment: info.treatment || [],
            chemical_suggestions: info.chemical_suggestions || [],
            prevention: info.prevention || [],
            uncertain: raw.uncertain,
            fail_safe: raw.fail_safe,
            validators: raw.validators,
            rejection_reason: raw.rejection_reason,
            message: raw.message,
            top3: raw.top3 || [],
            heatmap_url: raw.heatmap_url,
            model_used: data.model_used,
            processing_time_ms: data.processing_time_ms,
            time: Date.now(),
        };
        lastResult = result;
        updateUI(result);
        if (!result.fail_safe) {
            saveHistory(result);
        }
    } catch (err) {
        console.error(err);
        setStatus(err.message || "Lỗi", "danger");
        setServerStatus("AI server offline", "danger");
    } finally {
        toggleRing(false);
        toggleScan(false);
        closeProgressStream();
        setProgressStatus("Chờ ảnh");
    }
}

function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    renderPreview(file);
    classify(file);
}

async function startCamera() {
    if (!els.liveVideo || !navigator.mediaDevices?.getUserMedia) {
        alert("Thiết bị không hỗ trợ camera");
        return;
    }
    if (cameraStream) {
        stopCamera();
    }
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        els.liveVideo.srcObject = cameraStream;
        els.liveVideo.hidden = false;
        await els.liveVideo.play();
        setStatus("Camera đang bật", "strong");
        if (els.captureBtn) els.captureBtn.hidden = false;
    } catch (err) {
        console.error(err);
        setStatus("Không mở được camera", "danger");
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        cameraStream = null;
    }
    if (els.liveVideo) {
        els.liveVideo.pause();
        els.liveVideo.srcObject = null;
        els.liveVideo.hidden = true;
    }
    if (els.captureBtn) els.captureBtn.hidden = true;
}

async function captureFrame() {
    if (!els.liveVideo || els.liveVideo.readyState < 2) {
        alert("Camera chưa sẵn sàng");
        return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = els.liveVideo.videoWidth;
    canvas.height = els.liveVideo.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(els.liveVideo, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
        renderPreview(file);
        classify(file);
    }, "image/jpeg", 0.92);
}

function setupDragDrop() {
    ["dragenter", "dragover"].forEach((evt) => {
        els.dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); els.dropZone.classList.add("active"); });
    });
    ["dragleave", "drop"].forEach((evt) => {
        els.dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); els.dropZone.classList.remove("active"); });
    });
    els.dropZone.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));
    els.dropZone.addEventListener("click", () => els.fileInput.click());
}

function setupInputs() {
    els.fileInput.addEventListener("change", (e) => handleFiles(e.target.files));
    els.selectBtn.addEventListener("click", () => els.fileInput.click());
    els.historyBtn.addEventListener("click", () => { els.historyCard.hidden = !els.historyCard.hidden; });
    els.clearHistory.addEventListener("click", () => { localStorage.removeItem("history"); renderHistory(); });
    els.shareBtn.addEventListener("click", shareShot);
    els.pdfBtn.addEventListener("click", () => downloadPDF(lastResult));
    if (els.cameraBtn) els.cameraBtn.addEventListener("click", () => {
        if (cameraStream) {
            stopCamera();
            setStatus("Đã tắt camera", "soft");
        } else {
            startCamera();
        }
    });
    if (els.captureBtn) els.captureBtn.addEventListener("click", captureFrame);
}

function setupRipple() {
    document.querySelectorAll('[data-ripple]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            btn.style.setProperty('--rx', `${x}px`);
            btn.style.setProperty('--ry', `${y}px`);
            btn.classList.remove('ripple');
            void btn.offsetWidth;
            btn.classList.add('ripple');
            setTimeout(() => btn.classList.remove('ripple'), 450);
        });
    });
}

function setupParallax() {
    const orbs = document.querySelectorAll('.orb');
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        orbs.forEach((o) => {
            const speed = parseFloat(o.dataset.speed || '1');
            o.style.transform = `translateY(${y * speed * 0.05}px)`;
        });
    });
}

function updateOfflineBadge() {
    if (!els.offlineBadge) return;
    els.offlineBadge.textContent = `Kết nối: ${API_BASE}`;
    els.offlineBadge.style.borderColor = "rgba(124,242,195,0.45)";
}

async function fetchHealth() {
    try {
        const res = await fetch(HEALTH_URL, { method: "GET" });
        const data = await res.json();
        renderHealth({ summary: data.summary || {}, detail: data.detail || {} });
    } catch (e) {
        renderHealth({ summary: { vit: "UNKNOWN", cnn: "UNKNOWN", densenet: "UNKNOWN", dsvm: "UNKNOWN", dknn: "UNKNOWN", gpu: "CPU", memory: "UNKNOWN" } });
    }
}

function initKB() {
    const data = {
        "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
            crop_vi: "Ngô",
            disease_vi: "Đốm lá xám",
            severity: "Nguy hiểm",
            treatment: [
                "Phun Strobilurin/Triazole khi mới xuất hiện vết.",
                "Tăng Kali, giảm đạm, giữ ruộng thoáng.",
                "Theo dõi sau mưa ẩm."
            ],
            chemical_suggestions: ["Azoxystrobin", "Propiconazole"],
            prevention: [
                "Luân canh, giống kháng.",
                "Dọn tàn dư sau thu hoạch.",
                "Gieo mật độ hợp lý."
            ],
        },
        "Corn_(maize)___Common_rust_": {
            crop_vi: "Ngô",
            disease_vi: "Gỉ sắt",
            severity: "Trung bình",
            treatment: [
                "Phun Triazole/Strobilurin khi ổ bệnh lan.",
                "Bón cân đối, tránh ẩm kéo dài.",
                "Theo dõi sau mưa ẩm."
            ],
            chemical_suggestions: ["Tebuconazole", "Azoxystrobin"],
            prevention: [
                "Chọn giống kháng.",
                "Vệ sinh tàn dư.",
                "Kiểm soát mật độ gieo."
            ],
        },
        "Corn_(maize)___Northern_Leaf_Blight": {
            crop_vi: "Ngô",
            disease_vi: "Đốm lá phương bắc",
            severity: "Nguy hiểm",
            treatment: [
                "Phun Strobilurin/Triazole khi mới xuất hiện vết.",
                "Tăng Kali, giảm đạm.",
                "Giữ ruộng thoáng gió."
            ],
            chemical_suggestions: ["Azoxystrobin", "Propiconazole"],
            prevention: [
                "Luân canh, giống kháng.",
                "Dọn tàn dư sau thu hoạch.",
                "Gieo mật độ hợp lý."
            ],
        },
        "Corn_(maize)___healthy": {
            crop_vi: "Ngô",
            disease_vi: "Khỏe mạnh",
            severity: "An toàn",
            treatment: [],
            chemical_suggestions: [],
            prevention: ["Duy trì chăm sóc cân đối, tưới gốc, thoát nước tốt."],
        },
        "Potato___Early_blight": {
            crop_vi: "Khoai tây",
            disease_vi: "Đốm sớm",
            severity: "Nguy hiểm",
            treatment: [
                "Tỉa lá gốc, giữ tán thoáng.",
                "Phun Chlorothalonil/Mancozeb luân phiên.",
                "Bổ sung Kali/Silic."
            ],
            chemical_suggestions: ["Chlorothalonil", "Mancozeb"],
            prevention: [
                "Tưới gốc, không tưới lá.",
                "Luân canh, vệ sinh tàn dư.",
                "Theo dõi sớm giai đoạn lá già."
            ],
        },
        "Potato___Late_blight": {
            crop_vi: "Khoai tây",
            disease_vi: "Mốc sương",
            severity: "Rất nguy hiểm",
            treatment: [
                "Phun Metalaxyl-M + Mancozeb hoặc Cyazofamid.",
                "Nhổ bỏ cây bệnh nặng, tiêu hủy.",
                "Cải thiện thoát nước, tránh ẩm kéo dài."
            ],
            chemical_suggestions: ["Metalaxyl-M", "Mancozeb", "Cyazofamid"],
            prevention: [
                "Luân canh, giống chống chịu.",
                "Phủ rơm hạn chế bắn đất.",
                "Phun phòng trước/ sau mưa kéo dài."
            ],
        },
        "Potato___healthy": {
            crop_vi: "Khoai tây",
            disease_vi: "Khỏe mạnh",
            severity: "An toàn",
            treatment: [],
            chemical_suggestions: [],
            prevention: ["Duy trì tưới gốc, bón cân đối, thoát nước tốt."],
        },
        "Tomato___Bacterial_spot": {
            crop_vi: "Cà chua",
            disease_vi: "Đốm vi khuẩn",
            severity: "Nguy hiểm",
            treatment: [
                "Phun gốc đồng hoặc Streptomycin theo nhãn.",
                "Loại bỏ lá/quả bệnh nặng.",
                "Giảm đạm, tăng Kali."
            ],
            chemical_suggestions: ["Copper oxychloride", "Streptomycin"],
            prevention: [
                "Dùng giống sạch bệnh.",
                "Tưới gốc, thoáng gió.",
                "Khử trùng dụng cụ cắt tỉa."
            ],
        },
        "Tomato___Early_blight": {
            crop_vi: "Cà chua",
            disease_vi: "Đốm sớm",
            severity: "Nguy hiểm",
            treatment: [
                "Cắt bỏ lá già sát gốc, thoáng tán.",
                "Phun Chlorothalonil/Mancozeb luân phiên.",
                "Bón Kali/Silic tăng dày lá."
            ],
            chemical_suggestions: ["Chlorothalonil", "Mancozeb"],
            prevention: [
                "Phủ rơm hạn chế bắn đất.",
                "Tưới gốc, tránh ẩm kéo dài.",
                "Quản lý luân canh."
            ],
        },
        "Tomato___Late_blight": {
            crop_vi: "Cà chua",
            disease_vi: "Mốc sương",
            severity: "Rất nguy hiểm",
            treatment: [
                "Cắt lá gốc ẩm, cải thiện thoát nước.",
                "Phun Metalaxyl-M + Mancozeb hoặc Cyazofamid theo nhãn.",
                "Che mưa, tránh tưới lên tán chiều tối."
            ],
            chemical_suggestions: ["Metalaxyl-M", "Mancozeb", "Cyazofamid"],
            prevention: [
                "Luân canh, dùng giống chống chịu.",
                "Phun phòng trước đợt mưa kéo dài.",
                "Tưới gốc, không phun mù."
            ],
        },
        "Tomato___Leaf_Mold": {
            crop_vi: "Cà chua",
            disease_vi: "Mốc lá",
            severity: "Trung bình",
            treatment: [
                "Tăng thông gió, giảm ẩm nhà màng.",
                "Phun gốc đồng/Chlorothalonil, luân phiên Strobilurin.",
                "Loại bỏ lá già sát đất."
            ],
            chemical_suggestions: ["Copper hydroxide", "Chlorothalonil", "Azoxystrobin"],
            prevention: [
                "Tránh tưới phun mù, ưu tiên nhỏ giọt.",
                "Khoảng cách trồng hợp lý, tỉa tán.",
                "Vệ sinh nhà màng."
            ],
        },
        "Tomato___Septoria_leaf_spot": {
            crop_vi: "Cà chua",
            disease_vi: "Đốm Septoria",
            severity: "Nguy hiểm",
            treatment: [
                "Phun Mancozeb/Chlorothalonil sớm, lặp lại 5-7 ngày nếu ẩm cao.",
                "Dọn lá bệnh rụng, không để ướt kéo dài.",
                "Bón Kali/Silic tăng dày lá."
            ],
            chemical_suggestions: ["Mancozeb", "Chlorothalonil"],
            prevention: [
                "Tưới gốc, hạn chế tưới lên lá.",
                "Luân canh, phủ rơm tránh bắn đất.",
                "Kiểm tra thường xuyên giai đoạn ra hoa."
            ],
        },
        "Tomato___Spider_mites Two-spotted_spider_mite": {
            crop_vi: "Cà chua",
            disease_vi: "Nhện đỏ hai chấm",
            severity: "Trung bình",
            treatment: [
                "Phun Abamectin/Hexythiazox theo nhãn, luân phiên hoạt chất.",
                "Tăng ẩm lá nhẹ, tỉa lá già để giảm ổ trứng.",
                "Theo dõi sau 3-5 ngày."
            ],
            chemical_suggestions: ["Abamectin", "Hexythiazox"],
            prevention: [
                "Giữ vườn thoáng, tránh bụi.",
                "Luân phiên hoạt chất phòng trừ.",
                "Kiểm tra mặt dưới lá định kỳ."
            ],
        },
        "Tomato___Target_Spot": {
            crop_vi: "Cà chua",
            disease_vi: "Đốm bia",
            severity: "Nguy hiểm",
            treatment: [
                "Phun Mancozeb/Chlorothalonil; luân phiên Strobilurin.",
                "Cắt bỏ lá bệnh, giữ tán thoáng.",
                "Bón Kali/Silic."
            ],
            chemical_suggestions: ["Mancozeb", "Chlorothalonil", "Azoxystrobin"],
            prevention: [
                "Tưới gốc, tránh làm ướt lá.",
                "Dọn lá rụng, vệ sinh vườn.",
                "Luân canh vụ."
            ],
        },
        "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
            crop_vi: "Cà chua",
            disease_vi: "Virus xoăn lá vàng",
            severity: "Nguy hiểm",
            treatment: [
                "Nhổ bỏ cây bệnh nặng, tiêu hủy.",
                "Quản lý bọ phấn: bẫy dính vàng + thuốc chọn lọc.",
                "Bón hữu cơ hoai, rong biển, vi lượng hỗ trợ cây nhẹ."
            ],
            chemical_suggestions: ["Thiamethoxam", "Imidacloprid"],
            prevention: [
                "Dùng giống sạch bệnh, xử lý cây con.",
                "Lưới chắn côn trùng giai đoạn đầu.",
                "Vệ sinh dụng cụ."
            ],
        },
        "Tomato___Tomato_mosaic_virus": {
            crop_vi: "Cà chua",
            disease_vi: "Virus khảm",
            severity: "Nguy hiểm",
            treatment: [
                "Nhổ bỏ cây bệnh nặng; khử trùng dụng cụ.",
                "Quản lý rệp/bọ phấn bằng bẫy dính và thuốc chọn lọc.",
                "Bón hữu cơ hoai, rong biển, vi lượng để phục hồi cây nhẹ."
            ],
            chemical_suggestions: ["Dầu khoáng", "Acetamiprid"],
            prevention: [
                "Không chạm cây khỏe sau cây bệnh, rửa tay/dụng cụ.",
                "Lưới chắn côn trùng.",
                "Xử lý hạt/giống sạch."
            ],
        },
        "Tomato___healthy": {
            crop_vi: "Cà chua",
            disease_vi: "Khỏe mạnh",
            severity: "An toàn",
            treatment: [],
            chemical_suggestions: [],
            prevention: ["Duy trì tưới gốc, bón cân đối, tỉa lá gốc già."],
        },
    };
    window.KB = data;
}

function renderPreviewPlaceholder() {
    els.preview.innerHTML = "<p class=\"muted\">Chưa có ảnh</p>";
}

function boot() {
    initKB();
    setupDragDrop();
    setupInputs();
    setupRipple();
    setupParallax();
    updateOfflineBadge();
    window.addEventListener('online', updateOfflineBadge);
    window.addEventListener('offline', updateOfflineBadge);
    renderHistory();
    setStatus("Sẵn sàng", "strong");
    fetchHealth();
    loadModels();
    setInterval(fetchHealth, 15000);
    setInterval(loadModels, 30000);
    window.addEventListener("beforeunload", stopCamera);
}

boot();
