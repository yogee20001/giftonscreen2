// -- Configuration --
const CLOUDINARY_CLOUD_NAME = 'disurt4mx';
const CLOUDINARY_ASSET_PRESET = 'assets';

// -- State --
let currentTab = 'activation';
let allGifts = [];

// -- DOM Elements --
const loginOverlay = document.getElementById('admin-login');
const dashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const dbStatus = document.getElementById('db-status');
const viewTitle = document.getElementById('view-title');
const globalSearch = document.getElementById('global-search');

// Tabs
const sidebarItems = document.querySelectorAll('.sidebar-item');
const tabContents = document.querySelectorAll('.tab-content');

// Lists
const activationList = document.getElementById('activation-list');
const allGiftsList = document.getElementById('all-gifts-list');
const assetsGallery = document.getElementById('assets-gallery');
const noActivation = document.getElementById('no-activation');

// Assets
const dropZone = document.getElementById('drop-zone');
const assetInput = document.getElementById('asset-input');
const uploadStatusContainer = document.getElementById('upload-status-container');

// -- Initialization --
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loginOverlay.classList.add('hidden');
        dashboard.classList.remove('hidden');
        initDashboard();
    } else {
        loginOverlay.classList.remove('hidden');
        dashboard.classList.add('hidden');
    }
});

// -- Login Logic --
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const btn = loginForm.querySelector('button');
    
    btn.disabled = true;
    btn.textContent = "Verifying...";
    loginError.classList.add('hidden');
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (err) {
        loginError.textContent = "Invalid credentials. Access denied.";
        loginError.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = "Login to Dashboard";
    }
};

if (logoutBtn) logoutBtn.onclick = () => firebase.auth().signOut();

// -- Tab Navigation --
sidebarItems.forEach(item => {
    item.onclick = () => {
        const target = item.getAttribute('data-tab');
        switchTab(target);
    };
});

function switchTab(tabId) {
    currentTab = tabId;
    sidebarItems.forEach(i => i.classList.toggle('active', i.getAttribute('data-tab') === tabId));
    tabContents.forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
    
    // Update Header
    const titles = {
        'activation': 'Activation Management',
        'all-gifts': 'All Gifts Database',
        'assets': 'Asset Hub'
    };
    viewTitle.textContent = titles[tabId];
    renderCurrentTab();
}

// -- Dashboard Core --
function initDashboard() {
    dbStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Live Connection';
    
    // Listen to Gifts
    db.collection('gifts').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        allGifts = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        renderCurrentTab();
        updateStats();
    }, err => {
        console.error("Firestore Listen Error:", err);
        dbStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Sync Error';
    });

    initAssetUpload();
}

function updateStats() {
    const pendingCount = allGifts.filter(g => g.status === 'pending').length;
    const statPending = document.getElementById('stat-pending');
    if (statPending) statPending.textContent = pendingCount;
}

globalSearch.oninput = () => renderCurrentTab();

function renderCurrentTab() {
    const query = globalSearch.value.toLowerCase();
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
    activationList.innerHTML = '';
    
    if (pending.length === 0) {
        noActivation.classList.remove('hidden');
        return;
    }
    noActivation.classList.add('hidden');

    pending.forEach(gift => {
        const row = document.createElement('tr');
        row.className = 'border-b border-white/5 hover:bg-white/5 transition-colors group';
        const date = gift.createdAt?.toDate ? gift.createdAt.toDate().toLocaleDateString() : 'N/A';
        const photo = gift.photoUrl || gift.photoURL || 'https://via.placeholder.com/100';

        row.innerHTML = `
            <td class="p-4 font-mono text-brand-blue font-bold">${gift.id}</td>
            <td class="p-4">
                <p class="font-bold">${gift.recipientName || 'N/A'}</p>
                <p class="text-[10px] text-gray-500">From: ${gift.senderName || 'Anonymous'}</p>
            </td>
            <td class="p-4">
                <img src="${photo}" class="w-10 h-10 rounded-lg object-cover border border-white/10 cursor-pointer" onclick="window.open('${photo}')">
            </td>
            <td class="p-4 text-gray-500 text-xs">${date}</td>
            <td class="p-4 text-right">
                <label class="switch">
                    <input type="checkbox" onchange="toggleGiftStatus('${gift.docId}', this.checked)" ${gift.status === 'active' ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </td>
        `;
        activationList.appendChild(row);
    });
}

function renderAllGifts(gifts) {
    allGiftsList.innerHTML = '';
    gifts.forEach(gift => {
        const row = document.createElement('tr');
        row.className = 'border-b border-white/5 hover:bg-white/5 transition-colors';
        row.innerHTML = `
            <td class="p-4 font-mono text-xs text-gray-400">${gift.id}</td>
            <td class="p-4">
                <p class="font-bold">${gift.recipientName || 'N/A'}</p>
                <p class="text-[10px] text-gray-500">From: ${gift.senderName || 'Anonymous'}</p>
            </td>
            <td class="p-4">
                <span class="px-2 py-1 rounded bg-white/5 text-[10px] uppercase font-bold text-gray-400">${gift.occasion || 'General'}</span>
            </td>
            <td class="p-4 text-right">
                <label class="switch scale-75 origin-right">
                    <input type="checkbox" onchange="toggleGiftStatus('${gift.docId}', this.checked)" ${gift.status === 'active' ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </td>
        `;
        allGiftsList.appendChild(row);
    });
}

// -- Actions --
async function toggleGiftStatus(docId, isActive) {
    const status = isActive ? 'active' : 'pending';
    try {
        await db.collection('gifts').doc(docId).update({ status });
        showToast(`Gift ID updated to ${status.toUpperCase()}`);
    } catch (err) {
        console.error("Status Update Failed:", err);
        showToast("Error updating status", "error");
    }
}

// -- Asset Hub Logic --
function initAssetUpload() {
    if (!dropZone) return;
    dropZone.onclick = () => assetInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('bg-white/10'); };
    dropZone.ondragleave = () => dropZone.classList.remove('bg-white/10');
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('bg-white/10');
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
    const statusEl = document.createElement('div');
    statusEl.className = 'glass-card p-3 rounded-xl flex items-center justify-between border-white/10 animate-pulse bg-white/5';
    statusEl.innerHTML = `<span class="text-xs truncate w-32">${file.name}</span><span class="text-[10px] text-brand-blue font-bold">OPTIMIZING...</span>`;
    uploadStatusContainer.appendChild(statusEl);

    try {
        const compressed = await compressAsset(file);
        const url = await uploadToCloudinary(compressed);
        statusEl.remove();
        addAssetToGallery(file.name, url);
        showToast("Asset ready!");
    } catch (err) {
        statusEl.innerHTML = `<span class="text-red-500 text-[10px]">FAILED: ${err.message}</span>`;
        setTimeout(() => statusEl.remove(), 4000);
    }
}

function addAssetToGallery(name, url) {
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
    assetsGallery.prepend(card);
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
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    toastMsg.innerHTML = `<i class="ph ${type === 'error' ? 'ph-x-circle text-red-400' : 'ph-check-circle text-green-400'} text-lg"></i> ${msg}`;
    toast.classList.remove('opacity-0', 'translate-y-10');
    setTimeout(() => toast.classList.add('opacity-0', 'translate-y-10'), 3000);
}

