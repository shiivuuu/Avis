# Avis — Assistive AI Vision & Spatial Awareness

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Android](https://img.shields.io/badge/Platform-Android%20%7C%20Web-brightgreen.svg)](https://github.com/shiivuuu/Avis)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Frontend%20Ready-black.svg)](https://vercel.com/new)
[![Render Ready](https://img.shields.io/badge/Render-Backend%20Ready-46E3B7.svg)](https://render.com)

> **An assistive AI vision system designed for blind and low-vision users.**  
> Combines real-time on-device spatial obstacle detection, intelligent directional guidance, document reading, and multimodal visual Q&A.  
> Available as both a **Native Android Application** and an **Instant Web Application** deployable to Vercel and Render.

---

## 🌟 Quick Links & Deployment

| Component | Status | How to Access / Deploy |
| :--- | :---: | :--- |
| **Web App (Vercel)** | 🚀 Ready | [Deploy on Vercel](https://vercel.com/new) (Import `shiivuuu/Avis`, auto-builds from `web/`) |
| **Backend API (Render)** | ⚡ Ready | [Deploy on Render](https://dashboard.render.com) (Connect `shiivuuu/Avis`, auto-detected via `backend/render.yaml`) |
| **Android APK (Native)** | 📱 Built | Download [Avis-debug.apk](https://files.catbox.moe/bso359.apk) (Android 7.0+ `minSdk 24`) |
| **Local Web App** | 💻 Live | `http://localhost:3000` (or `http://<your-wifi-ip>:3000` on phone) |
| **Local Backend** | 🛠️ Live | `http://localhost:3001` (Visual status dashboard at root `/`) |

---

## 🚀 1-Click Deployment Guide

### 1. Deploy Frontend to Vercel (Free)
1. Go to **[vercel.com/new](https://vercel.com/new)** and sign in with GitHub.
2. Select your repository: **`shiivuuu/Avis`** and click **Import**.
3. Keep default settings (Vercel automatically detects the root `vercel.json` and builds the static bundle from `web/`).
4. Click **Deploy**.
5. In ~40 seconds, you get a live global HTTPS link (e.g., `https://avis-web.vercel.app`) that works directly on any mobile browser (Chrome on Android or Safari on iOS) with camera access!

### 2. Deploy Backend to Render (Free)
1. Go to **[dashboard.render.com](https://dashboard.render.com)** and sign in.
2. Click **New +** → **Web Service** → Connect **`shiivuuu/Avis`**.
3. Render automatically reads `backend/render.yaml`:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google AI Studio API key)* or `OPENAI_API_KEY`
5. Click **Create Web Service**. Your backend will be live at `https://your-service.onrender.com`.
6. Paste your Render backend URL into the web app's **AI Assistant** settings tab!

---

## 📱 Three Core Operating Modes

### 1. 🧭 Navigation Mode (100% Offline Edge AI)
* **Real-Time On-Device Object Detection**:
  - Android: Google ML Kit Object Detection in `STREAM_MODE`.
  - Web: TensorFlow.js (`@tensorflow/tfjs`) + COCO-SSD (`@tensorflow-models/coco-ssd`).
  - Runs **100% locally** in the browser or on the phone without sending any video frames to external servers.
* **Spatial Directional Mapping**:
  - Automatically calculates obstacle horizontal center:
    - **Left Zone**: `normalizedCenterX < 0.35`
    - **Ahead Zone**: `0.35 <= normalizedCenterX <= 0.65`
    - **Right Zone**: `normalizedCenterX > 0.65`
* **Alert Cooldown & Priority System**:
  - Prioritizes obstacles directly ahead (2.0s cooldown) over lateral obstacles (3.0s cooldown).
  - Deduplicates repetitive speech announcements to prevent audio clutter.
* **Spatial Radar**:
  - High-contrast visual radar with real-time sector illumination and TalkBack live region announcements.

### 2. 📄 Document Reader Mode
* **Still Image Capture**: Takes high-resolution frames with the device camera.
* **On-Device OCR**:
  - Android: Google ML Kit Latin Text Recognition.
  - Web: In-browser Tesseract.js engine.
* **Read Aloud Controls**:
  - Speaks recognized text naturally with pause, resume, and rate controls.
  - Formats paragraphs and counts detected lines.
* **Voice Command Support**: Hands-free voice triggers (*"Read"*, *"Capture"*, *"Clear"*).

### 3. 🤖 Multimodal AI Visual Assistant
* **Visual Question Answering**: Ask questions about your surroundings (*"What color is this shirt?"*, *"Is there an empty chair ahead?"*).
* **Multimodal Reasoning**: Securely bridges with **Google Gemini 1.5 Flash** or **OpenAI GPT-4o-mini** via the backend.
* **Non-Blocking Architecture**: Cloud requests never interrupt or block local obstacle navigation.
* **Privacy-First**: API keys remain strictly on the backend server.

---

## 🎨 Accessibility-First Design System

Designed specifically to meet WCAG AAA standards for low-vision and screen-reader users:

* **Color Palette**:
  - Background: **Warm Ivory** (`#FDFBF7`) — eliminates high-glare white fatigue.
  - Primary Accents: **Deep Forest Green** (`#1B4332`, `#2D6A4F`) — crisp, natural contrast.
  - Text: **High-Contrast Charcoal** (`#111613`) — **>12:1 contrast ratio**.
  - Warning/Alert: **Crimson Red** (`#931A08`) on pale alert container (`#FBE8E5`).
* **Touch Targets**: Minimum **64px / 64dp** height on all actionable controls.
* **Tactile Feedback**: Haptic vibration confirmations (`navigator.vibrate` / Android HapticFeedback).
* **Screen Reader Semantics**: Complete ARIA live regions (`aria-live="polite"`, `aria-live="assertive"`), semantic buttons, and explicit TalkBack descriptions.

---

## 🛠️ Local Development & Running

### Running the Web Application
```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start local dev server (accessible across your local Wi-Fi network)
npm run dev -- --host 0.0.0.0 --port 3000
```
* On your PC: Open `http://localhost:3000`
* On your phone (same Wi-Fi): Open `http://<your-pc-ip>:3000` (e.g. `http://192.168.1.40:3000`)

### Running the Backend Server
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy example environment configuration
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY (optional for local navigation)

# Start server
npm start
```
* Visual Backend Dashboard: `http://localhost:3001/`
* Health Check Endpoint: `http://localhost:3001/api/health`

### Building the Native Android App
```bash
# Verify unit tests
./gradlew.bat test

# Build debug APK
./gradlew.bat assembleDebug
```
* Output APK: `app/build/outputs/apk/debug/app-debug.apk`

---

## 📡 Backend API Reference

### `GET /`
Returns an interactive HTML status dashboard showing service health, active AI provider, port, and quick links.

### `GET /api/health`
Returns service status for health checks.
```json
{
  "status": "ok",
  "service": "Avis Assistive AI Backend",
  "timestamp": "2026-10-26T14:55:27.266Z",
  "aiProviderConfigured": true,
  "activeProvider": "Gemini"
}
```

### `POST /api/ask`
Receives image frame and user question; forwards to multimodal AI provider.
* **Payload**:
  ```json
  {
    "question": "What is in front of me?",
    "image": "<base64_jpeg_data>"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "answer": "There is a wooden dining chair directly in front of you approximately three feet away.",
    "timestamp": "2026-10-26T14:55:30.000Z"
  }
  ```

---

## 🏆 3-Minute Hackathon Winning Pitch Script

```text
[0:00 - 1:00] THE HOOK & THE PROBLEM:
"Judges, over 2.2 billion people live with vision impairment. While the traditional white 
cane is essential, it only sweeps the ground. It cannot tell a user if a chair is pulled out 
ahead, if a person is approaching on the right, or what is written on a door sign.
Meet Avis — an assistive AI vision system that provides real-time spatial obstacle radar, 
on-device document reading, and a multimodal visual assistant."

[1:00 - 2:00] LIVE DEMO:
1. Spatial Navigation: (Hold phone up)
   "Notice the spatial radar. When I pan toward a chair, Avis announces: 'Furniture directly ahead.'
   Our custom cooldown algorithm ensures it doesn't spam the user with audio chatter."
2. Document Mode:
   "I switch to Document Reader, capture this badge, and in under one second, Avis reads the 
   text aloud using on-device OCR — completely offline."
3. AI Assistant:
   "For complex questions, I can speak hands-free: 'What color is this item?' and receive 
   a direct multimodal response."

[2:00 - 3:00] TECHNICAL DEPTH & ARCHITECTURE:
"Avis runs edge AI vision locally on the device with zero cloud lag, zero server costs, and 
100% privacy. The UI is engineered to WCAG AAA standards with a warm ivory and deep forest green 
palette that eliminates ocular fatigue. Avis gives independence back to low-vision users."
```

---

## 🚦 Safety Notice

> **Important Safety Note**:
> 1. Bounding-box positions correspond strictly to the 2D angular field of view of the camera sensor. They **do not** measure physical 3D distance.
> 2. Generic on-device object detection **does not guarantee detection of overhead hazards** (e.g. low tree branches, overhead beams, wires) or negative drop-offs (stairs without risers, open pits).
> 3. Users should always use their white cane or guide dog as their primary mobility aid.

---

## 📄 License
This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.
