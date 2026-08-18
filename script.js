/**
 * JANKALYAN MEDICAL - CLIENT LOGIC & INTERACTIVITY
 * Sangola's 24x7 Certified Community Pharmacy
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollSpy();
    initWhatsAppForm();
    initHeaderScroll();
});

/* ==========================================================================
   NAVIGATION, MOBILE DRAWER & SCROLL SPY
   ========================================================================== */

function openDrawer() {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const mobileToggle = document.getElementById('mobile-menu');

    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    if (mobileToggle) {
        mobileToggle.classList.add('active');
        mobileToggle.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const mobileToggle = document.getElementById('mobile-menu');

    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    if (mobileToggle) {
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
}

function toggleDrawer() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer && drawer.classList.contains('open')) {
        closeDrawer();
    } else {
        openDrawer();
    }
}

function initNavigation() {
    const mobileToggle = document.getElementById('mobile-menu');
    const drawerClose = document.getElementById('drawer-close');
    const backdrop = document.getElementById('drawer-backdrop');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleDrawer);
    }

    if (drawerClose) {
        drawerClose.addEventListener('click', closeDrawer);
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeDrawer);
    }

    // Close mobile drawer when any drawer link is clicked
    document.querySelectorAll('.drawer-item').forEach(link => {
        link.addEventListener('click', () => {
            closeDrawer();
        });
    });
}

function initHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            header.style.boxShadow = '0 4px 20px rgba(15, 23, 42, 0.08)';
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.boxShadow = 'none';
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        }
    });
}

function initScrollSpy() {
    const sections = document.querySelectorAll('section[id], footer[id]');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    const drawerLinks = document.querySelectorAll('.drawer-links .drawer-item');
    const bottomNavLinks = document.querySelectorAll('.mobile-bottom-bar .bottom-nav-item');

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 140;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (!currentSectionId && window.scrollY < 200) {
            currentSectionId = 'home';
        }

        if (currentSectionId) {
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === `#${currentSectionId}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            drawerLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === `#${currentSectionId}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            bottomNavLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === `#${currentSectionId}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    });
}

/* ==========================================================================
   MEDICINE CATEGORY FILTER TABS
   ========================================================================== */

function filterCategory(category, buttonElement) {
    const tabButtons = document.querySelectorAll('.category-tabs .tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    if (buttonElement) {
        buttonElement.classList.add('active');
    }

    const cards = document.querySelectorAll('.service-card');
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'flex';
            card.style.opacity = '1';
        } else {
            card.style.display = 'none';
        }
    });
}

function fillMedicineInquiry(productCategory) {
    const formSection = document.getElementById('availability');
    const medInput = document.getElementById('medName');
    
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
    }

    if (medInput) {
        medInput.value = `${productCategory}: `;
        setTimeout(() => {
            medInput.focus();
        }, 500);
    }
}

/* ==========================================================================
   WHATSAPP ORDER & AVAILABILITY FORM
   ========================================================================== */

function initWhatsAppForm() {
    const medForm = document.getElementById('medForm');
    if (!medForm) return;

    medForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('custName')?.value.trim() || 'Valued Customer';
        const phone = document.getElementById('custPhone')?.value.trim() || 'Not specified';
        const orderType = document.getElementById('orderType')?.value || 'Store Pickup';
        const medicine = document.getElementById('medName')?.value.trim() || '';
        const notes = document.getElementById('message')?.value.trim() || 'None';

        if (!medicine) {
            alert('Please specify the medicine or healthcare product name.');
            return;
        }

        const targetPhone = "918669118742";

        const messageLines = [
            `🏥 *JANKALYAN MEDICAL - MEDICINE ORDER INQUIRY*`,
            `📍 *Store:* Near Wadhegaon Naka, Sangola 413307`,
            `----------------------------------------`,
            `👤 *Customer Name:* ${name}`,
            `📞 *Contact Number:* ${phone}`,
            `🚚 *Fulfillment Preference:* ${orderType}`,
            `💊 *Medicine / Product Required:*`,
            `👉 ${medicine}`,
            `📝 *Notes / Dosage / Quantity:* ${notes}`,
            `----------------------------------------`,
            `⚡ *Please confirm availability and total price.*`
        ];

        const encodedMessage = encodeURIComponent(messageLines.join('\n'));
        const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
}

/* ==========================================================================
   CLINICAL BMI CALCULATOR
   ========================================================================== */

function calculateBMI() {
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const resultCard = document.getElementById('bmi-result-card');
    const scoreElement = document.getElementById('result-score');
    const statusPill = document.getElementById('result-status-pill');
    const categoryElement = document.getElementById('result-category');
    const adviceElement = document.getElementById('result-advice');
    const meterMarker = document.getElementById('meter-marker');

    if (!weightInput || !heightInput) return;

    const weight = parseFloat(weightInput.value);
    const heightCm = parseFloat(heightInput.value);

    if (isNaN(weight) || isNaN(heightCm) || weight <= 0 || heightCm <= 0) {
        alert('Please enter valid numeric values for both Weight (kg) and Height (cm).');
        return;
    }

    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    const roundedBMI = bmi.toFixed(1);

    if (scoreElement) scoreElement.textContent = roundedBMI;

    let category = '';
    let categoryClass = '';
    let advice = '';
    let markerPercent = 50;

    if (bmi < 18.5) {
        category = 'Underweight (< 18.5)';
        categoryClass = 'under';
        advice = 'Your BMI indicates you may be underweight. Consider consulting a doctor or our pharmacist about calorie-dense nutrition, multivitamins, and protein supplements.';
        markerPercent = Math.max(5, Math.min(22, ((bmi - 12) / (18.5 - 12)) * 22));
    } else if (bmi >= 18.5 && bmi <= 24.9) {
        category = 'Normal / Healthy Weight (18.5 - 24.9)';
        categoryClass = 'normal';
        advice = 'Great news! Your body weight is within the healthy medical range. Maintain this optimal zone with balanced meals and regular physical activity.';
        markerPercent = 22 + ((bmi - 18.5) / (24.9 - 18.5)) * 32;
    } else if (bmi >= 25.0 && bmi <= 29.9) {
        category = 'Overweight (25.0 - 29.9)';
        categoryClass = 'over';
        advice = 'Your BMI score is slightly above the ideal range. Routine cardiovascular activity, low-sugar diet, and regular blood pressure checks are recommended.';
        markerPercent = 54 + ((bmi - 25.0) / (29.9 - 25.0)) * 26;
    } else {
        category = 'Obese Range (≥ 30.0)';
        categoryClass = 'obese';
        advice = 'Your BMI is in the obese category, which may elevate risk for hypertension and diabetes. We recommend consulting a healthcare physician for a comprehensive wellness plan.';
        markerPercent = Math.min(96, 80 + ((bmi - 30.0) / (40.0 - 30.0)) * 16);
    }

    if (statusPill && categoryElement) {
        statusPill.className = `status-pill ${categoryClass}`;
        categoryElement.textContent = category;
    }

    if (adviceElement) {
        adviceElement.textContent = advice;
    }

    if (meterMarker) {
        meterMarker.style.left = `${markerPercent}%`;
    }

    if (resultCard) {
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function resetBMI() {
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const resultCard = document.getElementById('bmi-result-card');

    if (weightInput) weightInput.value = '';
    if (heightInput) heightInput.value = '';
    if (resultCard) resultCard.style.display = 'none';
}

/* ==========================================================================
   AI PHARMACIST CHATBOT MODAL & INTERACTION
   ========================================================================== */

let chatConversationHistory = [];
let isAiSending = false;

function openChatbot() {
    const chatbot = document.getElementById('chatbot');
    const chatOverlay = document.getElementById('chat-backdrop');
    if (chatbot) {
        chatbot.classList.add('active');
        chatbot.style.display = 'flex';
        if (chatOverlay) chatOverlay.classList.add('active');
        
        // Prevent body scroll on mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }

        const input = document.getElementById('chat-input');
        if (input) {
            setTimeout(() => input.focus(), 250);
        }
    }
}

function closeChatbot() {
    const chatbot = document.getElementById('chatbot');
    const chatOverlay = document.getElementById('chat-backdrop');
    if (chatbot) {
        chatbot.classList.remove('active');
        chatbot.style.display = 'none';
        if (chatOverlay) chatOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    if (!chatbot) return;

    if (chatbot.classList.contains('active') || chatbot.style.display === 'flex') {
        closeChatbot();
    } else {
        openChatbot();
    }
}

function askAiQuick(promptText) {
    openChatbot();
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.value = promptText;
        sendMessage();
    }
}

function clearChatHistory() {
    const chatBody = document.getElementById('chat-body');
    chatConversationHistory = [];
    if (!chatBody) return;

    chatBody.innerHTML = `
        <div class="chat-msg bot">
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-content">
                <p>Namaste! Chat history cleared. How can <strong>Jankalyan Medical's AI Assistant</strong> help you with medicines, timings, or store services?</p>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

function formatAiMarkdown(text) {
    if (!text) return '';
    let formatted = escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n\n+/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    return `<p>${formatted}</p>`;
}

function generateClientSidePharmacyReply(message) {
    const q = (message || '').toLowerCase().trim();

    // 1. Specific Medicines & Fever / Pain / Antibiotic Queries
    if (q.includes('dolo') || q.includes('paracetamol') || q.includes('pcm') || q.includes('crocin') || q.includes('calpol') || q.includes('pacimol') || q.includes('fever') || q.includes('ताप') || q.includes('बुखार')) {
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

    if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('discount') || q.includes('किंमत') || q.includes('दर') || q.includes('सवलत') || q.includes('भाव')) {
        return `💰 **Fair Pricing & Discounts at Jankalyan Medical:**\n\n- **100% Genuine Medicines:** Sourced directly from certified pharmaceutical distributors.\n- **Discounts:** Attractive discounts up to 15%–20% on select healthcare supplements, baby foods, surgical diagnostics, and bulk monthly prescriptions.\n- **Exact Price Check:** Send your medicine list to our WhatsApp hotline **+91 86691 18742** and our pharmacist will immediately share exact MRP and discounted prices.`;
    }

    // Timings / Open / Close
    if (q.includes('timing') || q.includes('time') || q.includes('open') || q.includes('close') || q.includes('hour') || q.includes('night') || q.includes('24') || q.includes('वेळ') || q.includes('केव्हा') || q.includes('चालू') || q.includes('बंद') || q.includes('रात्री')) {
        return `⏰ **Jankalyan Medical Timings:**\n\nJankalyan Medical is **OPEN 24 Hours / 7 Days a Week (24×7)** without any break, including Sundays, festivals, and late nights in Sangola.\n\nVisit us anytime or call our 24x7 emergency helpline at **+91 86691 18742**.`;
    }

    // Location / Address / Directions
    if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('place') || q.includes('naka') || q.includes('wadhegaon') || q.includes('कुठे') || q.includes('पत्ता') || q.includes('रस्ता') || q.includes('जागा')) {
        return `📍 **Store Location & Address:**\n\n**Jankalyan Medical**\n**Near Wadhegaon Naka, Sangola, Dist. Solapur, Maharashtra - 413307**\n\n🎯 **Landmark:** Wadhegaon Naka, Sangola.\n\nNeed directions or emergency assistance? Call us directly at **+91 86691 18742**.`;
    }

    // Proprietor / Owner
    if (q.includes('owner') || q.includes('proprietor') || q.includes('malak') || q.includes('siddhu') || q.includes('hazare') || q.includes('मालक') || q.includes('संचालक')) {
        return `👤 **Store Ownership:**\n\n**Jankalyan Medical** is owned and managed by **Mr. Siddhu Hazare**.\n\nFor store inquiries, bulk medical requirements, or patient assistance, you can contact Mr. Siddhu Hazare at **+91 86691 18742**.`;
    }

    // Developer / Website Creator
    if (q.includes('developer') || q.includes('dev') || q.includes('built') || q.includes('created') || q.includes('coder') || q.includes('rahul') || q.includes('sargar') || q.includes('बनवला')) {
        return `💻 **Developer Information:**\n\nThis web application was designed and engineered by **Rahul Sargar**.\n- **Version:** 1.0.0 (Clean Healthcare System)\n- **Email:** sargarrahul428@gmail.com\n- **Instagram:** @rahul_sargar_08`;
    }

    // Delivery / WhatsApp Orders
    if (q.includes('delivery') || q.includes('home delivery') || q.includes('order') || q.includes('whatsapp') || q.includes('send') || q.includes('घरपोच') || q.includes('ऑर्डर') || q.includes('डिलिव्हरी') || q.includes('पाठवा')) {
        return `🚚 **Home Delivery in Sangola Town:**\n\nYes! We provide express doorstep medicine delivery across Sangola.\n\n**How to Order:**\n1. Send your medicine list or a clear photo of your doctor's prescription to our WhatsApp hotline: **+91 86691 18742**.\n2. Our certified pharmacist will verify availability, pack genuine medicines, and dispatch them to your address.\n\n👉 [Click here to Order via WhatsApp](https://wa.me/918669118742)`;
    }

    // Contact / Phone / Helpline
    if (q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('call') || q.includes('helpline') || q.includes('email') || q.includes('नंबर') || q.includes('फोन') || q.includes('संपर्क')) {
        return `📞 **Official Contact Information:**\n\n- **Phone / WhatsApp Hotline:** +91 86691 18742\n- **Email:** janaklyanmedicalstore@gmail.com\n- **Location:** Near Wadhegaon Naka, Sangola 413307\n- **Working Hours:** 24 Hours × 7 Days Open`;
    }

    // Veterinary & Animal Healthcare
    if (q.includes('vet') || q.includes('veterinary') || q.includes('animal') || q.includes('cow') || q.includes('buffalo') || q.includes('ostovet') || q.includes('गाय') || q.includes('म्हैस') || q.includes('जनावरे') || q.includes('पशु')) {
        return `🐄 **Veterinary & Livestock Healthcare:**\n\nJankalyan Medical is Sangola's trusted stockist for veterinary care products, including:\n- **High-calcium milk tonics** (Ostovet, Calup, Vimeral)\n- **Livestock dewormers, bolus & wound sprays**\n- **Poultry & goat nutrition supplements**\n\nFor stock check or animal medicine advice, contact **+91 86691 18742**.`;
    }

    // Ayurvedic & Herbal
    if (q.includes('ayurvedic') || q.includes('herbal') || q.includes('dabur') || q.includes('patanjali') || q.includes('chyawanprash') || q.includes('आयुर्वेद') || q.includes('हर्बल') || q.includes('काढा')) {
        return `🌿 **Ayurvedic & Natural Wellness:**\n\nWe provide 100% genuine Ayurvedic medicines and wellness tonics from leading brands including Dabur, Baidyanath, Himalaya, and Zandu:\n- Immunity boosters & Chyawanprash\n- Herbal cough & digestive syrups\n- Joint pain relief oils & ashwagandha\n\nAvailable 24x7 at our Sangola store.`;
    }

    // Baby & Pediatric
    if (q.includes('baby') || q.includes('pediatric') || q.includes('child') || q.includes('infant') || q.includes('diaper') || q.includes('लहान') || q.includes('बाळ') || q.includes('मुले')) {
        return `👶 **Baby & Pediatric Care:**\n\nWe stock a dedicated range of baby healthcare essentials:\n- Pediatric drops, fever syrups, and colic relief\n- Baby infant formulas (Cerelac, Lactogen)\n- Diapers, baby wipes, and gentle dermatological lotions\n\nAvailable anytime (24x7) for emergency baby care in Sangola.`;
    }

    // Marathi Greetings & Help
    if (q.includes('नमस्कार') || q.includes('हाय') || q.includes('हॅलो') || q.includes('मदत') || q.includes('सांगा') || q.includes('मिळेल का')) {
        return `🙏 **नमस्कार! मी जनकल्याण मेडिकल सांगोला चा AI सहाय्यक आहे.**\n\n- ⏰ **वेळ:** २४ तास चालू (24x7 Open)\n- 📍 **पत्ता:** वाढेगाव नाक्याजवळ, सांगोला (४१३३०७)\n- 📞 **फोन / व्हॉट्सॲप ऑर्डर:** +91 86691 18742\n- 🚚 **घरपोच डिलिव्हरी:** सांगोला शहरात उपलब्ध\n\nतुम्हाला कोणती औषधे हवी आहेत? (उदा. ताप, खोकला, ॲसिडिटी, लहान मुलांची औषधे, पशुवैद्यकीय औषधे किंवा तपासणी साधने).`;
    }

    // General Greeting / Assistance
    return `Namaste! I am **Jankalyan Medical's AI Pharmacist Assistant** in Sangola.\n\n- ⏰ **Timings:** Open 24×7 Every Single Day\n- 📍 **Address:** Near Wadhegaon Naka, Sangola (413307)\n- 📞 **Hotline & WhatsApp Order:** +91 86691 18742\n- 🚚 **Delivery:** Express Home Delivery in Sangola\n- 💊 **Products:** Allopathic, Ayurvedic, Pediatric, Veterinary & Surgical\n\nPlease let me know what medicine, dosage, or store detail you are looking for!`;
}

async function sendMessage() {
    if (isAiSending) return;

    const input = document.getElementById('chat-input');
    const chatBody = document.getElementById('chat-body');
    const sendBtn = document.getElementById('chat-send-btn');

    if (!input || !chatBody) return;

    const message = input.value.trim();
    if (!message) return;

    // Append user message to UI
    const userMsgHtml = `
        <div class="chat-msg user">
            <div class="msg-avatar"><i class="fa-solid fa-user"></i></div>
            <div class="msg-content">
                <p>${escapeHtml(message)}</p>
            </div>
        </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', userMsgHtml);
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    // Append typing indicator
    const typingIndicatorId = 'ai-typing-indicator';
    const typingHtml = `
        <div class="chat-msg bot" id="${typingIndicatorId}">
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="chat-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', typingHtml);
    chatBody.scrollTop = chatBody.scrollHeight;

    isAiSending = true;
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.6';
    }

    let botReply = '';

    try {
        // Attempt primary endpoint /api/chat
        let response = null;
        try {
            response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    history: chatConversationHistory.slice(-8)
                })
            });
        } catch (fetchErr) {
            response = null;
        }

        // If /api/chat failed, was 404, or returned non-200, try Netlify serverless function
        if (!response || !response.ok) {
            try {
                response = await fetch('/.netlify/functions/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message,
                        history: chatConversationHistory.slice(-8)
                    })
                });
            } catch (netlifyErr) {
                response = null;
            }
        }

        if (response && response.ok) {
            const data = await response.json().catch(() => null);
            if (data && data.reply) {
                botReply = data.reply;
            } else if (data && data.error) {
                botReply = data.error;
            }
        }

        // If backend response is unavailable (e.g. static hosting on Netlify without server), use client-side pharmacy engine
        if (!botReply) {
            botReply = generateClientSidePharmacyReply(message);
        }

    } catch (err) {
        console.warn('Backend chat handled with client-side pharmacy engine:', err);
        botReply = generateClientSidePharmacyReply(message);
    } finally {
        const typingEl = document.getElementById(typingIndicatorId);
        if (typingEl) typingEl.remove();

        if (!botReply) {
            botReply = generateClientSidePharmacyReply(message);
        }

        // Store to conversation history
        chatConversationHistory.push({ role: 'user', text: message });
        chatConversationHistory.push({ role: 'model', text: botReply });

        const botMsgHtml = `
            <div class="chat-msg bot">
                <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="msg-content">
                    ${formatAiMarkdown(botReply)}
                </div>
            </div>
        `;
        chatBody.insertAdjacentHTML('beforeend', botMsgHtml);
        chatBody.scrollTop = chatBody.scrollHeight;

        isAiSending = false;
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
        }
        if (input) {
            input.focus();
        }
    }
}
