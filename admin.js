// -- Configuration --
const CLOUDINARY_CLOUD_NAME = 'disurt4mx';
const CLOUDINARY_ASSET_PRESET = 'assets';

// -- State --
let currentTab = 'activation';
let allGifts = [];

// -- DOM Elements (Lazy Lookup) --
const getEl = (id) => document.getElementById(id);
const qAll = (sel) => document.querySelectorAll(sel);

// -- Initialization --
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        getEl('admin-login').classList.add('hidden');
        getEl('admin-dashboard').classList.remove('hidden');
        initDashboard();
    } else {
        getEl('admin-login').classList.remove('hidden');
        getEl('admin-dashboard').classList.add('hidden');
    }
});

// -- Login Logic --
getEl('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = getEl('admin-email').value;
    const password = getEl('admin-password').value;
    const btn = getEl('login-form').querySelector('button');
    
    btn.disabled = true;
    btn.textContent = "Verifying...";
    getEl('login-error').classList.add('hidden');
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (err) {
        getEl('login-error').textContent = "Invalid credentials. Access denied.";
        getEl('login-error').classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = "Login to Dashboard";
    }
};

const logoutBtn = getEl('logout-btn');
if (logoutBtn) logoutBtn.onclick = () => firebase.auth().signOut();

// -- Tab Navigation --
function initTabs() {
    const sidebarItems = qAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.onclick = () => {
            const target = item.getAttribute('data-tab');
            switchTab(target);
        };
    });
}

function switchTab(tabId) {
    currentTab = tabId;
    qAll('.sidebar-item').forEach(i => i.classList.toggle('active', i.getAttribute('data-tab') === tabId));
    qAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
    
    // Update Header
    const titles = {
        'activation': 'Activation Management',
        'all-gifts': 'All Gifts Database',
        'assets': 'Asset Hub'
    };
    getEl('view-title').textContent = titles[tabId];
    renderCurrentTab();
}

// -- Dashboard Core --
function initDashboard() {
    getEl('db-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Live Connection';
    
    // Listen to Gifts
    db.collection('gifts').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        allGifts = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        renderCurrentTab();
        updateStats();
    }, err => {
        console.error("Firestore Listen Error:", err);
        if (getEl('db-status')) getEl('db-status').innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Sync Error';
    });

    initTabs();
    initAssetUpload();
}

function updateStats() {
    const pendingCount = allGifts.filter(g => g.status === 'pending').length;
    const statPending = getEl('stat-pending');
    if (statPending) statPending.textContent = pendingCount;
}

const globalSearch = getEl('global-search');
if (globalSearch) globalSearch.oninput = () => renderCurrentTab();

function renderCurrentTab() {
    const searchVal = getEl('global-search')?.value || "";
    const query = searchVal.toLowerCase();
    const filtered = allGifts.filter(g => 
        (g.id || "").toLowerCase().includes(query) || 
        (g.recipientName || "").toLowerCase().includes(query) ||
        (g.senderName || "").toLowerCase().includes(query)
    );

    if (currentTab === 'activation') renderActivation(filtered);
    else if (currentTab === 'all-gifts') renderAllGifts(filtered);
}

// -- Render Functions --
function renderActivation(gifts) {
    const pending = gifts.filter(g => g.status === 'pending');
    const container = getEl('activation-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (pending.length === 0) {
        getEl('no-activation')?.classList.remove('hidden');
        return;
    }
    getEl('no-activation')?.classList.add('hidden');

    pending.forEach(gift => {
        const row = document.createElement('tr');
        row.className = 'border-b border-white/5 hover:bg-white/5 transition-colors group';
        const date = gift.createdAt?.toDate ? gift.createdAt.toDate().toLocaleDateString() : 'N/A';
        const photo = gift.photoUrl || gift.photoURL || 'https://via.placeholder.com/100';

        row.innerHTML = `
            <td class="p-4 font-mono text-brand-blue font-bold">${gift.id}</td>
            <td class="p-4">
                <p class="font-bold text-sm">${gift.recipientName || 'N/A'}</p>
                <p class="text-[10px] text-gray-500 uppercase tracking-tighter">From: ${gift.senderName || 'Anonymous'}</p>
            </td>
            <td class="p-4">
                <div class="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                    <img src="${photo}" class="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" onclick="window.open('${photo}')">
                </div>
            </td>
            <td class="p-4 text-gray-500 text-[10px]">${date}</td>
            <td class="p-4 text-right">
                <label class="switch">
                    <input type="checkbox" onchange="toggleGiftStatus('${gift.docId}', this.checked)" ${gift.status === 'active' ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </td>
        `;
        container.appendChild(row);
    });
}

function renderAllGifts(gifts) {
    const container = getEl('all-gifts-list');
    if (!container) return;
    container.innerHTML = '';
    
    gifts.forEach(gift => {
        const row = document.createElement('tr');
        row.className = 'border-b border-white/5 hover:bg-white/5 transition-colors';
        row.innerHTML = `
            <td class="p-4 font-mono text-[10px] text-gray-500">${gift.id}</td>
            <td class="p-4">
                <p class="font-bold text-sm">${gift.recipientName || 'N/A'}</p>
                <p class="text-[10px] text-gray-500">From: ${gift.senderName || 'Anonymous'}</p>
            </td>
            <td class="p-4">
                <span class="px-2 py-1 rounded bg-white/5 text-[10px] uppercase font-bold text-gray-400 border border-white/5">${gift.occasion || 'General'}</span>
            </td>
            <td class="p-4 text-right">
                <label class="switch scale-75 origin-right">
                    <input type="checkbox" onchange="toggleGiftStatus('${gift.docId}', this.checked)" ${gift.status === 'active' ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </td>
        `;
        container.appendChild(row);
    });
}

// -- Actions --
async function toggleGiftStatus(docId, isActive) {
    const status = isActive ? 'active' : 'pending';
    try {
        await db.collection('gifts').doc(docId).update({ status });
        showToast(`Status updated to ${status.toUpperCase()}`);
    } catch (err) {
        console.error("Status Update Failed:", err);
        showToast("Error updating status", "error");
    }
}

// -- Asset Hub Logic --
function initAssetUpload() {
    const dropZone = getEl('drop-zone');
    const assetInput = getEl('asset-input');
    if (!dropZone || !assetInput) return;

    dropZone.onclick = () => assetInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('bg-brand-blue/5', 'border-brand-blue/30'); };
    dropZone.ondragleave = () => dropZone.classList.remove('bg-brand-blue/5', 'border-brand-blue/30');
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('bg-brand-blue/5', 'border-brand-blue/30');
        handleAssetFiles(e.dataTransfer.files);
    };
    assetInput.onchange = (e) => handleAssetFiles(e.target.files);
}

async function handleAssetFiles(files) {
    for (const file of files) {
        await processAndUploadAsset(file);
    }
}

async function processAndUploadAsset(file) {
    const container = getEl('upload-status-container');
    if (!container) return;

    const statusEl = document.createElement('div');
    statusEl.className = 'glass-card p-3 rounded-xl flex items-center justify-between border-white/10 animate-pulse bg-white/5';
    statusEl.innerHTML = `<span class="text-xs truncate w-32">${file.name}</span><span class="text-[10px] text-brand-blue font-bold">OPTIMIZING...</span>`;
    container.appendChild(statusEl);

    try {
        const compressed = await compressAsset(file);
        const url = await uploadToCloudinary(compressed);
        statusEl.remove();
        addAssetToGallery(file.name, url);
        showToast("Asset uploaded!");
    } catch (err) {
        statusEl.innerHTML = `<span class="text-red-500 text-[10px]">FAILED: ${err.message}</span>`;
        setTimeout(() => statusEl.remove(), 4000);
    }
}

function addAssetToGallery(name, url) {
    const gallery = getEl('assets-gallery');
    if (!gallery) return;

    const card = document.createElement('div');
    card.className = 'admin-glass p-2 rounded-xl group relative overflow-hidden transition-all hover:border-brand-blue/30';
    card.innerHTML = `
        <img src="${url}" class="w-full aspect-video object-cover rounded-lg mb-2">
        <div class="flex items-center justify-between px-1">
            <span class="text-[9px] text-gray-500 truncate w-24">${name}</span>
            <button onclick="copyToClipboard('${url}')" class="text-brand-blue hover:text-white transition-colors">
                <i class="ph ph-copy"></i>
            </button>
        </div>
    `;
    gallery.prepend(card);
}

// -- Helpers --
async function compressAsset(file) {
    const MAX_WIDTH = 1920;
    const img = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => { const i = new Image(); i.onload = () => res(i); i.src = e.target.result; };
        r.readAsDataURL(file);
    });
    let w = img.width; let h = img.height;
    if (w > MAX_WIDTH) { h = Math.round((h * MAX_WIDTH) / w); w = MAX_WIDTH; }
    const cvs = document.createElement('canvas');
    cvs.width = w; cvs.height = h;
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return cvs.toDataURL('image/webp', 0.85);
}

async function uploadToCloudinary(base64) {
    const formData = new FormData();
    formData.append('file', base64);
    formData.append('upload_preset', CLOUDINARY_ASSET_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    return data.secure_url;
}

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("URL Copied!");
};

function showToast(msg, type = "success") {
    const toast = getEl('toast');
    const toastMsg = getEl('toast-message');
    if (!toast || !toastMsg) return;
    toastMsg.innerHTML = `<i class="ph ${type === 'error' ? 'ph-x-circle text-red-400' : 'ph-check-circle text-green-400'} text-lg"></i> ${msg}`;
    toast.classList.remove('opacity-0', 'translate-y-10');
    setTimeout(() => toast.classList.add('opacity-0', 'translate-y-10'), 3000);
}

