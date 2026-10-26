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
