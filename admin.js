// -- Configuration --
const CLOUDINARY_CLOUD_NAME = 'disurt4mx';
const CLOUDINARY_ASSET_PRESET = 'assets';
const BASE_URL = window.location.origin + '/';

// -- State --
let currentTab = 'dashboard';
let allGifts = [];
let selectedGift = null;

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
        if (item.tagName === 'BUTTON') {
            item.onclick = () => {
                const target = item.getAttribute('data-tab');
                switchTab(target);
            };
        }
    });
}

function switchTab(tabId) {
    currentTab = tabId;
    qAll('.sidebar-item').forEach(i => {
        if (i.tagName === 'BUTTON') {
            i.classList.toggle('active', i.getAttribute('data-tab') === tabId);
        }
    });
    qAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));

    // Update Header
    const titles = {
        'dashboard': 'Dashboard Overview',
        'activation': 'Activation Management',
        'all-gifts': 'All Gifts Database',
        'assets': 'Asset Hub'
    };
    getEl('view-title').textContent = titles[tabId] || 'Dashboard';
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
    initFilters();
    initExport();
}

// -- Stats with Animated Counters --
function updateStats() {
    const total = allGifts.length;
    const pending = allGifts.filter(g => g.status === 'pending').length;
    const active = allGifts.filter(g => g.status === 'active').length;

    // Today's gifts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = allGifts.filter(g => {
        if (!g.createdAt) return false;
        const created = g.createdAt.toDate ? g.createdAt.toDate() : new Date(g.createdAt);
        return created >= today;
    }).length;

    // Update stat cards with animation
    animateCounter('stat-total', total);
    animateCounter('stat-pending', pending);
    animateCounter('stat-active', active);
    animateCounter('stat-today', todayCount);
}

function animateCounter(id, target) {
    const el = getEl(id);
    if (!el) return;

    const current = parseInt(el.textContent) || 0;
    const duration = 500;
    const steps = 20;
    const increment = (target - current) / steps;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        el.textContent = Math.round(current + (increment * step));
        if (step >= steps) {
            clearInterval(timer);
            el.textContent = target;
        }
    }, duration / steps);
}

// -- Filters --
function initFilters() {
    const filterStatus = getEl('filter-status');
    const filterTemplate = getEl('filter-template');
    const filterOccasion = getEl('filter-occasion');
    const clearFilters = getEl('clear-filters');

    if (filterStatus) filterStatus.onchange = () => renderCurrentTab();
    if (filterTemplate) filterTemplate.onchange = () => renderCurrentTab();
    if (filterOccasion) filterOccasion.onchange = () => renderCurrentTab();
    if (clearFilters) {
        clearFilters.onclick = () => {
            if (filterStatus) filterStatus.value = '';
            if (filterTemplate) filterTemplate.value = '';
            if (filterOccasion) filterOccasion.value = '';
            if (getEl('global-search')) getEl('global-search').value = '';
            renderCurrentTab();
        };
    }
}

function getFilteredGifts() {
    const searchVal = getEl('global-search')?.value || '';
    const statusFilter = getEl('filter-status')?.value || '';
    const templateFilter = getEl('filter-template')?.value || '';
    const occasionFilter = getEl('filter-occasion')?.value || '';

    const query = searchVal.toLowerCase();

    return allGifts.filter(g => {
        const matchSearch = !query ||
            (g.id || '').toLowerCase().includes(query) ||
            (g.receiver || '').toLowerCase().includes(query) ||
            (g.sender || '').toLowerCase().includes(query);

        const matchStatus = !statusFilter || g.status === statusFilter;
        const matchTemplate = !templateFilter || (g.template || '').toLowerCase().includes(templateFilter);
        const matchOccasion = !occasionFilter || (g.occasionId || '').toLowerCase().includes(occasionFilter);

        return matchSearch && matchStatus && matchTemplate && matchOccasion;
    });
}

// -- Export CSV --
function initExport() {
    const exportBtn = getEl('export-csv');
    if (exportBtn) {
        exportBtn.onclick = exportToCSV;
    }
}

function exportToCSV() {
    const gifts = getFilteredGifts();
    if (gifts.length === 0) {
        showToast('No gifts to export', 'error');
        return;
    }

    const headers = ['Gift ID', 'Receiver', 'Sender', 'Template', 'Occasion', 'Status', 'Created'];
    const rows = gifts.map(g => {
        let date = 'N/A';
        if (g.createdAt) {
            const d = g.createdAt.toDate ? g.createdAt.toDate() : new Date(g.createdAt);
            date = d.toLocaleDateString('en-IN');
        }
        return [
            g.id || '',
            g.receiver || '',
            g.sender || '',
            g.template || '',
            g.occasionId || '',
            g.status || '',
            date
        ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gifts_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully!');
}

// -- Search --
const globalSearch = getEl('global-search');
if (globalSearch) globalSearch.oninput = () => renderCurrentTab();

function renderCurrentTab() {
    const filtered = getFilteredGifts();

    if (currentTab === 'dashboard') renderDashboard(filtered);
    else if (currentTab === 'activation') renderActivation(filtered);
    else if (currentTab === 'all-gifts') renderAllGifts(filtered);
}

// -- Dashboard Render --
function renderDashboard(gifts) {
    const container = getEl('dashboard-gifts-list');
    if (!container) return;

    container.innerHTML = '';

    if (gifts.length === 0) {
        getEl('no-gifts')?.classList.remove('hidden');
        return;
    }
    getEl('no-gifts')?.classList.add('hidden');

    gifts.forEach(gift => {
        const row = document.createElement('tr');
        row.className = 'border-b border-white/5 hover:bg-white/5 transition-colors group';

        let date = 'N/A';
        if (gift.createdAt) {
            const d = gift.createdAt.toDate ? gift.createdAt.toDate() : new Date(gift.createdAt);
            date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        const photo = gift.photoUrl || gift.photoURL || '';
        const statusBadge = gift.status === 'active'
            ? `<span class="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">ACTIVE</span>`
            : `<span class="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold border border-yellow-500/20">PENDING</span>`;

        row.innerHTML = `
            <td class="p-4 font-mono text-brand-blue font-bold text-xs">${gift.id || 'N/A'}</td>
            <td class="p-4">
                <p class="font-bold text-sm">${gift.receiver || gift.recipientName || 'N/A'}</p>
            </td>
            <td class="p-4 text-sm text-gray-400">${gift.sender || gift.senderName || 'Anonymous'}</td>
            <td class="p-4 text-xs text-gray-400">${gift.template || '—'}</td>
            <td class="p-4 text-xs text-gray-400">${gift.occasionId || '—'}</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-gray-500 text-[10px]">${date}</td>
            <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="viewGiftDetails('${gift.docId}')" class="text-brand-blue hover:text-white p-2 rounded-lg hover:bg-brand-blue/10 transition-colors" title="View Details">
                        <i class="ph ph-eye text-lg"></i>
                    </button>
                    ${gift.status !== 'active' ? `
                    <button onclick="confirmActivate('${gift.docId}')" class="text-green-400 hover:text-white p-2 rounded-lg hover:bg-green-500/10 transition-colors" title="Activate">
                        <i class="ph ph-check-circle text-lg"></i>
                    </button>
                    ` : ''}
                    <button onclick="confirmDelete('${gift.docId}', '${gift.receiver || 'this gift'}')" class="text-red-400 hover:text-white p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
                        <i class="ph ph-trash text-lg"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}

// -- Activation Tab Render --
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

        let date = 'N/A';
        if (gift.createdAt) {
            const d = gift.createdAt.toDate ? gift.createdAt.toDate() : new Date(gift.createdAt);
            date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        const photo = gift.photoUrl || gift.photoURL || '';

        row.innerHTML = `
            <td class="p-4 font-mono text-brand-blue font-bold text-xs">${gift.id || 'N/A'}</td>
            <td class="p-4">
                <p class="font-bold text-sm">${gift.receiver || gift.recipientName || 'N/A'}</p>
                <p class="text-[10px] text-gray-500 uppercase tracking-tighter">From: ${gift.sender || gift.senderName || 'Anonymous'}</p>
            </td>
            <td class="p-4 text-xs text-gray-400">${gift.template || gift.occasionId || '—'}</td>
            <td class="p-4">
                ${photo ? `<div class="w-10 h-10 rounded-lg overflow-hidden border border-white/10 cursor-pointer" onclick="showPhotoPreview('${photo}')">
                    <img src="${photo}" class="w-full h-full object-cover hover:scale-110 transition-transform">
                </div>` : '<span class="text-[10px] text-gray-600">No photo</span>'}
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

// -- All Gifts Tab Render --
function renderAllGifts(gifts) {
    const container = getEl('all-gifts-list');
    if (!container) return;
    container.innerHTML = '';

    if (gifts.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-600 text-sm">No gifts found.</td></tr>`;
        return;
    }

    gifts.forEach(gift => {
        const row = document.createElement('tr');
        row.className = 'border-b border-white/5 hover:bg-white/5 transition-colors';

        let date = 'N/A';
        if (gift.createdAt) {
            const d = gift.createdAt.toDate ? gift.createdAt.toDate() : new Date(gift.createdAt);
            date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        const photo = gift.photoUrl || gift.photoURL || '';
        const statusBadge = gift.status === 'active'
            ? `<span class="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">ACTIVE</span>`
            : `<span class="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold border border-yellow-500/20">PENDING</span>`;

        row.innerHTML = `
            <td class="p-4 font-mono text-[10px] text-brand-blue font-semibold">${gift.id || 'N/A'}</td>
            <td class="p-4">
                <p class="font-bold text-sm">${gift.receiver || gift.recipientName || 'N/A'}</p>
                <p class="text-[10px] text-gray-500">From: ${gift.sender || gift.senderName || 'Anonymous'}</p>
            </td>
            <td class="p-4">
                <div>
                    <span class="px-2 py-1 rounded bg-white/5 text-[10px] uppercase font-bold text-gray-400 border border-white/5">${gift.template || '—'}</span>
                    <p class="text-[10px] text-gray-600 mt-1">${gift.occasionId || ''}</p>
                </div>
            </td>
            <td class="p-4">
                ${photo ? `<img src="${photo}" class="w-8 h-8 rounded-lg object-cover border border-white/10 cursor-pointer" onclick="showPhotoPreview('${photo}')" title="View photo">` : '<span class="text-[10px] text-gray-600">—</span>'}
            </td>
            <td class="p-4 text-gray-500 text-[10px]">${date}</td>
            <td class="p-4">${statusBadge}</td>
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

// -- Gift Details Modal --
window.viewGiftDetails = function (docId) {
    const gift = allGifts.find(g => g.docId === docId);
    if (!gift) return;

    selectedGift = gift;

    // Set basic info
    getEl('modal-gift-id').textContent = gift.id || 'N/A';
    getEl('modal-receiver').textContent = gift.receiver || gift.recipientName || 'N/A';
    getEl('modal-sender').textContent = gift.sender || gift.senderName || 'Anonymous';
    getEl('modal-template').textContent = gift.template || '—';
    getEl('modal-occasion').textContent = gift.occasionId || '—';
    getEl('modal-message').textContent = gift.message || 'No message';

    // Status badge
    const statusEl = getEl('modal-status');
    if (gift.status === 'active') {
        statusEl.textContent = 'ACTIVE';
        statusEl.className = 'px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20';
    } else {
        statusEl.textContent = 'PENDING';
        statusEl.className = 'px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    }

    // Created date
    let date = 'N/A';
    if (gift.createdAt) {
        const d = gift.createdAt.toDate ? gift.createdAt.toDate() : new Date(gift.createdAt);
        date = d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    getEl('modal-created').textContent = date;

    // Photo
    const photo = gift.photoUrl || gift.photoURL || '';
    const photoContainer = getEl('modal-photo-container');
    if (photo) {
        getEl('modal-photo').src = photo;
        photoContainer.classList.remove('hidden');
    } else {
        photoContainer.classList.add('hidden');
    }

    // Gift link
    const giftLink = `${BASE_URL}index.html?id=${gift.id || gift.docId}`;
    getEl('modal-gift-link').value = giftLink;
    getEl('modal-open-link').href = giftLink;

    // Activate button
    const activateBtn = getEl('modal-activate-btn');
    if (gift.status === 'active') {
        activateBtn.innerHTML = '<i class="ph ph-check-circle"></i> Already Active';
        activateBtn.classList.add('opacity-50', 'cursor-not-allowed');
        activateBtn.disabled = true;
    } else {
        activateBtn.innerHTML = '<i class="ph ph-check-circle"></i> Activate Gift';
        activateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        activateBtn.disabled = false;
    }

    getEl('gift-detail-modal').classList.remove('hidden');
};

window.closeGiftModal = function () {
    getEl('gift-detail-modal').classList.add('hidden');
    selectedGift = null;
};

window.copyGiftLink = function () {
    const link = getEl('modal-gift-link').value;
    navigator.clipboard.writeText(link);
    showToast('Gift link copied!');
};

window.activateFromModal = async function () {
    if (!selectedGift || selectedGift.status === 'active') return;

    try {
        await db.collection('gifts').doc(selectedGift.docId).update({ status: 'active' });
        showToast('Gift activated successfully!');
        closeGiftModal();
    } catch (err) {
        console.error("Activation failed:", err);
        showToast('Error activating gift', 'error');
    }
};

// -- WhatsApp Share --
window.openWhatsAppShare = function () {
    if (!selectedGift) return;

    const giftLink = getEl('modal-gift-link').value;
    const message = `🎁 Gift Activated!\n\nYour special gift for ${selectedGift.receiver || 'the recipient'} is ready!\n\nView it here: ${giftLink}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
};

// -- Confirmation Modal --
window.confirmActivate = function (docId) {
    const gift = allGifts.find(g => g.docId === docId);
    showConfirmModal(
        'Activate Gift',
        `Are you sure you want to activate this gift for ${gift?.receiver || 'the recipient'}?`,
        async () => {
            try {
                await db.collection('gifts').doc(docId).update({ status: 'active' });
                showToast('Gift activated successfully!');
            } catch (err) {
                console.error("Activation failed:", err);
                showToast('Error activating gift', 'error');
            }
        }
    );
};

window.confirmDelete = function (docId, receiverName) {
    showConfirmModal(
        'Delete Gift',
        `Are you sure you want to delete the gift for "${receiverName}"? This action cannot be undone.`,
        async () => {
            try {
                await db.collection('gifts').doc(docId).delete();
                showToast('Gift deleted successfully!');
            } catch (err) {
                console.error("Delete failed:", err);
                showToast('Error deleting gift', 'error');
            }
        },
        true
    );
};

window.confirmDeleteGift = function () {
    if (!selectedGift) return;
    closeGiftModal();
    confirmDelete(selectedGift.docId, selectedGift.receiver || 'this gift');
};

function showConfirmModal(title, message, onConfirm, isDanger = false) {
    getEl('confirm-title').textContent = title;
    getEl('confirm-message').textContent = message;

    const icon = getEl('confirm-icon');
    const btn = getEl('confirm-action-btn');

    if (isDanger) {
        icon.className = 'w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4';
        icon.innerHTML = '<i class="ph ph-warning text-3xl text-red-500"></i>';
        btn.className = 'flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition-colors';
        btn.textContent = 'Delete';
    } else {
        icon.className = 'w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4';
        icon.innerHTML = '<i class="ph ph-warning text-3xl text-yellow-500"></i>';
        btn.className = 'flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold transition-colors';
        btn.textContent = 'Confirm';
    }

    btn.onclick = () => {
        onConfirm();
        closeConfirmModal();
    };

    getEl('confirm-modal').classList.remove('hidden');
}

window.closeConfirmModal = function () {
    getEl('confirm-modal').classList.add('hidden');
};

// -- Photo Preview Modal --
window.showPhotoPreview = function (url) {
    getEl('preview-image').src = url;
    getEl('photo-preview-modal').classList.remove('hidden');
};

// -- Toggle Gift Status --
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
