// Register GSAP Plugins
gsap.registerPlugin(Draggable);

// DOM Elements
const mainContainer = document.getElementById('main-container');
const candleWrapper = document.querySelector('.candle-wrapper');
const candleFlame = document.getElementById('candle-flame');
const ambientCandleGlow = document.querySelector('.ambient-candle-glow');
const lighterWrapper = document.querySelector('.lighter-wrapper');
const lighterFlame = document.getElementById('lighter-flame');
const lighterLid = document.getElementById('lighter-lid');
const lighterTip = document.querySelector('.lighter-tip');
const scene1 = document.getElementById('scene-1');
const scene2 = document.getElementById('scene-2');
const scene3 = document.getElementById('scene-3');
const sliceTip = document.querySelector('.slice-tip');
const knifeWrapper = document.querySelector('.knife-wrapper');
const cakeLeft = document.querySelector('.lux-left');
const cakeRight = document.querySelector('.lux-right');

// Audio Elements
const sfxLighterOpen = document.getElementById('sfx-lighter-open');
const sfxLighterSpark = document.getElementById('sfx-lighter-spark');
const sfxFlame = document.getElementById('sfx-flame');
const sfxSlice = document.getElementById('sfx-slice');
const sfxPop = document.getElementById('sfx-pop');
const ambientMusic = document.getElementById('ambient-music');

// State
let isCandleLit = false;

// Helpers: Play Audio (Fail-safe for browser autoplay policies)
function playAudio(element, volume = 1) {
    element.volume = volume;
    try {
        let playPromise = element.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => { console.log('Audio playback prevented'); });
        }
    } catch (e) { }
}

function stopAudio(element) {
    element.pause();
    element.currentTime = 0;
}

// Particle System - Ambient Background
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let width, height, particles = [];

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * -0.5 - 0.1; /* Float up */
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.y < 0) {
            this.y = height;
            this.x = Math.random() * width;
        }
    }
    draw() {
        ctx.fillStyle = `rgba(255, 235, 180, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
function initParticles() {
    for (let i = 0; i < 100; i++) particles.push(new Particle());
}
function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
initParticles();
animateParticles();

// --- INIT TIMELINE ---
const initTl = gsap.timeline();
initTl.to(lighterWrapper, {
    y: -250, /* Move into frame */
    duration: 2,
    ease: "power3.out",
    delay: 0.5
});

// --- SCENE 1: LIGHTER INTERACTION ---
lighterWrapper.addEventListener('click', () => {
    if (isCandleLit) return;
    isCandleLit = true;

    // Start ambient music
    playAudio(ambientMusic, 0.4);

    // Hide tip
    gsap.to(lighterTip, { opacity: 0, duration: 0.5 });

    const tl = gsap.timeline();

    // 1. Mechanical Lid Open
    tl.call(() => playAudio(sfxLighterOpen))
        .to(lighterLid, { rotation: -110, transformOrigin: "-50px -45px", duration: 0.3, ease: "power2.inOut" })
        .to(lighterWrapper, { y: "-=10", duration: 0.1, yoyo: true, repeat: 1 }, "<"); // slight recoil

    // 2. Strike & Ignite Lighter
    tl.call(() => playAudio(sfxLighterSpark), null, "+=0.2")
        .to(lighterFlame, { opacity: 1, duration: 0.1, ease: "rough" })
        .to(lighterFlame, { scaleY: 1.2, scaleX: 1.1, transformOrigin: "bottom center", yoyo: true, repeat: 5, duration: 0.05 }, "<");

    // 3. Smooth Move towards Candle
    tl.to(lighterWrapper, {
        x: -40,  /* Move left */
        y: "-=220", /* Move up to wick */
        duration: 1.5,
        ease: "power2.inOut"
    });

    // 4. Ignite Candle
    tl.to(candleFlame, { opacity: 1, duration: 0.5 }, "-=0.2")
        .to(ambientCandleGlow, { opacity: 1, duration: 1.5 }, "<")
        .call(() => {
            document.body.classList.add('lit-environment');
            playAudio(sfxFlame, 0.2); // ambient fire sound

            // Candle flicker loop
            gsap.to(candleFlame, {
                scaleY: 1.05, scaleX: 1.02, rotation: () => Math.random() * 2 - 1,
                transformOrigin: "bottom center", duration: 0.1,
                yoyo: true, repeat: -1, ease: "none"
            });
            gsap.to(ambientCandleGlow, {
                scale: 1.05, opacity: 0.8, yoyo: true, repeat: -1, duration: 0.8, ease: "sine.inOut"
            });
        });

    // 5. Lighter Exit
    tl.to(lighterFlame, { opacity: 0, duration: 0.2 }, "+=0.5")
        .to(lighterLid, { rotation: 0, duration: 0.3 }, "<")
        .to(lighterWrapper, { y: "+=600", opacity: 0, duration: 1.5, ease: "power3.in" });

    // 6. Camera Zoom Out & Cake Reveal
    tl.to(mainContainer, { scale: 0.8, y: -50, duration: 2, ease: "power2.inOut" }, "+=0.5")
        .to(candleWrapper, { top: '35%', scale: 0.6, duration: 2, ease: "power3.inOut" }, "<") /* move candle up to rest on cake */
        .to(scene1, { pointerEvents: "none" }, "<")
        .to(scene2, { display: "flex", opacity: 1, duration: 1.5 }, "-=1")
        .call(() => {
            const leftAnim = document.getElementById('bizcocho_1_left_s2');
            const rightAnim = document.getElementById('bizcocho_1_right_s2');
            if (leftAnim) leftAnim.beginElement();
            if (rightAnim) rightAnim.beginElement();
        }, null, "-=0.5")
        .to(knifeWrapper, { opacity: 1, left: '50%', duration: 1.2, ease: "back.out(1.4)" }, "+=8.5")
        .call(initKnifeDrag);
});

// --- SCENE 2: KNIFE DRAGGING ---
function initKnifeDrag() {
    gsap.to(knifeWrapper, { y: 15, yoyo: true, repeat: -1, duration: 1.5, ease: "sine.inOut" });

    // Calculate cake bounds for precise center slicing
    const cakeRect = cakeLeft.getBoundingClientRect();
    const knifeRect = knifeWrapper.getBoundingClientRect();

    // Mobile-optimized bounds calculation for vertical movement
    const isMobile = window.innerWidth <= 768;
    const bounds = isMobile ? {
        top: -100,
        bottom: 200,
        left: -20,
        right: 20
    } : {
        top: -150,
        bottom: 250,
        left: -30,
        right: 30
    };

    Draggable.create(knifeWrapper, {
        type: "y",
        bounds: bounds,
        trigger: knifeWrapper,
        onPress: function () {
            gsap.killTweensOf(knifeWrapper); // stop bounce
            gsap.to(sliceTip, { opacity: 0, duration: 0.3 });
            playAudio(sfxSlice, 0.5); // subtle start sound
        },
        onDrag: function () {
            // physics or particle trails could go here based on this.y
        },
        onDragEnd: function () {
            if (this.y > 100) {
                this.disable();

                // Hide knife
                gsap.to(knifeWrapper, { y: "+=150", opacity: 0, duration: 0.6, ease: "power2.in" });

                // Split Cake
                const splitTl = gsap.timeline();

                // Extinguish candle softly
                splitTl.to(candleFlame, { opacity: 0, scale: 0, duration: 0.2 })
                    .to(ambientCandleGlow, { opacity: 0, duration: 0.5 }, "<")
                    .call(() => stopAudio(sfxFlame))
                    .to(candleWrapper, { opacity: 0, y: "-=30", duration: 0.5 }, "<");

                // Halves separate
                splitTl.to(cakeLeft, { x: -80, rotation: -3, duration: 1.2, ease: "elastic.out(1, 0.7)" }, "<")
                    .to(cakeRight, { x: 80, rotation: 3, duration: 1.2, ease: "elastic.out(1, 0.7)" }, "<")
                    .to('.cake-stand', { scaleX: 1.1, opacity: 0.5, duration: 1 }, "<");

                // Enter Celebration
                splitTl.call(firePremiumCelebration, null, "-=0.8");

                // Show Message with cake behind
                splitTl.to(scene3, { display: "flex", opacity: 1, pointerEvents: "auto", duration: 1.5 }, "+=0.2")
                    .fromTo('.message-box', { y: 50, scale: 0.9, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 1.5, ease: "power3.out" }, "<")
                    .fromTo('.cake-behind', { y: 100, opacity: 0 }, { y: 0, opacity: 0.8, duration: 1.5, ease: "power3.out" }, "<")
                    .fromTo('.cake-stand-behind', { y: 100, opacity: 0 }, { y: 0, opacity: 0.6, duration: 1.5, ease: "power3.out" }, "<")
                    .call(displayFirebaseData, null, "-=1");
            } else {
                // Snap back
                gsap.to(knifeWrapper, { y: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
                gsap.to(knifeWrapper, { y: 15, yoyo: true, repeat: -1, duration: 1.5, ease: "sine.inOut", delay: 0.8 });
                gsap.to(sliceTip, { opacity: 1, duration: 0.3 });
            }
        }
    });
}

// --- SCENE 4: ADVANCED CONFETTI ---
function firePremiumCelebration() {
    playAudio(sfxPop);

    const duration = 5000;
    const end = Date.now() + duration;

    // Golden & Pastel theme confetti
    const colors = ['#d4af37', '#fcf6ba', '#ffb6c1', '#add8e6', '#ffffff'];

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 80,
            origin: { x: 0, y: 0.9 },
            colors: colors,
            zIndex: 100
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 80,
            origin: { x: 1, y: 0.9 },
            colors: colors,
            zIndex: 100
        });

        // Add some random bursts in the middle
        if (Math.random() > 0.8) {
            confetti({
                particleCount: 15,
                spread: 100,
                origin: { x: 0.5, y: 0.5 },
                colors: colors,
                zIndex: 100
            });
        }

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// --- FIREBASE DATA FETCHING ---
async function fetchFirebaseData() {
    try {
        // Check if Firebase is loaded
        if (!window.firebase || !window.firebase.firestore) {
            console.warn('Firebase not loaded, using default data');
            return getDefaultData();
        }

        // Get the document ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const docId = urlParams.get('id');
        
        if (!docId) {
            console.warn('No ID provided, using default data');
            return getDefaultData();
        }

        const docRef = window.db ? window.db.collection('gifts').doc(docId) : firebase.firestore().collection('gifts').doc(docId);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            return {
                receiverName: data.receiverName || 'Friend',
                photoUrl: data.photoURL || null,
                message: data.message || 'Wishing you a wonderful birthday!',
                senderName: data.senderName || 'Your Friend'
            };
        } else {
            console.warn('No document found, using default data');
            return getDefaultData();
        }
    } catch (error) {
        console.error('Error fetching Firebase data:', error);
        return getDefaultData();
    }
}

function getDefaultData() {
    return {
        receiverName: 'Friend',
        photoUrl: null,
        message: 'Wishing you a wonderful birthday!',
        senderName: 'Your Friend'
    };
}

async function displayFirebaseData() {
    const data = await fetchFirebaseData();

    // Update receiver name
    const receiverNameElement = document.getElementById('receiver-name');
    if (receiverNameElement) {
        receiverNameElement.textContent = `Happy Birthday ${data.receiverName}!`;
    }

    // Update custom message
    const messageElement = document.getElementById('custom-message');
    if (messageElement) {
        messageElement.textContent = data.message;
    }

    // Update sender name
    const senderNameElement = document.getElementById('sender-name');
    if (senderNameElement) {
        senderNameElement.textContent = `— ${data.senderName}`;
    }

    // Update photo
    const photoElement = document.getElementById('receiver-photo');
    const photoPlaceholder = document.getElementById('photo-placeholder');

    if (data.photoUrl && photoElement && photoPlaceholder) {
        photoElement.src = data.photoUrl;
        photoElement.style.display = 'block';
        photoPlaceholder.style.display = 'none';
    } else if (photoElement && photoPlaceholder) {
        photoElement.style.display = 'none';
        photoPlaceholder.style.display = 'flex';
    }
}

// --- REPLAY LOGIC ---
document.getElementById('replay-btn').addEventListener('click', () => {
    // Stop all audio
    [sfxLighterOpen, sfxLighterSpark, sfxFlame, sfxSlice, sfxPop, ambientMusic].forEach(stopAudio);

    // Kill all running tweens
    gsap.killTweensOf("*");

    // Reset styles
    gsap.set([scene2, scene3, ambientCandleGlow, candleFlame, lighterFlame], { opacity: 0 });
    gsap.set([scene2, scene3], { display: "none" });
    gsap.set(scene1, { pointerEvents: "auto", opacity: 1 });
    gsap.set(mainContainer, { scale: 1, y: 0 }); // reset zoom

    // Reset Lighter
    gsap.set(lighterWrapper, { y: 0, x: -50, opacity: 1 });
    gsap.set(lighterLid, { rotation: 0 });
    gsap.set(lighterTip, { opacity: 1 });

    // Reset Candle
    gsap.set(candleWrapper, { top: '55%', scale: 1, opacity: 1, y: 0 });

    // Reset Cake
    gsap.set([cakeLeft, cakeRight], { x: 0, rotation: 0 });
    gsap.set('.cake-stand', { scaleX: 1, opacity: 1 });

    // Reset Knife (Horizontal)
    gsap.set(knifeWrapper, { x: 0, y: 15, opacity: 0 });

    // Reset Env
    document.body.classList.remove('lit-environment');
    isCandleLit = false;
    scene3.style.pointerEvents = "none";

    // Re-enter lighter
    gsap.to(lighterWrapper, { y: -250, duration: 1.5, ease: "power3.out" });
});
