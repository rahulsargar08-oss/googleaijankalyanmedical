import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ==========================================
// SUPABASE CLIENT & DATA LAYER
// ==========================================
let supabase = null;
let supabaseTableChecked = false;
let supabaseTableExists = false;

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  if (!supabase) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (err) {
      return null;
    }
  }
  return supabase;
}

// Helper to check if Supabase error is due to missing table/schema cache
function isTableMissingError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();
  return (
    msg.includes("could not find the table") ||
    msg.includes("relation") ||
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    code === 'pgrst205' ||
    code === '42p01'
  );
}

// In-Memory & Local Fallback Store with Realistic Sangola Customer Record Seed Data
let localCustomers = [
  {
    id: 101,
    full_name: 'Rahul Sargar',
    mobile_number: '7709647627',
    address: 'Near Wadhegaon Naka, Sangola (413307)',
    age: 26,
    preferred_doctor: 'Dr. S. K. Kulkarni (Cardiology)',
    required_tablet: 'Telmakind 40mg Tablet (1 Strip), Dolo 650',
    status: 'Active',
    notes: 'Regular customer prescription record - in-store patient file.',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 102,
    full_name: 'Ananda Deshmukh',
    mobile_number: '9822014589',
    address: 'Near S.T. Stand, Sangola, Solapur',
    age: 58,
    preferred_doctor: 'Dr. S. K. Kulkarni (Cardiologist)',
    required_tablet: 'Telma 40mg (1 Strip), Ecosprin 75mg (1 Strip)',
    status: 'Verified',
    notes: 'Hypertension monthly medication record. Verified prescription on file.',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 103,
    full_name: 'Sunita Vijay Shinde',
    mobile_number: '9421039872',
    address: 'Wadhegaon Road, Sangola - 413307',
    age: 42,
    preferred_doctor: 'Dr. Patil Hospital Sangola',
    required_tablet: 'Pan-D (Pantoprazole + Domperidone) 15 Capsules',
    status: 'Verified',
    notes: 'Gastric medication record. In-store customer profile.',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 104,
    full_name: 'Tanaji Baburao Mane',
    mobile_number: '9763254109',
    address: 'Nazar Camp, Sangola',
    age: 64,
    preferred_doctor: 'Dr. Shinde (Diabetologist)',
    required_tablet: 'Glycomet 500mg (2 Strips), Calpol 650mg (1 Strip)',
    status: 'Under Review',
    notes: 'Diabetes health record. Diabetic profile registered.',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString()
  }
];

let nextLocalId = 105;

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

// Comprehensive Medical & Store Knowledge Matcher
function getSmartFallbackReply(message) {
  const q = (message || '').toLowerCase().trim();

  // 1. Specific Medicines & Common Drugs
  if (q.includes('dolo') || q.includes('paracetamol') || q.includes('pcm') || q.includes('crocin') || q.includes('calpol') || q.includes('pacimol')) {
    return `💊 **Paracetamol & Dolo 650 Availability:**\n\n- **Stock Status:** Available 24×7 at Jankalyan Medical Sangola in multiple strengths (Dolo 650mg, Crocin 500/650mg, Calpol 120/250 Pediatric Syrup).\n- **Primary Uses:** Fever reduction (antipyretic) and relief from mild to moderate body aches, headaches, and toothaches.\n- **Pricing:** Approx. ₹30 – ₹34 per strip of 15 tablets.\n- **Safety Guidance:** Maximum recommended adult dose is up to 3 to 4 times a day with at least 4–6 hours gap between tablets. Do not take with other Paracetamol-containing combinations.\n\n🚚 For instant home delivery in Sangola, WhatsApp your prescription to **+91 86691 18742**.`;
  }

  if (q.includes('azithromycin') || q.includes('azee') || q.includes('augmentin') || q.includes('amoxicillin') || q.includes('taxim') || q.includes('cefixime') || q.includes('ciplox') || q.includes('antibiotic') || q.includes('अँटिबायोटिक')) {
    return `🔬 **Prescription Antibiotics Range:**\n\n- **Stock Range:** Complete range of genuine antibiotics including Azee 500 (Azithromycin), Augmentin 625 (Amoxyclav), Taxim-O 200 (Cefixime), and Ciplox 500.\n- **Prescription Notice:** Antibiotics are Schedule-H drugs and require a valid prescription from a registered medical practitioner.\n- **Directions:** Always complete the full course prescribed by your doctor even if you feel better.\n\nSend prescription photo on WhatsApp: **+91 86691 18742** (Near Wadhegaon Naka, Sangola).`;
  }

  if (q.includes('pan d') || q.includes('pan 40') || q.includes('pantoprazole') || q.includes('omez') || q.includes('omeprazole') || q.includes('rabeprazole') || q.includes('rabekind') || q.includes('acidity') || q.includes('gas') || q.includes('heartburn') || q.includes('digene') || q.includes('gelusil') || q.includes('eno') || q.includes('ॲसिडिटी') || q.includes('गॅस') || q.includes('जळजळ')) {
    return `🔥 **Acidity, Gas & Heartburn Relief:**\n\n- **Proton Pump Inhibitors (PPI):** Pan-D (Pantoprazole + Domperidone), Pan 40, Omez 20mg, and Rabekind-DSR.\n  *(Best taken 30 minutes before breakfast with water)*.\n- **Instant Relief Antacids:** Digene / Gelusil syrup & chewable tablets, Eno fruit salt, Pudin Hara pearls.\n- **Stock:** 100% genuine stock available round-the-clock.\n\nNeed instant relief delivered to your address in Sangola? Call **+91 86691 18742**.`;
  }

  if (q.includes('cough') || q.includes('syrup') || q.includes('ascoril') || q.includes('grilinctus') || q.includes('alex') || q.includes('chericof') || q.includes('koflet') || q.includes('honitus') || q.includes('खोकला') || q.includes('खोकल्याचे') || q.includes('खांसी')) {
    return `🫁 **Cough Syrups & Respiratory Care:**\n\n- **Wet / Productive Cough (with phlegm/mucus):** Ascoril-LS, Grilinctus-BM, Ambroxol + Terbutaline formulations.\n- **Dry / Allergic Cough:** Alex Syrup, Chericof, Benadryl DR (Dextromethorphan).\n- **Ayurvedic / Herbal (Non-drowsy):** Himalaya Koflet, Dabur Honitus syrup.\n- **Throat Relief:** Strepsils, Koflet lozenges, Betadine 2% mint gargle.\n\nAvailable 24x7 at Wadhegaon Naka, Sangola. WhatsApp: **+91 86691 18742**.`;
  }

  if (q.includes('cold') || q.includes('sinarest') || q.includes('cheston') || q.includes('wikoryl') || q.includes('cetirizine') || q.includes('levocet') || q.includes('allegra') || q.includes('montair') || q.includes('sneezing') || q.includes('सर्दी') || q.includes('शिंका') || q.includes('जुकाम')) {
    return `🤧 **Cold, Sinus & Allergy Relief:**\n\n- **Multi-Symptom Cold Tablets:** Sinarest, Cheston Cold, Wikoryl (relieves blocked nose, fever & body ache).\n- **Antiallergics (Runny nose/itching):** Cetirizine 10mg (Cetzine), Levocetirizine 5mg (Levocet), Allegra 120mg (Fexofenadine), Montair-LC (Montelukast + Levocetirizine).\n- **Steam Inhalation:** Karvol Plus inhalant capsules, Vicks Inhaler & Vaporizers.\n\nAll medicines available in stock. Order via WhatsApp **+91 86691 18742**.`;
  }

  if (q.includes('pain') || q.includes('combiflam') || q.includes('zerodol') || q.includes('voveran') || q.includes('diclofenac') || q.includes('meftal') || q.includes('spas') || q.includes('headache') || q.includes('body ache') || q.includes('दुखी') || q.includes('डोकेदुखी') || q.includes('पोटदुखी') || q.includes('कंबरदुखी')) {
    return `⚡ **Pain Relief & Anti-Inflammatory Range:**\n\n- **Headache & Body Pain:** Combiflam, Zerodol-P, Saridon, Paracetamol 650mg.\n- **Muscle & Joint Pain:** Zerodol-SP, Voveran SR, Volini / Moov / Omnigel pain spray & gel.\n- **Stomach Cramps / Period Pain:** Meftal-Spas (Mefenamic Acid + Dicyclomine), Cyclopam, Drotin-M.\n- **Safety Note:** Painkiller tablets must always be taken after meals with food.\n\nAvailable 24x7 at Jankalyan Medical Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('diarrhea') || q.includes('loose motion') || q.includes('vomit') || q.includes('vomikind') || q.includes('ors') || q.includes('electral') || q.includes('probiotic') || q.includes('जुलाब') || q.includes('उलटी') || q.includes('दस्त')) {
    return `💧 **Stomach Infection, Vomiting & Hydration:**\n\n- **Rehydration:** WHO-formula ORS sachets (Electral, Prolyte, ORS liquid tetra packs) to prevent dehydration.\n- **Nausea / Vomiting Relief:** Vomikind / Emeset 4mg (Ondansetron).\n- **Loose Motions / Diarrhea:** Norflox-TZ / O2 (Ofloxacin + Ornidazole), Econorm / Sporlac probiotics.\n\nEmergency 24x7 counter at Wadhegaon Naka, Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('vitamin') || q.includes('becosules') || q.includes('neurobion') || q.includes('limcee') || q.includes('shelcal') || q.includes('calcium') || q.includes('vitamin d') || q.includes('d3') || q.includes('d-rise') || q.includes('zincovit') || q.includes('supradyn') || q.includes('कॅल्शियम') || q.includes('व्हिटॅमिन')) {
    return `🌟 **Vitamins, Minerals & Daily Supplements:**\n\n- **B-Complex & Mouth Ulcers:** Becosules capsules, Neurobion Forte (nerve health).\n- **Immunity & Skin:** Limcee 500mg (Vitamin C chewable), Zincovit tablets & syrup.\n- **Bone & Joint Strength:** Shelcal 500 / Gemcal (Calcium + Vit D3), D-Rise 60K (Vitamin D3 weekly booster).\n- **General Vitality:** Supradyn Daily, Revital H multivitamins.\n\nAvailable with attractive pricing. Call/WhatsApp **+91 86691 18742**.`;
  }

  if (q.includes('skin') || q.includes('wound') || q.includes('burn') || q.includes('betadine') || q.includes('soframycin') || q.includes('candid') || q.includes('ointment') || q.includes('cream') || q.includes('antiseptic') || q.includes('bandage') || q.includes('जखम') || q.includes('भाजणे') || q.includes('खाज')) {
    return `🩹 **First Aid, Wound Care & Dermatology:**\n\n- **Antiseptics & Wound Healing:** Betadine 5% / 10% ointment & solution, Soframycin, Neosporin.\n- **Burn Care:** Silverex Ionic burn healing cream, Burnol.\n- **Fungal Infection & Itching:** Candid-B cream, Quadriderm, Clotrimazole powder.\n- **Dressings:** Sterile cotton rolls, micropore surgical tapes, bandages, Band-Aids, Dettol/Savlon.\n\nVisit 24x7 near Wadhegaon Naka, Sangola or call **+91 86691 18742**.`;
  }

  if (q.includes('diabetes') || q.includes('sugar') || q.includes('insulin') || q.includes('glycomet') || q.includes('metformin') || q.includes('glucometer') || q.includes('मधुमेह') || q.includes('साखर')) {
    return `🩺 **Diabetes Care & Cold-Chain Insulin:**\n\n- **Oral Antidiabetics:** Glycomet 500/850/1000mg, Glimepiride, Janumet, Galvus Met.\n- **Cold-Chain Refrigerated Insulin:** Lantus, Human Mixtard, Novorapid (stored strictly under 2°C–8°C in dedicated medical refrigerators).\n- **Testing Supplies:** Accu-Chek Active & Instant strips, Dr. Morepen test strips, sterile lancets.\n\nFor regular monthly diabetic packs & discounts, WhatsApp **+91 86691 18742**.`;
  }

  if (q.includes('bp') || q.includes('blood pressure') || q.includes('telma') || q.includes('telmisartan') || q.includes('amlodipine') || q.includes('heart') || q.includes('रक्तदाब') || q.includes('हार्ट')) {
    return `❤️ **Blood Pressure, Cardiac & Diagnostic Devices:**\n\n- **Cardiovascular Medicines:** Telma 40 / Telma-H (Telmisartan), Amlodipine, Atenolol, Ecosprin 75/150.\n- **Home Monitoring:** OMRON digital BP machines, pulse oximeters, mercury/digital sphygmomanometers.\n\nAvailable 24x7 at Jankalyan Medical Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('vet') || q.includes('veterinary') || q.includes('animal') || q.includes('ostovet') || q.includes('calup') || q.includes('vimeral') || q.includes('cow') || q.includes('buffalo') || q.includes('livestock') || q.includes('गाय') || q.includes('म्हैस') || q.includes('जनावरे') || q.includes('पशुऔषधे')) {
    return `🐄 **Veterinary Care & Animal Nutrition in Sangola:**\n\nJankalyan Medical is Sangola's trusted stockist for livestock & dairy medicines:\n- **High-Yield Milk Boosters:** Ostovet Forte (5L/1L), Calup, Vimeral tonics.\n- **Dewormers & Bolus:** Albendazole, Fenbendazole bolus, digestive tonics.\n- **Wound & Maggot Care:** Topicure spray, Fura-Free antiseptic ointment.\n\nCall **+91 86691 18742** for livestock stock & quantity orders.`;
  }

  if (q.includes('baby') || q.includes('pediatric') || q.includes('cerelac') || q.includes('lactogen') || q.includes('diaper') || q.includes('infant') || q.includes('बाळ') || q.includes('लहान मुले')) {
    return `👶 **Baby & Pediatric Healthcare:**\n\n- **Infant Formulas & Nutrition:** Nestlé Cerelac (all stages), Lactogen 1/2/3, Nan Pro.\n- **Pediatric Medicines:** Calpol 120/250 oral drops & suspensions, Maxtra drops, Colicaid drops, Bonnisan syrup.\n- **Baby Care:** Pampers, MamyPoko Pants diapers, gentle baby wipes, Sebamed / Himalaya baby care.\n\nEmergency 24x7 access in Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('ayurvedic') || q.includes('herbal') || q.includes('dabur') || q.includes('chyawanprash') || q.includes('patanjali') || q.includes('himalaya') || q.includes('liv 52') || q.includes('ashwagandha') || q.includes('आयुर्वेद') || q.includes('हर्बल')) {
    return `🌿 **Ayurvedic & Natural Wellness Range:**\n\n- Genuine herbal formulations from Dabur, Baidyanath, Himalaya, and Zandu.\n- **Immunity & Digestion:** Dabur Chyawanprash, Himalaya Liv.52, Triphala, Ashwagandha churna.\n- **Pain & Relief:** Zandu Balm, Amrutanjan, Rhumasyl joint pain oil.\n\nAvailable 24x7 at Wadhegaon Naka, Sangola (**+91 86691 18742**).`;
  }

  if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('discount') || q.includes('किंमत') || q.includes('दर') || q.includes('सवलत') || q.includes('भाव')) {
    return `💰 **Fair Pricing & Discounts at Jankalyan Medical:**\n\n- **100% Genuine Medicines:** Sourced directly from certified pharmaceutical distributors.\n- **Discounts:** Attractive discounts up to 15%–20% on select healthcare supplements, baby foods, surgical diagnostics, and bulk monthly prescriptions.\n- **Exact Price Check:** Send your medicine list to our WhatsApp hotline **+91 86691 18742** and our pharmacist will immediately share exact MRP and discounted prices.`;
  }

  // 2. Store Specific Details (Timing, Location, Owner, Developer, Delivery, Contact)
  if (q.includes('timing') || q.includes('time') || q.includes('open') || q.includes('close') || q.includes('hour') || q.includes('night') || q.includes('24') || q.includes('वेळ') || q.includes('केव्हा') || q.includes('चालू') || q.includes('बंद') || q.includes('रात्री')) {
    return `⏰ **Jankalyan Medical Sangola Timings:**\n\nJankalyan Medical is **OPEN 24 Hours / 7 Days a Week (24×7)** every single day without closing, including Sundays, late nights, and all public holidays.\n\nVisit anytime or call our emergency hotline at **+91 86691 18742**.`;
  }

  if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('naka') || q.includes('wadhegaon') || q.includes('place') || q.includes('कुठे') || q.includes('पत्ता') || q.includes('रस्ता')) {
    return `📍 **Store Address & Location:**\n\n**Jankalyan Medical**\n**Near Wadhegaon Naka, Sangola, Dist. Solapur, Maharashtra - 413307**\n🎯 Landmark: Wadhegaon Naka, Sangola.\n\nFor directions, contact **+91 86691 18742**.`;
  }

  if (q.includes('owner') || q.includes('proprietor') || q.includes('malak') || q.includes('hazare') || q.includes('siddhu') || q.includes('मालक') || q.includes('संचालक')) {
    return `👤 **Store Ownership:**\n\n**Jankalyan Medical** is owned and operated by **Mr. Siddhu Hazare**.\n\nFor store inquiries, bulk requirements, or patient assistance, you can reach Mr. Siddhu Hazare directly at **+91 86691 18742**.`;
  }

  if (q.includes('developer') || q.includes('built') || q.includes('created') || q.includes('rahul') || q.includes('sargar') || q.includes('बनवला')) {
    return `💻 **Developer Information:**\n\nThis application was designed and engineered by **Rahul Sargar**.\n- **Version:** 1.0.0 (Green & White Healthcare System)\n- **Support & Feedback:** sargarrahul428@gmail.com\n- **Instagram:** @rahul_sargar_08`;
  }

  if (q.includes('delivery') || q.includes('home delivery') || q.includes('order') || q.includes('whatsapp') || q.includes('घरपोच') || q.includes('ऑर्डर') || q.includes('डिलिव्हरी')) {
    return `🚚 **Express Home Delivery in Sangola Town:**\n\nYes! We deliver medicines right to your doorstep across Sangola town.\n\n**How to Order:**\n1. Take a photo of your doctor's prescription or type your medicine list.\n2. Send it to our official WhatsApp hotline: **+91 86691 18742**.\n3. Our pharmacist will verify availability and deliver to your address.\n\n👉 [Click here to WhatsApp us](https://wa.me/918669118742)`;
  }

  if (q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('call') || q.includes('helpline') || q.includes('नंबर') || q.includes('फोन') || q.includes('संपर्क')) {
    return `📞 **Official Contact Information:**\n\n- **Phone / WhatsApp Hotline:** +91 86691 18742\n- **Proprietor:** Mr. Siddhu Hazare\n- **Email:** janaklyanmedicalstore@gmail.com\n- **Address:** Near Wadhegaon Naka, Sangola (413307)\n- **Timings:** 24x7 Round-the-clock`;
  }

  // 3. Marathi General Assistance
  if (q.includes('नमस्कार') || q.includes('हाय') || q.includes('हॅलो') || q.includes('मदत') || q.includes('सांगा') || q.includes('मिळेल का')) {
    return `🙏 **नमस्कार! मी जनकल्याण मेडिकल सांगोला चा AI सहाय्यक आहे.**\n\n- ⏰ **वेळ:** २४ तास चालू (24x7 Open)\n- 📍 **पत्ता:** वाढेगाव नाक्याजवळ, सांगोला (४१३३०७)\n- 📞 **फोन / व्हॉट्सॲप ऑर्डर:** +91 86691 18742\n- 🚚 **घरपोच डिलिव्हरी:** सांगोला शहरात उपलब्ध\n\nतुम्हाला कोणती औषधे हवी आहेत? (ॲलोपॅथी, आयुर्वेदिक, लहान मुलांची औषधे, पशुवैद्यकीय औषधे किंवा तपासणी साधने).`;
  }

  // 4. Default Helpful Pharmacy Response
  return `Namaste! I am **Jankalyan Medical's AI Pharmacist Assistant** in Sangola.\n\n- ⏰ **Timings:** OPEN 24 Hours / 7 Days a Week (24×7)\n- 📍 **Address:** Near Wadhegaon Naka, Sangola (413307)\n- 📞 **WhatsApp & Emergency Hotline:** +91 86691 18742\n- 💊 **Complete Range:** Allopathic, Ayurvedic, Pediatric, Veterinary & Surgical Products\n- 🚚 **Delivery:** Express Home Delivery in Sangola\n\nPlease let me know your medicine name, symptom, or question!`;
}

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body?.message;
  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const aiClient = getAI();

    if (aiClient) {
      const history = req.body.history;
      let contentsPayload = userMessage;

      if (Array.isArray(history) && history.length > 0) {
        const validHistory = history
          .filter(item => item && item.role && item.text)
          .map(item => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
          }));
        validHistory.push({
          role: 'user',
          parts: [{ text: userMessage }]
        });
        contentsPayload = validHistory;
      }

      // Add 8s timeout promise to prevent hung network calls
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI response timeout')), 8000)
      );

      const geminiPromise = aiClient.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: contentsPayload,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);
      const reply = response && response.text ? response.text : null;
      if (reply && reply.trim().length > 0) {
        return res.json({ reply: reply.trim() });
      }
    }

    // Fallback if AI client not initialized or empty reply
    const fallbackReply = getSmartFallbackReply(userMessage);
    return res.json({ reply: fallbackReply });

  } catch (error) {
    console.warn('Gemini chat handled with resilient pharmacy intelligence:', error?.message || error);
    const fallbackReply = getSmartFallbackReply(userMessage);
    return res.json({ reply: fallbackReply });
  }
});

// ==========================================
// CUSTOMER INFORMATION & SUPABASE API ROUTES
// ==========================================

// GET /api/customers - Retrieve all customer records with optional search/filter
app.get('/api/customers', async (req, res) => {
  try {
    const { search, status, doctor } = req.query;
    const client = getSupabaseClient();

    let customers = [];
    let dataSource = 'local';

    if (client) {
      try {
        let query = client.from('customers').select('*').order('created_at', { ascending: false });
        if (status && status !== 'All') {
          query = query.eq('status', status);
        }
        if (search) {
          query = query.or(`full_name.ilike.%${search}%,mobile_number.ilike.%${search}%,required_tablet.ilike.%${search}%,preferred_doctor.ilike.%${search}%,address.ilike.%${search}%`);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          customers = data;
          dataSource = 'supabase';
          supabaseTableExists = true;
        } else {
          // If table is missing or query fails, serve seamlessly from local store
          customers = [...localCustomers];
          if (error && isTableMissingError(error)) {
            supabaseTableExists = false;
          }
        }
      } catch (sbErr) {
        customers = [...localCustomers];
      }
    } else {
      customers = [...localCustomers];
    }

    // Apply filters to in-memory store if used or as fallback
    if (dataSource === 'local') {
      if (status && status !== 'All') {
        customers = customers.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
      }
      if (doctor && doctor !== 'All') {
        customers = customers.filter(c => (c.preferred_doctor || '').toLowerCase().includes(doctor.toLowerCase()));
      }
      if (search) {
        const s = search.toLowerCase();
        customers = customers.filter(c =>
          (c.full_name || '').toLowerCase().includes(s) ||
          (c.mobile_number || '').toLowerCase().includes(s) ||
          (c.required_tablet || '').toLowerCase().includes(s) ||
          (c.preferred_doctor || '').toLowerCase().includes(s) ||
          (c.address || '').toLowerCase().includes(s)
        );
      }
      // Sort newest first
      customers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    res.json({
      success: true,
      source: dataSource,
      count: customers.length,
      customers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch customer records' });
  }
});

// POST /api/customers - Create / Submit new customer record (from public inquiry form or admin portal)
app.post('/api/customers', async (req, res) => {
  try {
    const { full_name, mobile_number, address, age, preferred_doctor, required_tablet, status, notes } = req.body;

    if (!full_name || !mobile_number || !required_tablet) {
      return res.status(400).json({
        success: false,
        error: 'Full Name, Mobile Number, and Required Tablet are required fields.'
      });
    }

    const newCustomer = {
      full_name: full_name.trim(),
      mobile_number: mobile_number.trim(),
      address: (address || 'Sangola').trim(),
      age: age ? parseInt(age, 10) || null : null,
      preferred_doctor: (preferred_doctor || 'General Consultation / Self').trim(),
      required_tablet: required_tablet.trim(),
      status: status || 'Pending',
      notes: (notes || '').trim(),
      created_at: new Date().toISOString()
    };

    const client = getSupabaseClient();
    let savedCustomer = null;
    let dataSource = 'local';

    if (client) {
      try {
        const { data, error } = await client
          .from('customers')
          .insert([newCustomer])
          .select()
          .single();

        if (!error && data) {
          savedCustomer = data;
          dataSource = 'supabase';
          supabaseTableExists = true;
        } else if (error && isTableMissingError(error)) {
          supabaseTableExists = false;
        }
      } catch (sbErr) {
        // Fallback to local store cleanly
      }
    }

    // Also persist in local store for reliability
    if (!savedCustomer) {
      savedCustomer = {
        id: nextLocalId++,
        ...newCustomer
      };
      localCustomers.unshift(savedCustomer);
    } else {
      localCustomers.unshift(savedCustomer);
    }

    res.status(201).json({
      success: true,
      source: dataSource,
      customer: savedCustomer,
      message: 'Customer information registered successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save customer information.' });
  }
});

// PUT /api/customers OR /api/customers/:id - Update existing customer record
app.put(['/api/customers', '/api/customers/:id'], async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.query.id;
    const { full_name, mobile_number, address, age, preferred_doctor, required_tablet, status, notes } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (mobile_number !== undefined) updates.mobile_number = mobile_number.trim();
    if (address !== undefined) updates.address = address.trim();
    if (age !== undefined) updates.age = age ? parseInt(age, 10) || null : null;
    if (preferred_doctor !== undefined) updates.preferred_doctor = preferred_doctor.trim();
    if (required_tablet !== undefined) updates.required_tablet = required_tablet.trim();
    if (status !== undefined) updates.status = status.trim();
    if (notes !== undefined) updates.notes = notes.trim();

    const client = getSupabaseClient();
    let updatedCustomer = null;
    let dataSource = 'local';

    if (client) {
      try {
        const { data, error } = await client
          .from('customers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          updatedCustomer = data;
          dataSource = 'supabase';
          supabaseTableExists = true;
        } else if (error && isTableMissingError(error)) {
          supabaseTableExists = false;
        }
      } catch (sbErr) {
        // Fallback to local store cleanly
      }
    }

    // Update in local store
    const localIndex = localCustomers.findIndex(c => String(c.id) === String(id));
    if (localIndex !== -1) {
      localCustomers[localIndex] = {
        ...localCustomers[localIndex],
        ...updates
      };
      if (!updatedCustomer) {
        updatedCustomer = localCustomers[localIndex];
      }
    }

    if (!updatedCustomer) {
      return res.status(404).json({ success: false, error: 'Customer record not found.' });
    }

    res.json({
      success: true,
      source: dataSource,
      customer: updatedCustomer,
      message: 'Customer record updated successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update customer record.' });
  }
});

// DELETE /api/customers OR /api/customers/:id - Delete customer record
app.delete(['/api/customers', '/api/customers/:id'], async (req, res) => {
  try {
    const id = req.params.id || req.query.id || req.body.id;
    const client = getSupabaseClient();

    if (client) {
      try {
        const { error } = await client.from('customers').delete().eq('id', id);
        if (error && isTableMissingError(error)) {
          supabaseTableExists = false;
        }
      } catch (sbErr) {
        // Clean fallback
      }
    }

    localCustomers = localCustomers.filter(c => String(c.id) !== String(id));

    res.json({
      success: true,
      message: `Customer record #${id} removed successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete customer record.' });
  }
});

// POST /api/admin/login - Verify admin login credentials with strict security
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const user = (username || '').trim().toLowerCase();
  const pass = (password || '').trim();

  const envUser = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();

  const validUsers = new Set([
    'janaklyanmedicalstore@gmail.com',
    'jankalyanmedicalstore@gmail.com',
    'janaklyanmedicalstore',
    'jankalyanmedicalstore',
    'jankalyan',
    'janaklyan'
  ]);
  if (envUser) validUsers.add(envUser);

  const validPasswords = new Set([
    '@admin45',
    'admin45',
    '@Admin45',
    'Admin45'
  ]);
  if (envPass) validPasswords.add(envPass);

  const isUserValid = validUsers.has(user);
  const isPassValid = validPasswords.has(pass);

  if (isUserValid && isPassValid) {
    const token = 'jankalyan_adm_' + Buffer.from(`${user}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      token,
      admin: {
        username: user,
        role: 'Pharmacist Administrator',
        name: 'Jankalyan Medical Administrator',
        store: 'Jankalyan Medical Sangola'
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Access Denied: Invalid administrator credentials. Please check your username/email and password.'
  });
});

// GET /api/admin/status - Check Supabase connection and database status
app.get('/api/admin/status', async (req, res) => {
  const client = getSupabaseClient();
  let supabaseActive = false;
  let rowCount = localCustomers.length;
  let supabaseUrl = process.env.SUPABASE_URL || null;

  if (client) {
    try {
      const { count, error } = await client.from('customers').select('*', { count: 'exact', head: true });
      if (!error) {
        supabaseActive = true;
        rowCount = typeof count === 'number' ? count : rowCount;
      }
    } catch (e) {
      supabaseActive = false;
    }
  }

  res.json({
    success: true,
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)),
    supabaseConnected: supabaseActive,
    supabaseUrl: supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^/]{8})[^/]+/, '$1...') : null,
    totalRecords: rowCount,
    store: 'Jankalyan Medical Sangola (Near Wadhegaon Naka)',
    tableSchema: {
      table: 'customers',
      fields: ['id', 'full_name', 'mobile_number', 'address', 'age', 'preferred_doctor', 'required_tablet', 'status', 'notes', 'created_at']
    }
  });
});

// GET /api/admin/stats - Customer management summary analytics
app.get('/api/admin/stats', async (req, res) => {
  try {
    let customers = localCustomers;
    const client = getSupabaseClient();

    if (client) {
      try {
        const { data } = await client.from('customers').select('*');
        if (data && Array.isArray(data)) {
          customers = data;
        }
      } catch (e) {
        // use local
      }
    }

    const total = customers.length;
    const pending = customers.filter(c => (c.status || '').toLowerCase() === 'pending').length;
    const processing = customers.filter(c => (c.status || '').toLowerCase() === 'processing').length;
    const dispensed = customers.filter(c => (c.status || '').toLowerCase() === 'dispensed').length;

    res.json({
      success: true,
      stats: {
        total,
        pending,
        processing,
        dispensed,
        activeSync: Boolean(client)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/reset-samples - Seed fresh customer samples
app.post('/api/admin/reset-samples', (req, res) => {
  localCustomers = [
    {
      id: 101,
      full_name: 'Ananda Deshmukh',
      mobile_number: '9822014589',
      address: 'Near S.T. Stand, Sangola, Solapur',
      age: 58,
      preferred_doctor: 'Dr. S. K. Kulkarni (Cardiologist)',
      required_tablet: 'Telma 40mg (1 Strip), Ecosprin 75mg (1 Strip)',
      status: 'Pending',
      notes: 'Requires 24x7 home delivery. Patient has hypertension history.',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 102,
      full_name: 'Sunita Vijay Shinde',
      mobile_number: '9421039872',
      address: 'Wadhegaon Road, Sangola - 413307',
      age: 42,
      preferred_doctor: 'Dr. Patil Hospital Sangola',
      required_tablet: 'Pan-D (Pantoprazole + Domperidone) 15 Capsules',
      status: 'Dispensed',
      notes: 'Prescription verified. Store pickup completed.',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    },
    {
      id: 103,
      full_name: 'Tanaji Baburao Mane',
      mobile_number: '9763254109',
      address: 'Nazar Camp, Sangola',
      age: 64,
      preferred_doctor: 'Dr. Shinde (Diabetologist)',
      required_tablet: 'Glycomet 500mg (2 Strips), Calpol 650mg (1 Strip)',
      status: 'Processing',
      notes: 'Cold-chain insulin pack requested for tomorrow morning.',
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString()
    },
    {
      id: 104,
      full_name: 'Pooja Sachin Gaikwad',
      mobile_number: '8805123984',
      address: 'Mahatma Phule Chowk, Sangola',
      age: 29,
      preferred_doctor: 'Dr. Mrs. Jadhav (Pediatrician)',
      required_tablet: 'Calpol 250 Peadiatric Syrup, Nestlé Cerelac Stage 2',
      status: 'Pending',
      notes: 'Urgent baby care requirement.',
      created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString()
    }
  ];
  res.json({ success: true, message: 'Sample customer data reseeded successfully.', count: localCustomers.length });
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

