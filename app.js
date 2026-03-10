// Global references from firebase-config.js
// db, storage, auth are initialized globally

// -- Data Structures --
const occasions = [
    { id: 'birthday', label: 'Birthday', icon: 'ph-cake', gradient: 'from-blue-900 to-purple-900' },
    { id: 'anniversary', label: 'Anniversary', icon: 'ph-heart', gradient: 'from-red-900 to-pink-900' },
    { id: 'justbecause', label: 'Just Because', icon: 'ph-star', gradient: 'from-indigo-900 to-blue-900' },
    { id: 'celebrate', label: 'Celebrate', icon: 'ph-confetti', gradient: 'from-green-900 to-teal-900' }
];

// Mock Stitch AI specific templates available per occasion
const themeTemplates = {
    'birthday': [
        { id: 'bday/ritual', name: 'Birthday Ritual', desc: 'An ultra-premium interactive celebration.' },
        { id: 'neon', name: 'Neon Vibes', desc: 'A glowing cyberpunk style celebration.' },
        { id: 'soft', name: 'Minimalist Soft', desc: 'Clean, elegant geometry.' },
        { id: 'balloons', name: 'Floating Balloons', desc: 'Interactive 3D balloon effects.' }
    ],
    'anniversary': [
        { id: 'soft', name: 'Romantic Glow', desc: 'Warm gradients and elegant typography.' },
        { id: 'neon', name: 'Modern Neon', desc: 'Vibrant love celebration.' }
    ],
    // Fallback template map
    'default': [
        { id: 'neon', name: 'Neon Pulse', desc: 'Energetic and bright.' },
        { id: 'soft', name: 'Elegant Serenity', desc: 'Calm and sophisticated.' }
    ]
};

// -- DOM Elements --
const appContainer = document.getElementById('app-container');
const tplState1 = document.getElementById('tpl-state-1');
const tplState2 = document.getElementById('tpl-state-2');
const tplState3 = document.getElementById('tpl-state-3');
const loadingOverlay = document.getElementById('loading-overlay');
const trackModal = document.getElementById('track-modal');
const viewerContainer = document.getElementById('viewer-container');

// -- State --
window.currentOccasion = null; // Stored on window to access easily from dom inline events if needed
window.currentTheme = null;
let compressedPhotoDataUrl = null;

// -- Cloudinary Config --
const CLOUDINARY_CLOUD_NAME = 'disurt4mx';
const CLOUDINARY_UPLOAD_PRESET = 'gift photos';

// -- Initialization --
function init() {
    startHearts();
    setupTrackModal();
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
        loadViewerMode(id);
    } else {
        renderState1();
    }
}

// -- Heart Animation System --
function startHearts() {
    const hearts = ["💖","✨","💫","💗","🤍"];
    setInterval(() => {
        const h = document.createElement("div");
        h.className = "heart";
        h.textContent = hearts[Math.floor(Math.random()*hearts.length)];
        h.style.left = Math.random() * 100 + "vw";
        h.style.animationDuration = 6 + Math.random() * 8 + "s";
        document.body.appendChild(h);
        setTimeout(() => h.remove(), 14000);
    }, 800);
}

// -- Helpers --
function clearContainer() { appContainer.innerHTML = ''; }
function showLoading(text) {
    document.getElementById('loading-text').textContent = text;
    loadingOverlay.classList.remove('hidden');
}
function hideLoading() { loadingOverlay.classList.add('hidden'); }

// -- Global Navigations (Bound to window for direct HTML onClick use) --
window.goHome = () => { currentOccasion = null; currentTheme = null; renderState1(); };
window.goState2 = () => { renderState2(currentOccasion.id, currentOccasion.label); };
window.selectTheme = (themeId, themeName) => {
    currentTheme = { id: themeId, name: themeName };
    renderState3();
};

/* =========================================================
   STATE 1: Occasions Gallery
========================================================= */
function renderState1() {
    clearContainer();
    const node = tplState1.content.cloneNode(true);
    const grid = node.querySelector('.grid');
    
    occasions.forEach(occ => {
        const card = document.createElement('div');
        card.className = `occasion-card glass-card rounded-3xl p-6 flex flex-col items-center justify-center group transform hover:scale-105 hover:bg-white/5`;
        card.onclick = () => {
            currentOccasion = occ;
            renderState2(occ.id, occ.label);
        };
        
        card.innerHTML = `
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br ${occ.gradient} flex items-center justify-center mb-4 shadow-xl border border-white/20 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all">
                <i class="${occ.icon} text-4xl text-white"></i>
            </div>
            <span class="font-display text-xl font-bold text-white group-hover:text-brand-pink transition-colors mb-4">${occ.label}</span>
            <button class="px-6 py-2 rounded-full border border-white/20 text-sm font-semibold text-white group-hover:bg-white/10 transition-colors">Select Occasion</button>
        `;
        grid.appendChild(card);
    });
    
    appContainer.appendChild(node);
}

/* =========================================================
   STATE 2: Themes Selection
========================================================= */
function renderState2(occId, occLabel) {
    clearContainer();
    const node = tplState2.content.cloneNode(true);
    node.querySelector('#theme-category-name').textContent = occLabel;
    
    const grid = node.querySelector('#themes-grid');
    const themes = themeTemplates[occId] || themeTemplates['default'];
    
    themes.forEach(theme => {
        const tcard = document.createElement('div');
        tcard.className = 'glass-card rounded-3xl overflow-hidden group flex flex-col transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(58,108,255,0.3)] border border-white/10 hover:border-brand-blue/50 cursor-pointer';
        tcard.onclick = () => window.selectTheme(theme.id, theme.name);
        
        // Mocking an image preview for a theme
        const mockImgUrl = `https://source.unsplash.com/600x400/?${occLabel.replace(' ','')},aesthetic,${theme.id}`;
        
        tcard.innerHTML = `
            <div class="h-48 w-full bg-gray-900 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <div class="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><rect fill=\\'%23111\\' width=\\'100\\' height=\\'100\\'/></svg>')">
                   <div class="w-full h-full flex items-center justify-center border-b border-white/10 bg-[#0f1225]">
                      <i class="ph ph-magic-wand text-5xl text-brand-blue opacity-50"></i>
                   </div>
                </div>
            </div>
            <div class="p-6 relative z-20 bg-black/40 flex-1 flex flex-col">
                <h3 class="font-display text-2xl font-bold text-white mb-2">${theme.name}</h3>
                <p class="text-sm text-gray-400 mb-6 flex-1">${theme.desc}</p>
                <button class="w-full py-3 rounded-xl border border-brand-pink/50 text-brand-pink font-semibold group-hover:bg-brand-pink group-hover:text-white transition-all">
                    Select Theme
                </button>
            </div>
        `;
        grid.appendChild(tcard);
    });

    appContainer.appendChild(node);
}

/* =========================================================
   STATE 3: Form Editor
========================================================= */
function renderState3() {
    clearContainer();
    const node = tplState3.content.cloneNode(true);
    
    node.querySelector('#current-theme-label').textContent = currentTheme.name;
    
    const form = node.querySelector('#editor-form');
    const rName = node.querySelector('#receiverName');
    const sName = node.querySelector('#senderName');
    const msg = node.querySelector('#messageText');
    const pUpload = node.querySelector('#photoUpload');
    
    const prevR = node.querySelector('#preview-receiver');
    const prevS = node.querySelector('#preview-sender');
    const prevM = node.querySelector('#preview-message');
    const prevP = node.querySelector('#preview-photo');

    // Real-time Sync Logic
    const sync = (src, dest, def) => {
        src.addEventListener('input', () => { dest.textContent = src.value || def; });
    };
    sync(rName, prevR, "Receiver");
    sync(sName, prevS, "Sender");
    sync(msg, prevM, "Message preview...");

    // Photo Compression Upload
    pUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        const statusEl = document.getElementById('photo-status');
        statusEl.textContent = "Compressing photo...";
        statusEl.classList.remove('hidden');
        statusEl.className = "text-xs text-center mt-2 text-yellow-500 animate-pulse";

        try {
            compressedPhotoDataUrl = await compressImage(file, 500);
            prevP.src = compressedPhotoDataUrl;
            prevP.classList.remove('hidden');
            
            statusEl.textContent = "Photo ready!";
            statusEl.className = "text-xs text-center mt-2 text-green-400 font-bold";
        } catch(err) {
            statusEl.textContent = "Compression failed.";
            statusEl.className = "text-xs text-center mt-2 text-red-500";
        }
    });

    // Form Submission
    form.addEventListener('submit', handleGiftSubmission);

    // Apply template specific mock styling to the live-preview container based on chosen theme
    const lp = node.querySelector('#live-preview');
    if(currentTheme.id === 'neon') {
        lp.className = "w-full h-full bg-black flex flex-col justify-center items-center text-center p-6 border-4 border-pink-500 shadow-[inset_0_0_20px_rgba(255,79,163,0.5)]";
        prevR.className = "font-display text-4xl text-white text-shadow-[0_0_15px_pink] mb-4";
    } else {
        lp.className = "w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex flex-col justify-center items-center text-center p-6";
        prevR.className = "font-display text-4xl text-gray-800 mb-4";
        prevM.classList.replace('text-gray-300', 'text-gray-600');
        prevS.classList.replace('text-brand-pink', 'text-brand-blue');
    }

    appContainer.appendChild(node);
}

// -- Compression Utility --
function compressImage(file, maxSizeKB) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = e => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cvs = document.createElement('canvas');
                let w = img.width; let h = img.height;
                const MAX = 800;
                if(w > h && w > MAX) { h *= MAX/w; w = MAX; }
                else if (h > MAX) { w *= MAX/h; h = MAX; }
                cvs.width = w; cvs.height = h;
                const ctx = cvs.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(cvs.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = err => reject(err);
        };
        reader.onerror = err => reject(err);
    });
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

// -- Form Logic --
async function handleGiftSubmission(e) {
    e.preventDefault();
    if(!currentTheme) return;

    const rName = document.getElementById('receiverName').value;
    const sName = document.getElementById('senderName').value;
    const msg = document.getElementById('messageText').value;

    if(!rName || !sName) {
        alert("Please fill in Receiver and Sender names.");
        return;
    }

    showLoading("Encrypting & Uploading...");

    try {
        const giftId = 'GIFT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        let photoUrl = "";

        // 1. Upload to Cloudinary instead of storing Base64 in Firestore
        if (compressedPhotoDataUrl) {
            console.log("Uploading photo to Cloudinary...");
            photoUrl = await uploadToCloudinary(compressedPhotoDataUrl);
            console.log("Cloudinary Upload Success:", photoUrl);
        }

        // 2. Save Metadata to Firestore
        const giftData = {
            id: giftId,
            receiver: rName,
            sender: sName,
            message: msg,
            photoUrl: photoUrl,
            template: currentTheme.id,
            occasionId: currentOccasion.id,
            status: 'pending',
            createdAt: Date.now()
        };

        if (db) {
            console.log("Saving gift metadata to Firestore...", giftData);
            
            // Set a timeout warning if Firestore takes too long
            const firestoreTimeout = setTimeout(() => {
                console.warn("Firestore is taking a long time. Check your Security Rules or Database status in Firebase Console.");
            }, 5000);

            await db.collection("gifts").add(giftData);
            clearTimeout(firestoreTimeout);
            console.log("Firestore metadata saved successfully.");
        } else {
            throw new Error("Firestore not initialized.");
        }

        const domain = window.location.origin;
        const giftUrl = `${domain}/?id=${giftId}`;
        
        // Construct the WhatsApp Message
        const adminPhone = "916394460784";
        const waMessage = `✨ *New Gift Activation Request* ✨\n\n` + 
                          `*ID:* ${giftId}\n` +
                          `*Template:* ${currentTheme.name}\n` +
                          `*Recipient:* ${rName}\n` +
                          `*Link:* ${giftUrl}\n\n` +
                          `Please activate this gift.`;
                          
        const encodedWaMessage = encodeURIComponent(waMessage);
        const waUrl = `https://wa.me/${adminPhone}?text=${encodedWaMessage}`;

        hideLoading();
        appContainer.innerHTML = `
            <div class="glass-card rounded-3xl p-10 max-w-2xl mx-auto text-center mt-10 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent z-0"></div>
                <div class="relative z-10 w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <i class="ph-fill ph-check-circle text-5xl"></i>
                </div>
                <h2 class="relative z-10 font-display text-4xl font-bold text-white mb-4">Gift Encrypted & Ready</h2>
                <p class="relative z-10 text-gray-400 mb-8 max-w-md mx-auto">Your private experience has been generated and saved. It remains locked until activated.</p>
                
                <div class="relative z-10 bg-black/50 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col items-center justify-center gap-2">
                    <p class="text-sm text-gray-300 uppercase font-bold tracking-widest">Your Private Link</p>
                    <code class="text-lg text-brand-blue font-mono bg-white/5 py-3 px-4 rounded-lg select-all mb-2 border border-brand-blue/20 w-full overflow-hidden text-ellipsis">${giftUrl}</code>
                    <p class="text-xs text-brand-pink"><i class="ph ph-lock mr-2"></i>Status: Pending Activation</p>
                </div>

                <a href="${waUrl}" target="_blank"
                   class="relative z-10 inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-[#25D366] text-white font-bold text-lg px-8 py-5 rounded-2xl animate-[pulse-slow_3s_ease-in-out_infinite] hover:bg-[#1fa14f] hover:scale-105 transition-all shadow-[0_10px_30px_rgba(37,211,102,0.4)]">
                    <i class="ph ph-whatsapp-logo text-2xl"></i>
                    Activate via WhatsApp
                </a>
            </div>
        `;
    } catch (err) {
        console.error("Submission Error:", err);
        hideLoading();
        alert("Failed to save gift: " + err.message);
    }
}


/* =========================================================
   TRACK MODAL LOGIC
========================================================= */
function setupTrackModal() {
    const btn = document.getElementById('nav-track-btn');
    const closeBtn = document.getElementById('close-modal');
    const submit = document.getElementById('track-submit');
    const input = document.getElementById('track-id');
    const res = document.getElementById('track-result');

    btn.onclick = () => {
        trackModal.classList.remove('hidden');
        trackModal.classList.add('flex');
    };
    
    closeBtn.onclick = () => {
        trackModal.classList.add('hidden');
        trackModal.classList.remove('flex');
        res.classList.add('hidden');
        input.value = '';
    };

    submit.onclick = async () => {
        const val = input.value.trim().toUpperCase();
        res.classList.remove('hidden', 'text-green-400', 'text-yellow-400', 'text-red-400', 'bg-red-500/10', 'border-red-500/30');
        
        if(!val.startsWith('GIFT-')) {
            res.textContent = "Invalid ID format. Must start with GIFT-.";
            res.classList.add('text-red-400');
            res.classList.remove('hidden');
            return;
        }

        res.classList.remove('hidden');
        res.classList.add('text-yellow-400');
        res.innerHTML = `<i class="ph ph-circle-notch animate-spin inline-block mr-2"></i> Querying secure database...`;
        
        try {
            if (!db) throw new Error("Database not connected.");
            
            const snapshot = await db.collection("gifts").where("id", "==", val).get();
            
            if (snapshot.empty) {
                res.className = "mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-center text-red-400 font-bold";
                res.innerHTML = `<i class="ph ph-warning-circle inline-block mr-2"></i> No gift found with ID: ${val}`;
            } else {
                const gift = snapshot.docs[0].data();
                if (gift.status === 'active') {
                    res.className = "mt-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-center text-green-400 font-bold";
                    res.innerHTML = `<i class="ph-fill ph-check-circle inline-block mr-2"></i> Status: ACTIVE<br/><a href="/?id=${val}" class="text-white underline text-sm mt-2 inline-block">View Experience</a>`;
                } else {
                    res.className = "mt-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-center text-yellow-400 font-bold";
                    res.innerHTML = `<i class="ph-fill ph-clock-counter-clockwise inline-block mr-2"></i> Status: PENDING<br/><span class="text-xs font-normal text-gray-400">Activation request is being processed.</span>`;
                }
            }
        } catch (err) {
            console.error("Tracking Error:", err);
            res.className = "mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-center text-red-500 font-bold";
            res.textContent = "Search failed: " + err.message;
        }
    };
}


/* =========================================================
   VIEWER MODE
========================================================= */
async function loadViewerMode(id) {
    document.querySelector('nav').style.display = 'none'; // hide nav
    showLoading("Unwrapping secure gift...");

    try {
        if (!db) throw new Error("Database not connected.");

        // Fetch real data from Firestore
        const snapshot = await db.collection("gifts").where("id", "==", id).get();
        
        if (snapshot.empty) {
            hideLoading();
            appContainer.innerHTML = `
                <div class="pt-20 text-center flex flex-col items-center px-6">
                    <div class="w-20 h-20 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-6">
                        <i class="ph ph-warning-circle text-4xl"></i>
                    </div>
                    <h1 class="text-3xl text-white font-bold mb-4">Gift Not Found</h1>
                    <p class="text-gray-400 max-w-sm mb-8">We couldn't find an experience associated with ID: <span class="font-mono text-white">${id}</span></p>
                    <button onclick="window.location.search = ''" class="bg-white/10 text-white px-8 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all">Go Back</button>
                </div>`;
            return;
        }

        const giftData = snapshot.docs[0].data();

        if (giftData.status !== 'active') {
            hideLoading();
            appContainer.innerHTML = `
                <div class="pt-20 text-center flex flex-col items-center px-6">
                    <div class="w-20 h-20 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-6">
                        <i class="ph ph-lock text-4xl"></i>
                    </div>
                    <h1 class="text-3xl text-white font-bold mb-4">Pending Activation</h1>
                    <p class="text-gray-400 max-w-sm mb-8">This gift has been encrypted but is waiting for administrator approval before it can be viewed.</p>
                    <button onclick="window.location.search = ''" class="bg-white/10 text-white px-8 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all">Go Back</button>
                </div>`;
            return;
        }

        // Load Template
        const resp = await fetch(`./templates/${giftData.template}/index.html`);
        if (!resp.ok) throw new Error("Template file not found");
        
        const html = await resp.text();
        viewerContainer.innerHTML = html;
        
        // Execute scripts in the injected content with dependency handling
        const scripts = Array.from(viewerContainer.querySelectorAll('script'));
        const externalScripts = scripts.filter(s => s.src);
        const inlineScripts = scripts.filter(s => !s.src);
        let loadedCount = 0;

        const runInline = () => {
            inlineScripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
            
            // Inject data after scripts have run
            viewerContainer.querySelectorAll('[data-receiver]').forEach(el => el.textContent = giftData.receiver);
            viewerContainer.querySelectorAll('[data-sender]').forEach(el => el.textContent = giftData.sender);
            viewerContainer.querySelectorAll('[data-message]').forEach(el => el.textContent = giftData.message);

            // Handle Photo if provided
            if (giftData.photoUrl) {
                viewerContainer.querySelectorAll('[data-photo]').forEach(el => {
                    if (el.tagName === 'IMG') el.src = giftData.photoUrl;
                    else el.style.backgroundImage = `url('${giftData.photoUrl}')`;
                    el.classList.remove('hidden');
                });
            }

            // If the template has an init function, call it
            if (typeof window.initRitual === 'function') {
                window.initRitual();
            }
        };

        if (externalScripts.length === 0) {
            runInline();
        } else {
            externalScripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.onload = () => {
                    loadedCount++;
                    if (loadedCount === externalScripts.length) runInline();
                };
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        }
        
        hideLoading();
        viewerContainer.classList.remove('hidden');
    } catch(err) {
        console.error("Viewer Error:", err);
        hideLoading();
        alert("Critial Error: " + err.message);
        window.location.search = '';
    }
}

window.onload = init;
