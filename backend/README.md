# Avis Multimodal AI Vision Backend

A lightweight Node.js/Express service that bridges Avis on Android with vision-capable multimodal AI models (Google Gemini 1.5 Flash or OpenAI GPT-4o-mini).

## Features
- `GET /api/health`: Health check and provider status
- `POST /api/ask`: Takes base64 image + question prompt, returns concise contextual answers
- Keeps API secret keys securely on the backend server
- Non-blocking design: local obstacle navigation and local OCR on the Android phone remain 100% operational even if the backend is offline or unconfigured
- 25MB request payload limit for camera photos
- 20-second request timeout with graceful error handling

## Quick Start

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env and paste your GEMINI_API_KEY or OPENAI_API_KEY
   ```

3. Start server:
   ```bash
   npm start
   ```

4. Verify health:
   ```bash
   curl http://localhost:3001/api/health
   ```

## Android Client Connectivity
- **Android Emulator**: Uses `http://10.0.2.2:3001` automatically.
- **Physical Device**: Connect phone and computer to the same Wi-Fi network, and use `http://<YOUR_COMPUTER_IP>:3001`.
