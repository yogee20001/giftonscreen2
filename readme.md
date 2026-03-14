# GiftOnScreen ✨

Premium Digital Gift Expression Platform

## Overview

GiftOnScreen transforms heartfelt messages into immersive digital gift experiences. Create stunning, personalized gift moments that last forever and share them instantly via WhatsApp, SMS, email, or any social platform.

## Features

### 🎁 Core Platform
- **Beautiful Themes** - 50+ professionally designed templates for every occasion
- **Photo Integration** - Add personal photos to create meaningful experiences  
- **Easy Sharing** - Share instantly via WhatsApp, SMS, email, or social platforms
- **Private & Secure** - Encrypted messages with complete privacy
- **Mobile First** - Works beautifully on any device
- **Lasts Forever** - Digital creations preserved as timeless memories

### 🎂 Birthday Templates
1. **Premium Candle** - Ultra-premium cinematic experience with interactive candle and cake
2. **Chocolate Break** - Decadent chocolate-themed surprise with interactive unwrapping
3. **Cosmic Birthday** - Magical cosmic journey through the universe
4. **SVG Cake** - Elegant animated cake with floating candles

### 🛠 Admin Dashboard
- Gift activation management
- Real-time status tracking
- Asset upload hub with Cloudinary integration
- Gift database management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, Tailwind CSS, Vanilla JavaScript |
| Backend | Firebase (Firestore, Auth, Storage) |
| Image Storage | Cloudinary |
| Animations | CSS Keyframes, Web Animations API |
| Icons | Phosphor Icons |
| Fonts | Google Fonts (Playfair Display, Manrope, Great Vibes, Cormorant Garamond) |

## Project Structure

```
├── index.html           # Main landing page
├── app.js               # Core application logic
├── admin.html           # Admin dashboard
├── admin.js             # Admin functionality
├── firebase-config.js   # Firebase configuration
├── style.css            # Global styles
├── package.json         # Dependencies
├── firebase.json        # Firebase config
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
├── templates/           # Gift templates
│   └── bday/
│       ├── candle/
│       ├── chocolate-break/
│       ├── cosmic-birthday/
│       └── svg-cake/
├── assets-upload.html    # Asset upload page
├── branding-test.html   # Branding test page
├── qr-code.html         # QR code generator
└── logo.png/webp        # Brand logos
```

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- Cloudinary account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yogee20001/giftonscreen2.git
cd giftonscreen2
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore, Authentication, and Storage
   - Copy your config to `firebase-config.js`

4. Configure Cloudinary:
   - Create a Cloudinary account
   - Create an upload preset named `gift_photos`
   - Update `CLOUDINARY_CLOUD_NAME` in `app.js`

5. Deploy to Firebase Hosting:
```bash
npx firebase deploy
```

### Development Server
Serve locally using any static server:
```bash
npx serve .
# or
npx http-server -p 8080
```

## User Flow

### Creating a Gift
1. Visit the website and click "Create Your Gift"
2. Select occasion (Birthday, Anniversary, Just Because, Celebrate)
3. Choose a theme/template
4. Enter recipient name, sender name, and message
5. Optionally upload a photo
6. Generate private link
7. Activate via WhatsApp notification

### Viewing a Gift
1. Receive gift link via sharing
2. Click link to open experience
3. Interact with the animated gift
4. Optionally capture and share to Instagram Story

## Template System

Each template is a self-contained HTML/CSS/JS experience with:

- **Interactive Scenes** - Multi-step reveals and animations
- **Personalization** - Dynamic data injection (names, photos, messages)
- **Capture Mode** - Generate static images for sharing
- **Responsive Design** - Mobile-first 9:16 aspect ratio

### Template Data Structure
```javascript
{
  receiver: "Recipient Name",
  sender: "Sender Name", 
  message: "Your heartfelt message",
  photoUrl: "https://..." // Optional photo
}
```

## Firebase Collections

### `gifts`
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique gift ID (GIFT-XXXXX) |
| receiver | string | Recipient's name |
| sender | string | Sender's name |
| message | string | Personal message |
| photoUrl | string | Cloudinary image URL |
| template | string | Template ID |
| occasionId | string | Occasion category |
| status | string | pending/active |
| createdAt | timestamp | Creation time |

## API Integrations

### Cloudinary
- Image compression and optimization
- Automatic WebP conversion
- CDN delivery

### WhatsApp
- Share links directly
- Admin notification for activations

## Security Rules

### Firestore Rules
- Read: Anyone with valid gift ID
- Write: Admin only
- User data: Owner only

### Storage Rules
- Authenticated uploads only
- Image files only
- Size limit: 5MB

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## Performance

- Lazy-loaded templates
- Compressed images (<500KB)
- CSS animations (GPU accelerated)
- Service worker ready

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## License

MIT License - See LICENSE file

## Support

- Email: hello@giftonscreen.com
- WhatsApp: +91 6394460784
- Website: https://giftonscreen.com

## Credits

- Built with ❤️
- Powered by Firebase & Cloudinary
- Icons by Phosphor Icons
- Fonts by Google Fonts

---

© 2024 GiftOnScreen. All rights reserved.
