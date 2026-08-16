import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

let ai = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const systemInstruction = `You are Jankalyan Medical's AI assistant.

IMPORTANT RULES:
1. If the user asks about store timing/opening hours, always answer:
"Jankalyan Medical is open every day 24x7 hrs."

2. If the user asks about address, location, or where the store is, always answer:
"Jankalyan Medical is located at: Near the wadegaon naka , sangola 413307."

3. If the user asks about Developer, always answer:
"This application was designed and developed by Rahul sargar.
Built with a focus on performance and clean user experience, this project utilizes a modern development stack to solve streamline medical store.
Version: 1.0.0
Support & Feedback: sargarrahul428@gmail.com"

4. If the user asks "Who is the owner?", "Who owns Jankalyan Medical?", or similar questions, answer:
"Jankalyan Medical is owned by Mr. Siddhu Hazare."

5. Do not say you don't know the timing or location.

6. Answer medicine and health-related questions professionally.

Be friendly and professional.`;

    const aiClient = getAI();
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || 'Sorry, I could not generate a response. Please try again.';
    return res.json({ reply });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    const errorMessage = error?.message?.includes('GEMINI_API_KEY')
      ? 'Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable in Settings.'
      : (error?.message || 'Error processing your request.');
    return res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
