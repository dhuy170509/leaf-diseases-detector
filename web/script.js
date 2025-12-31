const statusEl = document.getElementById('status');
const fileInput = document.getElementById('fileInput');
const drop = document.getElementById('drop');
const preview = document.getElementById('preview');
const previewContainer = document.getElementById('previewContainer');
const predictBtn = document.getElementById('predictBtn');
const btnLabel = document.getElementById('btnLabel');
const resultsEl = document.getElementById('results');
const resetBtn = document.getElementById('resetBtn');
const btnPulse = document.getElementById('btnPulse');
const navMenu = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');
const navLinkEls = document.querySelectorAll('.nav-link[data-target]');
const navTargets = Array.from(navLinkEls).map(el => el.dataset.target);
const sections = Array.from(document.querySelectorAll('section[id]'));
const scrollTriggers = document.querySelectorAll('[data-target]');

let file = null;
let modelsLoaded = false;

function setStatus(message, isError = false) {
    statusEl.textContent = message;
    if (isError) {
        statusEl.classList.add('error');
    } else {
        statusEl.classList.remove('error');
    }
}

function smoothScrollTo(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
}

function setActiveNav() {
    if (!sections.length || !navTargets.length) return;
    const scrollPos = window.scrollY + 120;
    let current = navTargets[0];

    sections.forEach(section => {
        if (scrollPos >= section.offsetTop && navTargets.includes(section.id)) {
            current = section.id;
        }
    });

    navLinkEls.forEach(link => {
        if (link.dataset.target === current) link.classList.add('active');
        else link.classList.remove('active');
    });
}

function setupNav() {
    scrollTriggers.forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            const target = el.dataset.target;
            if (target) smoothScrollTo(target);
            if (navMenu) navMenu.classList.remove('open');
        });
    });

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    window.addEventListener('scroll', setActiveNav);
    setActiveNav();
}

async function checkHealth() {
    try {
        const res = await fetch('/health');
        const data = await res.json();
        if (data.status === 'CHƯA CÓ CƠ SỞ DỮ LIỆU') {
            setStatus('⚠️ CHƯA CÓ CƠ SỞ DỮ LIỆU', true);
            modelsLoaded = false;
            predictBtn.disabled = true;
            resultsEl.innerHTML = `
        <div class="error-box">
          <div style="font-size: 32px;">⚠️</div>
          <div>CHƯA CÓ CƠ SỞ DỮ LIỆU</div>
          <div style="color: #ffc8c8; font-size: 12px; margin-top: 6px;">Place models in D:/huy/leaf-disease-detector-1</div>
        </div>
      `;
            return;
        }
        modelsLoaded = true;
        const count = data.models?.length || 0;
        setStatus(`✅ ${count} model${count === 1 ? '' : 's'} active`);
        predictBtn.disabled = !file;
    } catch (err) {
        setStatus('🔴 Service offline', true);
        predictBtn.disabled = true;
    }
}

function resetUI() {
    file = null;
    fileInput.value = '';
    preview.src = '';
    previewContainer.style.display = 'none';
    resultsEl.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🪴</div>
      <p>Upload a leaf to see predictions.</p>
    </div>
  `;
    predictBtn.disabled = !modelsLoaded;
    btnLabel.textContent = 'Analyze Leaf';
    btnPulse.style.display = 'inline-block';
}

function setPreview(selected) {
    const reader = new FileReader();
    reader.onload = e => {
        preview.src = e.target.result;
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(selected);
}

function handleDropState(over) {
    if (over) drop.classList.add('drag-over');
    else drop.classList.remove('drag-over');
}

function attachInputs() {
    drop.addEventListener('click', () => fileInput.click());

    drop.addEventListener('dragover', e => {
        e.preventDefault();
        handleDropState(true);
    });

    drop.addEventListener('dragleave', () => handleDropState(false));

    drop.addEventListener('drop', e => {
        e.preventDefault();
        handleDropState(false);
        if (!e.dataTransfer.files.length) return;
        file = e.dataTransfer.files[0];
        setPreview(file);
        predictBtn.disabled = !modelsLoaded;
    });

    fileInput.addEventListener('change', e => {
        if (!e.target.files.length) return;
        file = e.target.files[0];
        setPreview(file);
        predictBtn.disabled = !modelsLoaded;
    });

    resetBtn.addEventListener('click', resetUI);
}

async function doPredict() {
    if (!file || !modelsLoaded) return;

    predictBtn.disabled = true;
    btnLabel.textContent = 'Analyzing...';
    btnPulse.style.display = 'inline-block';

    resultsEl.innerHTML = `
    <div class="placeholder">
      <div class="loading" style="margin: 0 auto 12px;"></div>
      <p>Processing image...</p>
    </div>
  `;

    const form = new FormData();
    form.append('file', file);

    try {
        const res = await fetch('/predict', { method: 'POST', body: form });
        const data = await res.json();

        if (data.status === 'CHƯA CÓ CƠ SỞ DỮ LIỆU') {
            resultsEl.innerHTML = `
        <div class="error-box">
          <div style="font-size: 32px;">⚠️</div>
          <div>CHƯA CÓ CƠ SỞ DỮ LIỆU</div>
          <div style="color: #ffc8c8; font-size: 12px; margin-top: 6px;">No models loaded</div>
        </div>
      `;
            setStatus('⚠️ CHƯA CÓ CƠ SỞ DỮ LIỆU', true);
            return;
        }

        const p = data.predictions && data.predictions[0];
        if (!p) {
            resultsEl.innerHTML = `
        <div class="error-box">
          <div style="font-size: 32px;">❌</div>
          <div>No prediction returned</div>
        </div>
      `;
            return;
        }

        const confidence = Number((p.confidence * 100).toFixed(2));
        const width = Math.min(100, Math.max(0, confidence));

        resultsEl.innerHTML = `
      <div class="result-item">
        <div class="label-row">
          <span class="label-chip">Top-1</span>
          <span>${p.label}</span>
        </div>
        <div class="confidence">Confidence: ${confidence}%</div>
        <div class="bar"><div class="bar-fill" style="width:${width}%;"></div></div>
        <div class="models-used">Models used: ${p.models_used.join(', ')}</div>
      </div>
    `;
    } catch (err) {
        resultsEl.innerHTML = `
      <div class="error-box">
        <div style="font-size: 32px;">⚠️</div>
        <div>Request failed</div>
        <div style="color: #ffc8c8; font-size: 12px;">${err.message}</div>
      </div>
    `;
    } finally {
        btnLabel.textContent = 'Analyze Leaf';
        btnPulse.style.display = 'inline-block';
        predictBtn.disabled = !modelsLoaded;
    }
}

function init() {
    attachInputs();
    setupNav();
    resetUI();
    checkHealth();
    predictBtn.addEventListener('click', doPredict);
    setInterval(checkHealth, 30000);
}

init();
