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

---

## 📐 5. Fixed Frame Layout Guidelines (Game-Style UI)

### Purpose

This project uses a **game-style fixed frame layout**. The UI must behave like a **single locked scene** where all elements maintain their relative positions. The layout **must never reflow or rearrange based on screen size**. Instead, the **entire interface scales uniformly** to fit the screen.

This ensures consistent visual structure across all devices.

---

### Core Principle

The UI is designed using a **single fixed resolution coordinate system**.

Example base resolution:

```
1920 × 1080
```

All UI components must be positioned relative to this coordinate system.

When the screen size changes:

```
UI elements DO NOT move
UI elements DO NOT wrap
UI elements DO NOT resize independently
```

Only the **entire frame scales proportionally**.

---

### Layout Architecture

The interface must follow this structure:

```
Viewport
└── Game Wrapper (centers frame)
    └── Game Frame (fixed resolution)
        ├── UI Element
        ├── UI Element
        └── UI Element
```

#### Required DOM Structure

```html
<body>
  <div id="game-wrapper">
    <div id="game-frame">

      <!-- All UI elements must exist inside this frame -->

    </div>
  </div>
</body>
```

---

### Game Frame Rules

The game frame defines the **design coordinate space**.

Example:

```css
#game-frame {
  width: 1920px;
  height: 1080px;
  position: relative;
}
```

All child elements must use:

```
position: absolute
```

Example:

```css
.score-panel {
  position: absolute;
  top: 40px;
  right: 60px;
}
```

This ensures elements remain **locked to their designed coordinates**.

---

### Scaling Behavior

The entire frame must scale using a **uniform transform**.

```
scale = min(screenWidth / baseWidth, screenHeight / baseHeight)
```

Example implementation:

```javascript
function scaleGame() {
  const frame = document.getElementById("game-frame");

  const scaleX = window.innerWidth / 1920;
  const scaleY = window.innerHeight / 1080;

  const scale = Math.min(scaleX, scaleY);

  frame.style.transform = `scale(${scale})`;
}

window.addEventListener("resize", scaleGame);
scaleGame();
```

This guarantees:

* Correct aspect ratio
* Consistent UI placement
* No element drift

---

### Wrapper Responsibilities

The wrapper centers the scaled frame inside the viewport.

```css
#game-wrapper {
  width: 100vw;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;

  overflow: hidden;
}
```

---

### Prohibited Layout Techniques

The following techniques **must not be used inside the game frame** because they break positional consistency.

❌ Responsive breakpoints for UI positioning
❌ Flexbox layout for primary UI placement
❌ Grid layout for main structure
❌ Percentage-based positioning
❌ Dynamic element scaling independent of frame

Only the **frame itself may scale**.

---

### Allowed Usage of Flex/Grid

Flexbox or grid can be used **inside components**, for example:

```
inventory panel
dialog box
menu list
```

But **never for overall UI placement inside the frame**.

---

### Aspect Ratio Behavior

The application preserves the base aspect ratio.

If the screen does not match the ratio, **letterboxing occurs**.

Example:

```
Ultrawide monitor → side padding
Mobile device → top/bottom padding
```

The frame must **never stretch** to fill the viewport.

---

### Coordinate System Guidelines

Design positions using the frame coordinate space.

Example positions:

```
Top Left:     (0,0)
Top Right:    (1920,0)
Bottom Left:  (0,1080)
Bottom Right: (1920,1080)
Center:       (960,540)
```

This allows consistent layout planning.

---

### Design Philosophy

The interface should behave like a **game scene**, not a responsive webpage.

Key characteristics:

* Stable layout
* Deterministic positioning
* Device-independent scaling
* No layout drift

The visual hierarchy must remain identical across all screen sizes.

---

### Summary

UI behavior rules:

```
Elements stay fixed relative to each other
The frame scales uniformly
Aspect ratio is preserved
No responsive reflow occurs
```

Think of the interface as a **camera zooming in/out of a game scene** rather than a webpage rearranging itself.
