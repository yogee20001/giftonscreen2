# GiftOnScreen — Complete Multi-Step Instructions

## Step 1: The Gallery (Entry State)
- The root `index.html` must first check for a URL `id`.
- If NO `id` is present, display the Occasion Gallery (as seen in Screenshot 20).
- Users must select an Occasion (e.g., Birthday) -> then select a Template Theme (e.g., "Neon" or "Soft").

## Step 2: The Editor (Selection State)
- Once a template is selected, hide the Gallery and reveal the **Split-Screen Editor**.
- **Left:** Form for Receiver Name, Sender Name, Message, Photo, and Audio.
- **Right:** An Ultra-Lite Static Preview that mimics the chosen template's CSS.
- **Real-time Sync:** Use JS to mirror form inputs into the Preview instantly.
- **Mandatory Compression:** Use Browser Canvas API to shrink photos to <500KB before upload.

## Step 3: The Renderer (Viewer Mode)
- If URL has `?id=GIFT-XXXXXXXX`, bypass Gallery/Editor.
- **Validation:** Check format `GIFT-[Alphanumeric]`.
- **Status Check:** - Fetch from Firestore. 
    - If `status == "pending"`, show "Activation Required" + WhatsApp link.
    - If `status == "active"`, fetch HTML from `/templates/[path]/index.html`.
- **Data Injection:** Find `[data-receiver]`, `[data-sender]`, `[data-message]`, and `<img data-photo>` to inject user content.

## Step 4: Admin Activation
- Create `/admin.html` (Firebase Auth protected).
- List "pending" documents.
- Provide a "Switch to Active" button to update Firestore.

## Step 5: Technical Constraints
- No system logic or Firebase calls inside Template HTML files.
- Hard Fail: If ID is wrong or data missing, show only "Gift not found."
- Mobile-First: All designs must be responsive and "game-like" (fixed ratio).

## 🎁 GiftOnScreen: Premium Design Guidelines

### 1. Visual Philosophy (The "Atmosphere")

* **Negative Space:** Maintain a minimalist aesthetic; prioritize "dark space" and breathing room to let the central message shine.
* **Immersive Effects:** Use subtle, non-distracting motion (e.g., floating SVGs or soft bokeh) to create a "living" digital canvas.
* **Micro-interactions:** Every button and card must have a tactile response, such as soft glows or subtle $1.05\times$ scaling on hover.

### 2. The "Unboxing" Reveal

* **Sequenced Content:** Do not display the gift all at once. Implement a "Tap to Open" or animated envelope entrance to create an emotional "unboxing" moment.
* **Audio Orchestration:** Music must fade in gently and be synchronized with the appearance of the main visual elements.

### 3. Tactile UI & Performance

* **Fixed Aspect Ratio:** All templates must use a fixed-ratio, "game-like" view to ensure perfect framing on every mobile device.
* **Zero Latency:** High-fidelity media must be pre-processed; use the browser's Canvas API to compress images to under **500KB** before saving.
* **Premium Fonts:** Use high-end typography (e.g., modern serifs or elegant handwriting fonts) specifically for recipient and sender names.

---

## 🛠️ Technical Implementation Flow

### Phase 1: Gallery & Selection

* **State 1:** Display the "Occasion Gallery" (Screenshot 20 style).
* **State 2:** Reveal sub-themes (e.g., "Neon B-Day," "Vintage Rose") after an occasion is selected.

### Phase 2: The Logic Engine

* **ID Validation:** Strictly follow the `GIFT-XXXXXXXX` alphanumeric format.
* **Activation Gate:** Gifts with `status: "pending"` must redirect to the WhatsApp activation screen.
* **Live Preview:** The editor must feature a "Lite Shell" that mirrors user input (text/photo) in real-time before submission.

### Phase 3: Deployment

* **Host:** Cloudflare Pages.
* **Database:** Firebase Firestore.
* **Design Tool:** Stitch AI (for base HTML/Tailwind exports).

---

### **How to Update in Antigravity**

1. Open `README.md` in your sidebar.
2. Select all text and replace it with the guidelines above.
3. **Pro Tip:** After saving, tell your Antigravity Agent: *"Please read the updated `README.md`. These are the strict qualities all future templates and code must adhere to."*

**Would you like me to generate the "Unboxing" transition code (HTML/CSS) for your first premium template?**