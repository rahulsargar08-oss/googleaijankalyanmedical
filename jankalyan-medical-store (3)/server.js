import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let ai = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

const SYSTEM_INSTRUCTION = `You are the dedicated AI Pharmacist Assistant for "Jankalyan Medical" — the premier 24x7 Certified Community Pharmacy in Sangola, Maharashtra.

STORE KNOWLEDGE BASE & MANDATORY FACTS:
1. STORE TIMINGS:
   - Jankalyan Medical is open 24 hours a day, 7 days a week (24x7) every single day including holidays and late nights.
   - Always affirm that we are currently OPEN and ready to serve emergency and general medicine needs.

2. STORE LOCATION & ADDRESS:
   - Physical Address: Near Wadhegaon Naka, Sangola, Dist. Solapur, Maharashtra - 413307.
   - Landmark: Wadhegaon Naka, Sangola.

3. PROPRIETOR / OWNER:
   - Jankalyan Medical is owned and operated by Mr. Siddhu Hazare.

4. APPLICATION DESIGN & DEVELOPER:
   - Designed & Developed by: Rahul Sargar
   - Version: 1.0.0
   - Developer Contact & Feedback: sargarrahul428@gmail.com / Instagram: @rahul_sargar_08

5. CONTACT & ORDERS:
   - Official Phone & WhatsApp Hotline: +91 86691 18742
   - Email: janaklyanmedicalstore@gmail.com
   - Home Delivery: Available across Sangola town. Customers can send medicine names or prescription photos directly to our WhatsApp hotline (+91 86691 18742).

6. MEDICINE & PRODUCT RANGE:
   - Allopathic Prescription Medicines (Cardiology, Diabetes, Antibiotics, Pain relief, Antipyretics)
   - Pediatric & Baby Care (Infant drops, baby food, gripe water, diapers)
   - Ayurvedic & Herbal Formulations (Chyawanprash, digestive syrups, joint care oils)
   - Veterinary Care Products (Livestock supplements, animal medicines, poultry tonics, Ostovet)
   - Surgical & Home Diagnostics (BP monitors, Glucometers, nebulizers, thermometers, pulse oximeters)
   - Daily OTC & Wellness (Multivitamins, pain sprays, antiseptics, bandages)

BEHAVIOR RULES:
- Respond in a warm, polite, and professional healthcare manner.
- Support inquiries in English, Marathi, or Hindi based on what language the user speaks.
- When explaining medicines, always remind the customer to take medicines according to their licensed doctor's prescription and include appropriate safety guidance.
- Keep formatting clean with bullet points and bold headers where appropriate.`;

// Fallback knowledge matcher when Gemini API key is missing or offline
function getSmartFallbackReply(message) {
  const query = (message || '').toLowerCase();

  if (query.includes('timing') || query.includes('time') || query.includes('open') || query.includes('close') || query.includes('hour') || query.includes('वेळ') || query.includes('केव्हा')) {
    return `⏰ **Jankalyan Medical Timings:**\n\nJankalyan Medical is **OPEN 24 Hours / 7 Days a Week (24×7)** including weekends and public holidays. You can visit anytime for emergency medicines or daily healthcare needs.`;
  }

  if (query.includes('location') || query.includes('address') || query.includes('where') || query.includes('कुठे') || query.includes('पत्ता') || query.includes('naka')) {
    return `📍 **Store Location:**\n\n**Jankalyan Medical** is located at:\n**Near Wadhegaon Naka, Sangola, Dist. Solapur, Maharashtra - 413307**\n\nFor directions or emergency assistance, call **+91 86691 18742**.`;
  }

  if (query.includes('owner') || query.includes('malak') || query.includes('proprietor') || query.includes('hazare') || query.includes('मालक')) {
    return `👤 **Store Ownership:**\n\n**Jankalyan Medical** is owned and managed by **Mr. Siddhu Hazare**.\nFor direct contact or wholesale inquiries, you can reach the store at **+91 86691 18742**.`;
  }

  if (query.includes('developer') || query.includes('built') || query.includes('created') || query.includes('rahul') || query.includes('sargar')) {
    return `💻 **Developer Information:**\n\nThis application was designed and developed by **Rahul Sargar**.\n- **Version:** 1.0.0\n- **Support & Feedback:** sargarrahul428@gmail.com\n- **Instagram:** @rahul_sargar_08`;
  }

  if (query.includes('delivery') || query.includes('home delivery') || query.includes('order') || query.includes('whatsapp') || query.includes('घरपोच')) {
    return `🚚 **Home Delivery in Sangola:**\n\nYes, we provide express medicine delivery in Sangola!\n- To place an order, send your medicine list or a clear photo of your prescription to our official WhatsApp hotline: **+91 86691 18742**.\n- Our pharmacist will verify stock and deliver directly to your doorstep.`;
  }

  if (query.includes('contact') || query.includes('phone') || query.includes('number') || query.includes('call') || query.includes('नंबर')) {
    return `📞 **Official Contact Information:**\n\n- **Phone / WhatsApp Hotline:** +91 86691 18742\n- **Email:** janaklyanmedicalstore@gmail.com\n- **Location:** Near Wadhegaon Naka, Sangola 413307\n- **Hours:** 24x7 Round-the-clock`;
  }

  return `Namaste! I am **Jankalyan Medical's AI Assistant** in Sangola.\n\n- ⏰ **Timings:** Open 24x7 Every Day\n- 📍 **Address:** Near Wadhegaon Naka, Sangola (413307)\n- 📞 **Hotline & WhatsApp Order:** +91 86691 18742\n- 💊 **Products:** Allopathic, Ayurvedic, Pediatric, Veterinary & Surgical\n\nHow can I help you with your medicine or healthcare requirement today?`;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const aiClient = getAI();

    // If Gemini client is not initialized (e.g. no GEMINI_API_KEY in environment)
    if (!aiClient) {
      const fallback = getSmartFallbackReply(message);
      return res.json({ reply: fallback });
    }

    // Build chat contents for Gemini 3.7 Flash
    let contentsPayload = message;
    if (Array.isArray(history) && history.length > 0) {
      // Map valid history turns
      const validHistory = history
        .filter(item => item && item.role && item.text)
        .map(item => ({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        }));
      validHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });
      contentsPayload = validHistory;
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contentsPayload,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const reply = response.text || getSmartFallbackReply(message);
    return res.json({ reply });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    // Graceful fallback response so chat never breaks for user
    const fallbackReply = getSmartFallbackReply(req.body?.message || '');
    return res.json({ reply: fallbackReply });
  }
});

// Health check endpoint for deployment monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'Jankalyan Medical Sangola',
    timings: '24x7',
    contact: '+91 86691 18742',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Jankalyan Medical Server running at http://0.0.0.0:${PORT}`);
});

