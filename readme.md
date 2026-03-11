# 🎁 GiftOnScreen | Project Manifest & Technical Standards

This document is the "Source of Truth" for the **GiftOnScreen** platform. All development, whether manual or AI-generated (via Antigravity), must strictly adhere to these architectural and design rules.

---

## 🏗️ 1. System Architecture (The 4-Step Flow)

### Step 1: The Gallery (Entry State)
- **Logic:** The root `index.html` checks for a URL parameter `?id=`.
- **Empty State:** If NO ID is present, render the **Occasion Gallery**.
- **User Path:** Select Occasion (e.g., Birthday) → Select Template Theme (e.g., "Neon" or "Soft").

### Step 2: The Editor (Selection State)
- **UI:** Hide Gallery, reveal the **Split-Screen Editor**.
- **Left Side (Form):** Inputs for Receiver Name, Sender Name, Message, Photo, and Audio selection.
- **Right Side (Preview):** An **Ultra-Lite Static Preview** mirroring the chosen template's CSS.
- **Real-time Sync:** JavaScript must mirror form inputs into the Preview instantly.
- **Mandatory Compression:** Use Browser Canvas API to shrink photos to **<500KB** before Firestore upload.

### Step 3: The Renderer (Viewer Mode)
- **Validation:** If URL has `?id=GIFT-XXXXXXXX`, bypass Gallery/Editor. Check format: `GIFT-[Alphanumeric]`.
- **Status Check (Firestore):**
    - If `status == "pending"`: Show "Activation Required" + WhatsApp link.
    - If `status == "active"`: Fetch HTML from `/templates/[path]/index.html`.
- **Data Injection:** Find elements with `[data-receiver]`, `[data-sender]`, `[data-message]`, and `<img data-photo>` to inject user content dynamically.

### Step 4: Admin Activation
- **Location:** `/admin.html` (Firebase Auth Protected).
- **Function:** List "pending" documents and provide a "Switch to Active" button to update Firestore status.

---

## 📐 2. Premium Design Guidelines

### Visual Philosophy ("The Atmosphere")
* **Negative Space:** Minimalist aesthetic; prioritize "dark space" to let central messages shine.
* **Immersive Effects:** Use subtle motion (floating SVGs/soft bokeh) for a "living" canvas.
* **Micro-interactions:** Buttons/cards must have tactile responses (soft glows or $1.05\times$ scaling).

### The "Unboxing" Sequence
Templates must follow a **Three-Act Storyboard**:
1.  **Act I (The Hook):** "Tap to Open" cover (e.g., an animated envelope or unlit candle).
2.  **Act II (The Engagement):** A game-like gesture (Drag/Slide/Rotate) to "unlock" the gift.
3.  **Act III (The Reveal):** Cinematic display of personalized content with audio fade-in.

---

## 🛠️ 3. Development & File Structure (Antigravity Protocol)

To ensure high performance and portability, all templates must follow these strict rules:

### Single-File Architecture
- **Portable HTML:** Every template must be a **single `index.html`** file.
- **Embedded Assets:** - Include all CSS within a `<style>` tag in the `<head>`.
    - Include all JS logic within a `<script>` tag at the end of the `<body>`.
- **No System Logic:** Templates must NOT contain Firebase calls. They are "dumb shells" that accept data via the Renderer.

### Asset Localization
- **Folder Scoping:** Each template resides in its own folder: `/templates/[template-name]/`.
- **Self-Contained:** All images/audio/lottie files must be placed in that same folder.
- **Relative Paths:** Always use `./asset-name.webp` for assets.

### Technical Geometry
- **Fixed Aspect Ratio:** Strictly **9:16 (Vertical)** view.
- **Safe Zones:** Keep interactive triggers **15%** away from top/bottom edges.
- **No Scrolling:** Use `touch-action: none` and `overflow: hidden` on the main container.

---

## 🎨 4. Global CSS Boilerplate
Use these variables in every template for cross-platform consistency:

```css
:root {
  --canvas-ratio: 9/16;
  --safe-area-padding: 20px;
  --primary-accent: #FFD700; /* Gold */
  --transition-speed: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --glass-bg: rgba(255, 255, 255, 0.2);
}

.gift-container {
  aspect-ratio: var(--canvas-ratio);
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  touch-action: none;
}