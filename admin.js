// Debugging log
console.log("Admin JS Loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Ready");

    const loginForm = document.getElementById('login-form');
    const adminLoginView = document.getElementById('admin-login');
    const adminDashboardView = document.getElementById('admin-dashboard');
    const pendingList = document.getElementById('pending-list');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    let isMockAuthenticated = false;
    
    // Dynamic Mock Store for session-based testing
    let mockGifts = [
        { id: 'GIFT-MOCK-01', sender: 'Alice', receiver: 'Bob', template: 'ritual', status: 'pending', createdAt: Date.now() },
        { id: 'GIFT-MOCK-02', sender: 'Charlie', receiver: 'Diana', template: 'neon', status: 'active', createdAt: Date.now() - 86400000 },
        { id: 'GIFT-MOCK-03', sender: 'Eve', receiver: 'Frank', template: 'soft', status: 'active', createdAt: Date.now() - 172800000 }
    ];

    // Helper to toggle views
    function showDashboard() {
        console.log("Showing Dashboard...");
        adminLoginView.classList.add('hidden');
        adminDashboardView.classList.remove('hidden');
        fetchPendingGifts();
    }

    function showLogin() {
        console.log("Showing Login...");
        adminDashboardView.classList.add('hidden');
        adminLoginView.classList.remove('hidden');
    }

    // Check auth status
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            if (isMockAuthenticated) return;
            if (user) {
                showDashboard();
            } else {
                showLogin();
            }
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            e.stopPropagation(); // Stop any other listeners
            console.log("Login form submitted");

            const email = document.getElementById('admin-email').value;
            const pwd = document.getElementById('admin-password').value;

            // Mock check
            const isPlaceholder = (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey.includes("PLACEHOLDER"));
            const isMockUser = (email === "admin@test.com" && pwd === "password");

            if (isMockUser) {
                console.log("Mock Login Successful");
                isMockAuthenticated = true;
                showDashboard();
                return false; // Prevent any default action
            }

            try {
                await auth.signInWithEmailAndPassword(email, pwd);
                console.log("Firebase Login Successful");
            } catch (error) {
                console.error("Login Error:", error.message);
                loginError.textContent = error.message;
                loginError.classList.remove('hidden');
            }
            return false;
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            console.log("Logout clicked");
            if (isMockAuthenticated) {
                isMockAuthenticated = false;
                showLogin();
            } else {
                auth.signOut();
            }
        };
    }

    async function fetchGifts() {
        // MOCK MODE FETCH (Only if explicitly in dev mode or mock authenticated)
        const urlParams = new URLSearchParams(window.location.search);
        const isDevMode = urlParams.get('mode') === 'dev';
        console.log("Fetch requested. Current mode:", isMockAuthenticated && isDevMode ? "MOCK" : "LIVE");

        const pendingContainer = document.getElementById('pending-list');
        const activeContainer = document.getElementById('active-list');
        
        pendingContainer.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
        activeContainer.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

        if (isMockAuthenticated && isDevMode) {
            console.log("MOCK FETCH: Filtering local store...");
            setTimeout(() => {
                const pending = mockGifts.filter(g => g.status === 'pending');
                const active = mockGifts.filter(g => g.status === 'active');
                renderGifts(pending, 'pending-list');
                renderGifts(active, 'active-list');
            }, 500);
            return;
        }

        // LIVE MODE FETCH
        console.log("LIVE FETCH: Querying Firestore...");
        if (!db) {
            const msg = "Database not initialized. Please configure firebase-config.js";
            pendingContainer.innerHTML = `<tr><td colspan="6" class="error-text p-4">${msg}</td></tr>`;
            activeContainer.innerHTML = `<tr><td colspan="6" class="error-text p-4">${msg}</td></tr>`;
            return;
        }
        try {
            // Helper for resilient fetching
            const getResilientSnap = async (status) => {
                try {
                    // Try optimal sorted query
                    return await db.collection("gifts")
                                   .where("status", "==", status)
                                   .orderBy("createdAt", "desc")
                                   .limit( status === 'active' ? 20 : 50)
                                   .get();
                } catch (e) {
                    console.warn(`Sort failed for status: ${status}. Falling back to simple query. Error: ${e.message}`);
                    // Fallback to simple unsorted query (doesn't require composite index)
                    return await db.collection("gifts")
                                   .where("status", "==", status)
                                   .get();
                }
            };

            const pendingSnap = await getResilientSnap("pending");
            const activeSnap = await getResilientSnap("active");

            const mapAndSort = (snap) => {
                const list = [];
                snap.forEach(doc => list.push({ docId: doc.id, ...doc.data() }));
                // Client-side sort fallback
                return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            };

            renderGifts(mapAndSort(pendingSnap), 'pending-list');
            renderGifts(mapAndSort(activeSnap), 'active-list');

        } catch (err) {
            console.error("Critical Fetch Error:", err);
            pendingContainer.innerHTML = `<tr><td colspan="6" class="error-text">Error: ${err.message}</td></tr>`;
            activeContainer.innerHTML = `<tr><td colspan="6" class="error-text">Error: ${err.message}</td></tr>`;
        }
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
    window.activateGift = async (id) => {
        if(!confirm("Activate this gift?")) return;
        
        if (isMockAuthenticated) {
            console.log("MOCK ACTIVATE: Updating local record", id);
            const gift = mockGifts.find(g => g.id === id);
            if (gift) gift.status = 'active';
            fetchGifts(); 
            alert("Mock activation successful!");
            return;
        }

        try {
            console.log("LIVE ACTIVATE: Updating document:", id);
            await db.collection("gifts").doc(id).update({ status: "active" });
            fetchGifts();
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

            if (isMockAuthenticated) {
                const gift = mockGifts.find(g => g.id === giftId);
                if (gift) {
                    gift.status = 'active';
                    showManualFeedback(`Mock Activation Successful for ${giftId}!`, "success");
                    manualInput.value = "";
                    fetchGifts();
                } else {
                    showManualFeedback(`Mock ID ${giftId} not found. Try GIFT-MOCK-01`, "error");
                }
                return;
            }

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
                    fetchGifts();
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
        manualFeedback.className = `mt-3 text-sm ${type === 'success' ? 'text-green-400' : 'text-red-400'}`;
        manualFeedback.classList.remove('hidden');
        setTimeout(() => manualFeedback.classList.add('hidden'), 5000);
    }
});

