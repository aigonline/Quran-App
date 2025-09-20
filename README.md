# 🕌 Quran App - Read & Listen

A beautiful, full-featured Quran application built with Next.js 14, TypeScript, and Tailwind CSS. Features a stunning white theme with dark brown accents and complete dark mode support.

## ✨ Features

- 📖 **Complete Quran Reading**: All 114 Surahs with Arabic text and English translations
- 🎵 **Audio Playback**: Listen to Quran recitations with full audio controls
- 🌙 **Dark Mode**: Beautiful light and dark themes with smooth transitions
- 🔍 **Search Functionality**: Search through verses and surahs instantly
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🎨 **Elegant UI**: White body with dark brown navigation and accents
- ⚡ **Fast Performance**: Built with Next.js 14 and optimized for speed
- ⚙️ **Customizable Settings**: Choose reciters, translators, display modes, and font sizes

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/quran-app)

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quran-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: Quran Foundation API (api.alquran.cloud)
- **Audio**: HTML5 Audio with custom controls

## 📁 Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles with Tailwind
│   ├── layout.tsx      # Root layout with providers
│   └── page.tsx        # Homepage
├── components/         # React components
│   ├── audio-player.tsx     # Audio player with controls
│   ├── navigation.tsx       # Header navigation with search
│   ├── quran-provider.tsx   # Context for Quran data
│   ├── quran-reader.tsx     # Main reading interface
│   ├── sidebar.tsx          # Surah navigation sidebar
│   └── theme-provider.tsx   # Dark mode context
└── lib/               # Utilities and API
    └── quran-api.ts   # API functions for Quran data
```

## 🎨 Design System

### Colors
- **Primary**: Dark Brown (`brown-900`, `brown-950`)
- **Background**: White (light mode) / Dark Gray (dark mode)
- **Accents**: Brown shades (`brown-50` to `brown-900`)
- **Text**: High contrast for excellent readability

### Typography
- **Arabic**: Amiri font for beautiful Arabic text rendering
- **UI**: Inter font for clean, modern interface
- **Sizes**: Responsive typography scale

## 🔧 API Integration

The app supports **dual API integration** with automatic fallback:

### Primary: Quran Foundation API (Authenticated)
- **Endpoint**: https://api.quran.foundation/v1
- **OAuth2**: https://prelive-oauth2.quran.foundation
- **Client ID**: Configured via environment variables
- **Features**: Full authenticated access to premium content

### Fallback: Public API
- **Endpoint**: https://api.alquran.cloud/v1  
- **Access**: Public, no authentication required
- **Purpose**: Ensures app functionality even if primary API is unavailable

### Environment Configuration (Optional)

**The app works perfectly without any configuration!** It automatically uses reliable public APIs.

If you want to use the Quran Foundation API v4 (optional), create a `.env.local` file:

```env
# Optional: Quran Foundation API v4 credentials
NEXT_PUBLIC_QURAN_CLIENT_ID=your_client_id
QURAN_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_QURAN_TOKEN_ENDPOINT=https://oauth2.quran.foundation/oauth/token
NEXT_PUBLIC_QURAN_API_BASE_URL=https://apis.quran.foundation/content/api/v4

# Fallback API (automatically used)
NEXT_PUBLIC_FALLBACK_API_URL=https://api.alquran.cloud/v1
```

> **Note**: Copy `.env.example` to `.env.local` and add your credentials if needed.

## 🚀 Production Deployment

### Deploy to Vercel (Recommended)

1. **Fork this repository** to your GitHub account

2. **Deploy to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your forked repository  
   - Vercel will automatically detect Next.js and deploy

3. **Optional Environment Variables** (if using Quran Foundation API):
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add the variables from `.env.example` if needed
   - The app works without these!

### Deploy to Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `out`
3. **Add environment variables** in Netlify dashboard if needed

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Railway
- Render  
- Digital Ocean App Platform
- Any platform supporting Node.js/Next.js

### API Features:
- **OAuth2 Token Management**: Automatic token refresh and fallback
- **Smart Fallback**: Seamless switch to public API if authentication fails
- **Status Indicator**: Real-time API status in navigation
- **Authenticated Audio**: Premium audio content when available

## 📱 Features in Detail

### Reading Experience
- Beautiful Arabic text with proper RTL support
- Verse-by-verse navigation
- Toggle translations and transliterations
- Verse highlighting and selection

### Audio Player
- Play/pause controls for each verse
- Volume control and muting
- Progress bar with seeking
- Auto-advance to next verse
- Previous/next verse navigation

### Search
- Real-time search as you type
- Search results with verse previews
- Navigate directly to search results
- Clear search functionality

### Dark Mode
- System preference detection
- Manual toggle in navigation
- Smooth transitions between themes
- Persistent theme selection

## 🚀 Deployment

Build the application for production:

```bash
npm run build
npm start
```

The app can be deployed on any platform that supports Next.js:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Docker containers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Quran Foundation for the comprehensive API
- Islamic community for guidance and feedback
- Open source contributors and maintainers

---

**Made with ❤️ for the Muslim community**