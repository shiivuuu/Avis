const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allow payloads up to 25MB for high-resolution base64 camera frames
app.use(cors());
app.use(express.json({ limit: '25mb' }));

/**
 * GET /
 * Root visual dashboard for browser inspection
 */
app.get('/', (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const provider = hasGemini ? 'Google Gemini 1.5 Flash' : hasOpenAI ? 'OpenAI GPT-4o-mini' : 'None (Offline Local Mode)';

  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Avis Backend Status</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #FDFBF7;
      color: #111613;
      padding: 2rem;
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #F4EFE6;
      border: 2px solid #DDD5C7;
      border-radius: 1.25rem;
      padding: 2rem;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #D8F3DC;
      color: #1B4332;
      font-weight: 700;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.875rem;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #157347;
      border-radius: 50%;
    }
    h1 {
      color: #1B4332;
      font-size: 1.75rem;
      margin: 1rem 0 0.5rem 0;
      font-weight: 900;
    }
    p {
      color: #37433B;
      line-height: 1.5;
      margin: 0.25rem 0;
    }
    .endpoints {
      background: #FFFFFF;
      border: 1px solid #DDD5C7;
      border-radius: 0.75rem;
      padding: 1rem;
      margin: 1.5rem 0;
      font-family: monospace;
      font-size: 0.9rem;
    }
    .endpoint-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .endpoint-row:last-child {
      margin-bottom: 0;
    }
    .method {
      font-weight: bold;
      color: #1B4332;
    }
    a {
      color: #2D6A4F;
      font-weight: 600;
      text-decoration: underline;
    }
    .btn {
      display: block;
      text-align: center;
      background: #1B4332;
      color: white;
      text-decoration: none;
      padding: 0.85rem;
      border-radius: 0.75rem;
      font-weight: bold;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="dot"></span>
      SERVICE ONLINE
    </div>
    <h1>Avis AI Vision Backend</h1>
    <p>The multimodal assistant API service is running and ready to accept requests.</p>

    <div class="endpoints">
      <div class="endpoint-row">
        <span class="method">GET /api/health</span>
        <a href="/api/health" target="_blank">Test Health Check</a>
      </div>
      <div class="endpoint-row">
        <span class="method">POST /api/ask</span>
        <span>Multimodal Q&amp;A</span>
      </div>
    </div>

    <p><strong>Configured AI Provider:</strong> ${provider}</p>
    <p><strong>Port:</strong> ${PORT}</p>

    <a href="http://${req.hostname}:3000" class="btn">Open Avis Web Application &rarr;</a>
  </div>
</body>
</html>
  `);
});

/**
 * GET /api/health
 * Health check endpoint for client availability polling.
 */
app.get('/api/health', (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  res.status(200).json({
    status: 'ok',
    service: 'Avis Assistive AI Backend',
    timestamp: new Date().toISOString(),
    aiProviderConfigured: hasGemini || hasOpenAI,
    activeProvider: hasGemini ? 'Gemini' : hasOpenAI ? 'OpenAI' : 'None'
  });
});

/**
 * POST /api/ask
 * Accepts an image (base64) and question (string) and forwards to a vision-capable AI provider.
 */
app.post('/api/ask', async (req, res) => {
  try {
    const { image, question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a non-empty string.'
      });
    }

    if (!image || typeof image !== 'string' || image.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required as a base64 encoded string.'
      });
    }

    // Strip data URI header if present
    const cleanBase64 = image.replace(/^data:image\/[a-z]+;base64,/, '');

    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !openAiKey) {
      return res.status(503).json({
        success: false,
        error: 'No AI provider API key configured on server. Please configure GEMINI_API_KEY or OPENAI_API_KEY in backend/.env. Local on-device navigation and OCR remain fully functional.'
      });
    }

    let answer = null;

    if (geminiKey) {
      answer = await queryGeminiVision(cleanBase64, question.trim(), geminiKey);
    } else if (openAiKey) {
      answer = await queryOpenAiVision(cleanBase64, question.trim(), openAiKey);
    }

    return res.status(200).json({
      success: true,
      answer: answer,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing /api/ask:', error.message);
    const status = error.name === 'AbortError' ? 504 : 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'An error occurred while contacting the multimodal vision provider.'
    });
  }
});

/**
 * Forwards to Google Gemini 1.5 Flash
 */
async function queryGeminiVision(base64Image, question, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: `You are Avis, an assistive AI vision assistant for a blind or low-vision user. Answer this user's question clearly, concisely, and helpfully based on what you see in the provided image. Be descriptive yet direct. Question: ${question}` },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      throw new Error('Gemini API returned an empty or filtered response.');
    }

    return candidate.trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Forwards to OpenAI GPT-4o-mini
 */
async function queryOpenAiVision(base64Image, question, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Avis, an assistive vision assistant for a blind or low-vision user. Keep responses clear, concise, objective, and friendly.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: 'low'
              }
            }
          ]
        }
      ],
      max_tokens: 300
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;

    if (!message) {
      throw new Error('OpenAI API returned an empty response.');
    }

    return message.trim();
  } finally {
    clearTimeout(timeout);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Avis Backend] Service listening on port ${PORT}`);
  console.log(`[Avis Backend] Health endpoint: http://localhost:${PORT}/api/health`);
});
