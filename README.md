# Avis — Assistive AI Vision & Spatial Awareness

> **An assistive AI vision system for blind and low-vision users.**  
> Available as a native **Android application** and a **Web application** (deployable to Vercel & Render) with on-device camera vision, real-time spatial obstacle radar, document OCR reader, and multimodal visual assistant.

---

## 🌟 Deploy in 1 Click (Web & Cloud)

### 1. Frontend on Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)**.
2. Sign in with GitHub and select your repository: **`shiivuuu/Avis`**.
3. Keep default settings (Vercel automatically detects `vercel.json` and builds from `web/`).
4. Click **Deploy**. Your web app will be live with an HTTPS link (e.g. `https://avis-web.vercel.app`) that works directly on any mobile browser (Chrome on Android, Safari on iPhone) with camera access!

### 2. Backend on Render
1. Go to **[render.com](https://render.com)** and sign in.
2. Click **New +** → **Web Service** → Connect **`shiivuuu/Avis`**.
3. Render automatically picks up `backend/render.yaml` (Root directory: `backend`, Build: `npm install`, Start: `npm start`).
4. Under Environment Variables, add your **`GEMINI_API_KEY`** (or `OPENAI_API_KEY`).
5. Click **Create Web Service**. Your backend will be live at `https://avis-backend.onrender.com`.

---

## 📱 Web Features (Runs directly in Phone Browser)
- **Zero-Install Navigation**: Open the website in mobile Chrome/Safari, allow camera access, and tap **START NAVIGATION**.
- **Real On-Device Object Detection**: TensorFlow.js + COCO-SSD runs locally inside your browser without sending video frames over the internet.
- **Directional Awareness**: Maps obstacles to **Left (<35%)**, **Ahead (35%–65%)**, and **Right (>65%)**.
- **Alert Cooldown System**: Prioritizes center obstacles and throttles announcements to prevent cognitive overload.
- **Document Reader**: Still photo capture + on-device OCR with Text-To-Speech read aloud.
- **AI Visual Assistant**: Hands-free voice query via Web Speech API and backend multimodal reasoning.

---

## 🤖 Native Android MVP
For native Android deployment, the project includes complete native Kotlin + Jetpack Compose source code, CameraX, ML Kit on-device vision, and a prebuilt debug APK:
- **Build APK**: `./gradlew.bat assembleDebug`
- **Unit Tests**: `./gradlew.bat test`
- **Output**: `app/build/outputs/apk/debug/app-debug.apk` (Supports Android 7.0+ `minSdk 24`).

---

## 🚦 Safety Notice
1. Bounding-box position reflects 2D angular field of view, not physical 3D distance.
2. Generic camera vision does not detect overhead branches or steps/drop-offs.
3. Users should always rely primarily on their white cane or guide dog.
