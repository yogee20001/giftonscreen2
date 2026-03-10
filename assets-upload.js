// -- Configuration --
const CLOUDINARY_CLOUD_NAME = 'disurt4mx';
const CLOUDINARY_UPLOAD_PRESET = 'assets'; // Specifically for template assets

// -- DOM Elements --
const dropZone = document.getElementById('drop-zone');
const assetInput = document.getElementById('asset-input');
const statusContainer = document.getElementById('upload-status-container');
const gallery = document.getElementById('assets-gallery');
const noAssets = document.getElementById('no-assets');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');

// -- Drag & Drop Logic --
dropZone.onclick = () => assetInput.click();

dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
};

dropZone.ondragleave = () => {
    dropZone.classList.remove('drag-over');
};

dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
};

assetInput.onchange = (e) => {
    handleFiles(e.target.files);
};

async function handleFiles(files) {
    if (files.length === 0) return;
    
    noAssets.classList.add('hidden');
    
    for (const file of files) {
        await processAndUpload(file);
    }
}

async function processAndUpload(file) {
    const fileId = 'up-' + Math.random().toString(36).substr(2, 6);
    
    // Create status UI
    const statusEl = document.createElement('div');
    statusEl.id = fileId;
    statusEl.className = 'glass-card p-4 rounded-xl flex items-center justify-between border-white/5 animate-pulse';
    statusEl.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <i class="ph ph-file-image text-gray-400"></i>
            </div>
            <div>
                <p class="text-sm font-bold truncate max-w-[150px]">${file.name}</p>
                <p class="text-[10px] text-gray-500 status-text">Preparing...</p>
            </div>
        </div>
        <div class="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div class="progress-bar h-full bg-brand-blue w-0 transition-all duration-300"></div>
        </div>
    `;
    statusContainer.appendChild(statusEl);

    const updateStatus = (text, progress) => {
        statusEl.querySelector('.status-text').textContent = text;
        statusEl.querySelector('.progress-bar').style.width = progress + '%';
    };

    try {
        // 1. Compression
        updateStatus("Compressing...", 30);
        const compressedBase64 = await compressImage(file, 800); // Higher limit for assets (800KB)
        
        // 2. Upload
        updateStatus("Uploading to Cloudinary...", 60);
        const url = await uploadToCloudinary(compressedBase64);
        
        // 3. Success
        updateStatus("Complete!", 100);
        statusEl.classList.remove('animate-pulse');
        statusEl.classList.add('border-green-500/30', 'bg-green-500/5');
        
        addToGallery(file.name, url);
        
        // Remove status after delay
        setTimeout(() => {
            statusEl.style.opacity = '0';
            setTimeout(() => statusEl.remove(), 500);
        }, 3000);

    } catch (err) {
        console.error("Upload Error:", err);
        updateStatus("Error: " + err.message, 0);
        statusEl.classList.remove('animate-pulse');
        statusEl.classList.add('border-red-500/30', 'bg-red-500/5');
        statusEl.querySelector('.progress-bar').classList.replace('bg-brand-blue', 'bg-red-500');
    }
}

function addToGallery(name, url) {
    const card = document.createElement('div');
    card.className = 'glass-card p-4 rounded-2xl flex flex-col gap-4 group transition-all hover:border-brand-blue/30';
    card.innerHTML = `
        <div class="aspect-video rounded-xl bg-black overflow-hidden relative">
            <img src="${url}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                <p class="text-[10px] text-gray-300 truncate">${name}</p>
            </div>
        </div>
        <div class="flex gap-2">
            <input type="text" readonly value="${url}" class="bg-black/40 border border-white/5 text-[10px] p-2 rounded-lg flex-1 font-mono text-brand-blue truncate">
            <button class="bg-brand-blue text-white p-2 rounded-lg hover:bg-blue-600 transition-colors" onclick="copyToClipboard('${url}')">
                <i class="ph ph-copy text-sm"></i>
            </button>
        </div>
    `;
    gallery.prepend(card);
}

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("URL Copied to Clipboard");
};

function showToast(msg) {
    toastMsg.innerHTML = `<i class="ph ph-check-circle text-green-400 text-lg"></i> ${msg}`;
    toast.classList.remove('opacity-0', 'translate-y-10');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-10');
    }, 3000);
}

document.getElementById('clear-gallery').onclick = () => {
    gallery.innerHTML = '';
    noAssets.classList.remove('hidden');
};

// -- Reused Premium Compression Logic --
async function compressImage(file, maxSizeKB) {
    const MAX_WIDTH = 1920; // Allow 1080p for assets (backgrounds need higher res)
    const targetSize = maxSizeKB * 1024;
    const img = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    let w = img.width;
    let h = img.height;
    if (w > MAX_WIDTH) { h = Math.round((h * MAX_WIDTH) / w); w = MAX_WIDTH; }

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    let quality = 0.95; // Start very high for assets
    let format = 'image/webp';
    const isWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    if (!isWebP) format = 'image/jpeg';

    for (let i = 0; i < 6; i++) {
        const base64 = canvas.toDataURL(format, quality);
        const size = Math.round((base64.length * 3) / 4);
        if (size <= targetSize) return base64;
        quality -= 0.1;
        if (quality < 0.4) return base64;
    }
    return canvas.toDataURL(format, quality);
}

async function uploadToCloudinary(base64Data) {
    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Cloudinary Upload Failed");
    }
    const data = await response.json();
    return data.secure_url;
}
