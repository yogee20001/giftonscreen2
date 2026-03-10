// Debugging log
console.log("Admin JS Loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Ready");

    const loginForm = document.getElementById('login-form');
    const adminLoginView = document.getElementById('admin-login');
    const adminDashboardView = document.getElementById('admin-dashboard');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const dbStatus = document.getElementById('db-status');

    let unsubscribePending = null;
    let unsubscribeActive = null;

    // Helper to toggle views
    function showDashboard() {
        console.log("Showing Dashboard...");
        adminLoginView.classList.add('hidden');
        adminDashboardView.classList.remove('hidden');
        startRealtimeListeners();
    }

    function showLogin() {
        console.log("Showing Login...");
        stopRealtimeListeners();
        adminDashboardView.classList.add('hidden');
        adminLoginView.classList.remove('hidden');
    }

    // Check auth status
    if (typeof auth !== 'undefined' && auth !== null) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                showDashboard();
            } else {
                showLogin();
            }
        });
    } else {
        console.error("Firebase Auth not initialized");
    }

    // Handle Login
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const pwd = document.getElementById('admin-password').value;
            const btn = loginForm.querySelector('button');

            btn.disabled = true;
            btn.textContent = "Logging in...";
            loginError.classList.add('hidden');

            try {
                await auth.signInWithEmailAndPassword(email, pwd);
                console.log("Firebase Login Successful");
            } catch (error) {
                console.error("Login Error:", error.message);
                loginError.textContent = error.message;
                loginError.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = "Login";
            }
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            console.log("Logout clicked");
            auth.signOut();
        };
    }

    function startRealtimeListeners() {
        if (!db) {
            updateStatus("Database connection error", "error");
            return;
        }

        updateStatus("Connected & Listening", "success");

        // Listener for PENDING gifts
        unsubscribePending = db.collection("gifts")
            .where("status", "==", "pending")
            .onSnapshot((snapshot) => {
                const gifts = [];
                snapshot.forEach(doc => gifts.push({ docId: doc.id, ...doc.data() }));
                // Sort manually in case index isn't ready
                gifts.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
                renderGifts(gifts, 'pending-list');
            }, (error) => {
                console.error("Pending Listener Error:", error);
                updateStatus("Sync Error (Check Rules/Index)", "error");
            });

        // Listener for ACTIVE gifts (limit to last 20)
        unsubscribeActive = db.collection("gifts")
            .where("status", "==", "active")
            .onSnapshot((snapshot) => {
                const gifts = [];
                snapshot.forEach(doc => gifts.push({ docId: doc.id, ...doc.data() }));
                gifts.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
                renderGifts(gifts.slice(0, 20), 'active-list');
            }, (error) => {
                console.error("Active Listener Error:", error);
            });
    }

    function stopRealtimeListeners() {
        if (unsubscribePending) unsubscribePending();
        if (unsubscribeActive) unsubscribeActive();
        updateStatus("Disconnected", "idle");
    }

    function updateStatus(text, type) {
        if (!dbStatus) return;
        const dot = dbStatus.querySelector('span');
        dbStatus.childNodes[2].textContent = text;
        
        dot.className = "w-2 h-2 rounded-full " + 
            (type === 'success' ? 'bg-green-500' : 
             type === 'error' ? 'bg-red-500' : 'bg-yellow-500');
        
        if (type === 'success') dot.classList.remove('animate-pulse');
        else dot.classList.add('animate-pulse');
    }

    function renderGifts(gifts, containerId) {
        const container = document.getElementById(containerId);
        const noDataEl = document.getElementById(containerId === 'pending-list' ? 'no-pending' : 'no-active');
        const isPending = containerId === 'pending-list';

        if (gifts.length === 0) {
            container.innerHTML = '';
            noDataEl.classList.remove('hidden');
            return;
        }

        noDataEl.classList.add('hidden');
        container.innerHTML = gifts.map(gift => `
            <tr>
                <td><strong>${gift.id}</strong></td>
                <td>${gift.sender}</td>
                <td>${gift.receiver}</td>
                <td>
                    ${gift.photoUrl 
                        ? `<img src="${gift.photoUrl}" class="admin-thumbnail" onclick="window.open('${gift.photoUrl}', '_blank')" title="Click to view full size">`
                        : `<span class="text-gray-600 text-xs italic">No Photo</span>`
                    }
                </td>
                <td>${gift.template}</td>
                <td>${new Date(gift.createdAt).toLocaleDateString()}</td>
                <td>
                    ${isPending 
                        ? `<button class="secondary-btn" onclick="activateGift('${gift.docId || gift.id}')">Activate</button>`
                        : `<span class="text-green-500 flex items-center gap-1"><i class="ph ph-check-circle"></i> Active</span>`
                    }
                </td>
            </tr>
        `).join('');
    }

    // Replace the old fetchPendingGifts calls with fetchGifts
    function fetchPendingGifts() { fetchGifts(); }


    // Global activation for simplicity
    window.activateGift = async (docId) => {
        if(!confirm("Activate this gift?")) return;
        
        try {
            console.log("LIVE ACTIVATE: Updating document:", docId);
            await db.collection("gifts").doc(docId).update({ status: "active" });
            alert("Gift activated successfully!");
        } catch (err) {
            console.error("Activation error:", err);
            alert("Error: " + err.message);
        }
    };

    // Manual Activation Logic
    const manualBtn = document.getElementById('manual-activate-btn');
    const manualInput = document.getElementById('manual-gift-id');
    const manualFeedback = document.getElementById('manual-feedback');

    if (manualBtn) {
        manualBtn.onclick = async () => {
            const giftId = manualInput.value.trim().toUpperCase();
            if (!giftId) {
                showManualFeedback("Please enter a Gift ID", "error");
                return;
            }

            console.log("Manual activation attempt for:", giftId);

            manualBtn.disabled = true;
            manualBtn.textContent = "Activating...";

            try {
                console.log("Searching for live gift:", giftId);
                const snapshot = await db.collection("gifts").where("id", "==", giftId).get();
                
                if (snapshot.empty) {
                    showManualFeedback(`Gift ID ${giftId} not found in database.`, "error");
                } else {
                    const docId = snapshot.docs[0].id;
                    console.log("Found document:", docId, "Updating status...");
                    await db.collection("gifts").doc(docId).update({ status: "active" });
                    showManualFeedback(`Success! ${giftId} is now active.`, "success");
                    manualInput.value = "";
                }
            } catch (err) {
                console.error("Manual Activation Error:", err);
                showManualFeedback("Error: " + err.message, "error");
            } finally {
                manualBtn.disabled = false;
                manualBtn.textContent = "Activate Now";
            }
        };
    }

    function showManualFeedback(text, type) {
        manualFeedback.textContent = text;
        manualFeedback.className = `mt-3 text-sm ${type === 'success' ? 'text-green-400' : 'text-danger'}`;
        manualFeedback.classList.remove('hidden');
        setTimeout(() => manualFeedback.classList.add('hidden'), 5000);
    }
});

