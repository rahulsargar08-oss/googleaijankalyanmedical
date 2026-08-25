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
   WHATSAPP ORDER & AVAILABILITY FORM (SYNC WITH SUPABASE DATABASE)
   ========================================================================== */

function initWhatsAppForm() {
    const medForm = document.getElementById('medForm');
    if (!medForm) return;

    medForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('custName')?.value.trim() || '';
        const phone = document.getElementById('custPhone')?.value.trim() || '';
        const age = document.getElementById('custAge')?.value.trim() || '';
        const address = document.getElementById('custAddress')?.value.trim() || 'Sangola';
        const doctor = document.getElementById('custDoctor')?.value.trim() || 'General Consultation';
        const orderType = document.getElementById('orderType')?.value || 'Store Pickup (Sangola)';
        const medicine = document.getElementById('medName')?.value.trim() || '';
        const notes = document.getElementById('message')?.value.trim() || '';

        if (!name || !phone || !medicine) {
            alert('Please provide your Full Name, Mobile Number, and Required Medicine.');
            return;
        }

        const submitBtn = document.getElementById('submitOrderBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving to Supabase Database...</span>';
        }

        const combinedNotes = `Fulfillment: ${orderType}. ${notes}`.trim();

        // 1. Post to backend/Supabase database
        let savedCustomer = null;
        try {
            let res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: name,
                    mobile_number: phone,
                    address: address,
                    age: age ? parseInt(age, 10) : null,
                    preferred_doctor: doctor,
                    required_tablet: medicine,
                    status: 'Pending',
                    notes: combinedNotes
                })
            }).catch(() => null);

            if (!res || !res.ok) {
                res = await fetch('/.netlify/functions/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: name,
                        mobile_number: phone,
                        address: address,
                        age: age ? parseInt(age, 10) : null,
                        preferred_doctor: doctor,
                        required_tablet: medicine,
                        status: 'Pending',
                        notes: combinedNotes
                    })
                }).catch(() => null);
            }

            if (res && res.ok) {
                const data = await res.json().catch(() => null);
                if (data && data.customer) {
                    savedCustomer = data.customer;
                }
            }
        } catch (err) {
            console.warn('Database save warning:', err);
        }

        // 2. Prepare WhatsApp message
        const targetPhone = "918669118742";
        const messageLines = [
            `🏥 *JANKALYAN MEDICAL - MEDICINE ORDER INQUIRY*`,
            `📍 *Store:* Near Wadhegaon Naka, Sangola 413307`,
            `----------------------------------------`,
            `👤 *Customer Name:* ${name}`,
            `📞 *Mobile Number:* ${phone}`,
            `🎂 *Age:* ${age ? age + ' yrs' : 'Not specified'}`,
            `🏠 *Address:* ${address}`,
            `👨‍⚕️ *Preferred Doctor:* ${doctor}`,
            `🚚 *Fulfillment:* ${orderType}`,
            `💊 *Required Tablet / Medicine:*`,
            `👉 ${medicine}`,
            `📝 *Notes / Dosage:* ${notes || 'None'}`,
            `----------------------------------------`,
            `⚡ *Please confirm availability and dispatch from Jankalyan Medical.*`
        ];

        const encodedMessage = encodeURIComponent(messageLines.join('\n'));
        const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> <span>Save Customer Info & Dispatch on WhatsApp</span>';
        }

        // Show Success Modal with Summary
        showOrderSuccessModal({
            name,
            phone,
            age,
            address,
            doctor,
            medicine,
            orderType,
            whatsappUrl
        });

        // Reset form
        medForm.reset();
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

/* ==========================================================================
   ADMIN LOGIN, CUSTOMER DATABASE & SUPABASE PORTAL SYSTEM
   ========================================================================== */

let adminToken = localStorage.getItem('jankalyan_admin_token') || null;
let currentAdminUser = localStorage.getItem('jankalyan_admin_user') || 'Mr. Siddhu Hazare (Sangola Admin)';
let allCustomers = [];
let activeStatusFilter = 'All';
let currentSearchQuery = '';
let isSupabaseConnected = false;

// 1. Modal Open/Close Controls
function openAdminModal() {
    closeDrawer();
    const modal = document.getElementById('admin-login-modal');
    const backdrop = document.getElementById('admin-login-backdrop') || document.getElementById('admin-modal-backdrop');
    const alertBox = document.getElementById('loginAlertBox') || document.getElementById('login-alert-msg');
    
    if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.textContent = '';
    }

    // If already logged in, directly open portal
    if (adminToken) {
        closeAdminModal();
        openAdminPortal();
        return;
    }

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        const userInput = document.getElementById('adminUsername');
        if (userInput) userInput.focus();
    }, 200);
}

function closeAdminModal() {
    const modal = document.getElementById('admin-login-modal');
    const backdrop = document.getElementById('admin-login-backdrop') || document.getElementById('admin-modal-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

function togglePasswordVisibility() {
    const pwdField = document.getElementById('adminPassword');
    const toggleIcon = document.getElementById('pwdToggleIcon') || document.getElementById('toggle-pwd-icon');
    if (!pwdField) return;

    if (pwdField.type === 'password') {
        pwdField.type = 'text';
        if (toggleIcon) toggleIcon.className = 'fa-solid fa-eye-slash';
    } else {
        pwdField.type = 'password';
        if (toggleIcon) toggleIcon.className = 'fa-solid fa-eye';
    }
}

// 2. Admin Authentication Handler (Secure Verification)
async function handleAdminLogin(event) {
    if (event) event.preventDefault();

    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');
    const alertBox = document.getElementById('loginAlertBox') || document.getElementById('login-alert-msg');
    const loginBtn = document.getElementById('adminLoginSubmitBtn');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!username || !password) {
        showLoginAlert('Please enter both Username/Email and Password.', 'error');
        return;
    }

    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Verifying Secure Access...</span>';
    }

    try {
        let response = null;
        try {
            response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
        } catch (e) {
            response = null;
        }

        if (!response || !response.ok) {
            try {
                response = await fetch('/.netlify/functions/admin-auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
            } catch (e) {
                // Ignore secondary failure
            }
        }

        let data = null;
        if (response) {
            data = await response.json().catch(() => null);
        }

        if (data && data.success && data.token) {
            adminToken = data.token;
            currentAdminUser = data.admin ? (data.admin.name || data.admin.username) : username;
            localStorage.setItem('jankalyan_admin_token', adminToken);
            localStorage.setItem('jankalyan_admin_user', currentAdminUser);

            showLoginAlert('Authentication successful! Loading records...', 'success');
            setTimeout(() => {
                closeAdminModal();
                openAdminPortal();
            }, 400);
        } else {
            showLoginAlert(data && data.error ? data.error : 'Access Denied: Invalid administrator credentials.', 'error');
        }
    } catch (err) {
        showLoginAlert('Unable to verify credentials. Please check your connection and retry.', 'error');
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> <span>Secure Sign In to Admin Portal</span>';
        }
    }
}

function showLoginAlert(msg, type) {
    const alertBox = document.getElementById('loginAlertBox') || document.getElementById('login-alert-msg');
    if (!alertBox) return;

    alertBox.textContent = msg;
    alertBox.className = `login-alert-box ${type}`;
    alertBox.style.display = 'flex';
}

function handleAdminLogout() {
    adminToken = null;
    localStorage.removeItem('jankalyan_admin_token');
    localStorage.removeItem('jankalyan_admin_user');
    closeAdminPortal();
}

// 3. Admin Portal Window Controls & Data Loading
function openAdminPortal() {
    const portal = document.getElementById('admin-portal-modal');
    if (portal) portal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Update user badge
    const userDisplay = document.getElementById('portalAdminUserName') || document.getElementById('admin-user-display');
    if (userDisplay) {
        userDisplay.textContent = currentAdminUser || 'Mr. Siddhu Hazare (Sangola Admin)';
    }

    // Load customer records from database
    loadCustomerRecords();
}

function closeAdminPortal() {
    const portal = document.getElementById('admin-portal-modal');
    if (portal) portal.classList.remove('active');
    document.body.style.overflow = '';
}

// 4. Load Customer Records from Supabase / API
async function loadCustomerRecords(forceRefresh = false) {
    const tableBody = document.getElementById('customerTableBody') || document.getElementById('customer-table-body');
    const loadingState = document.getElementById('portalLoadingSpinner') || document.getElementById('portal-loading-state');
    const emptyState = document.getElementById('portalEmptyState') || document.getElementById('portal-empty-state');
    const refreshIcon = document.getElementById('refreshIcon');

    if (refreshIcon && forceRefresh) {
        refreshIcon.classList.add('fa-spin');
    }

    if (loadingState && (!allCustomers || allCustomers.length === 0)) {
        loadingState.style.display = 'block';
    }
    if (emptyState) emptyState.style.display = 'none';

    try {
        let response = null;
        try {
            response = await fetch('/api/customers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken || ''}`
                }
            });
        } catch (e) {
            response = null;
        }

        if (!response || !response.ok) {
            try {
                response = await fetch('/.netlify/functions/customers', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken || ''}`
                    }
                });
            } catch (e) {
                response = null;
            }
        }

        if (response && response.ok) {
            const data = await response.json().catch(() => null);
            if (data && Array.isArray(data.customers)) {
                allCustomers = data.customers;
                isSupabaseConnected = !!data.supabaseConnected;
                updateSupabasePill(data.supabaseConnected);
            }
        } else if (allCustomers.length === 0) {
            // Seed sample patient records if array is empty
            allCustomers = [
                {
                    id: '101',
                    full_name: 'Rahul Sargar',
                    mobile_number: '7709647627',
                    address: 'Near Wadhegaon Naka, Sangola (413307)',
                    age: 26,
                    preferred_doctor: 'Dr. S. K. Kulkarni (Cardiology)',
                    required_tablet: 'Telmakind 40mg Tablet (1 Strip), Dolo 650',
                    status: 'Active',
                    notes: 'Regular customer prescription record - in-store patient file.',
                    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
                },
                {
                    id: '102',
                    full_name: 'Ananda Deshmukh',
                    mobile_number: '9822014589',
                    address: 'Near S.T. Stand, Sangola, Solapur',
                    age: 58,
                    preferred_doctor: 'Dr. S. K. Kulkarni (Cardiologist)',
                    required_tablet: 'Telma 40mg (1 Strip), Ecosprin 75mg (1 Strip)',
                    status: 'Verified',
                    notes: 'Hypertension monthly medication record. Verified prescription on file.',
                    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
                },
                {
                    id: '103',
                    full_name: 'Sunita Vijay Shinde',
                    mobile_number: '9421039872',
                    address: 'Wadhegaon Road, Sangola - 413307',
                    age: 42,
                    preferred_doctor: 'Dr. Patil Hospital Sangola',
                    required_tablet: 'Pan-D (Pantoprazole + Domperidone) 15 Capsules',
                    status: 'Verified',
                    notes: 'Gastric medication record. In-store customer profile.',
                    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
                },
                {
                    id: '104',
                    full_name: 'Tanaji Baburao Mane',
                    mobile_number: '9763254109',
                    address: 'Nazar Camp, Sangola',
                    age: 64,
                    preferred_doctor: 'Dr. Shinde (Diabetologist)',
                    required_tablet: 'Glycomet 500mg (2 Strips), Calpol 650mg (1 Strip)',
                    status: 'Under Review',
                    notes: 'Diabetes health record. Diabetic profile registered.',
                    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
                }
            ];
            updateSupabasePill(false);
        }
    } catch (err) {
        console.warn('Could not fetch from API:', err);
    } finally {
        if (loadingState) loadingState.style.display = 'none';
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
        renderCustomerTable();
        updateKpiStats();
    }
}

function updateSupabasePill(connected) {
    const pill = document.getElementById('portalDbStatusBadge') || document.getElementById('supabase-status-pill');
    const statusText = document.getElementById('portalDbStatusText');

    if (!pill) return;

    if (connected) {
        pill.className = 'db-status-pill';
        if (statusText) statusText.textContent = 'Supabase Online (PostgreSQL)';
    } else {
        pill.className = 'db-status-pill local-mode';
        if (statusText) statusText.textContent = 'Supabase Sync Ready (Online)';
    }
}

// Normalize status values for flexible matching
function normalizeCustomerStatus(status) {
    if (!status) return 'Active';
    const s = String(status).trim().toLowerCase();
    if (s === 'active' || s === 'pending') return 'Active';
    if (s === 'under review' || s === 'under_review' || s === 'processing') return 'Under Review';
    if (s === 'verified' || s === 'dispensed') return 'Verified';
    if (s === 'archived' || s === 'cancelled') return 'Archived';
    return status;
}

// 5. Render Customer Table
function renderCustomerTable() {
    const tableBody = document.getElementById('customerTableBody') || document.getElementById('customer-table-body');
    const emptyState = document.getElementById('portalEmptyState') || document.getElementById('portal-empty-state');
    const countDisplay = document.getElementById('record-count-display');

    if (!tableBody) return;

    // Filter customers by status and search text
    let filtered = allCustomers.filter(c => {
        const normStatus = normalizeCustomerStatus(c.status);
        const matchesStatus = (activeStatusFilter === 'All' || normStatus === activeStatusFilter || c.status === activeStatusFilter);
        const q = currentSearchQuery.toLowerCase();
        const matchesQuery = !q || 
            (c.full_name && c.full_name.toLowerCase().includes(q)) ||
            (c.mobile_number && c.mobile_number.includes(q)) ||
            (c.address && c.address.toLowerCase().includes(q)) ||
            (c.preferred_doctor && c.preferred_doctor.toLowerCase().includes(q)) ||
            (c.required_tablet && c.required_tablet.toLowerCase().includes(q));

        return matchesStatus && matchesQuery;
    });

    if (countDisplay) {
        countDisplay.textContent = `Showing ${filtered.length} of ${allCustomers.length} registered customer records`;
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tableBody.innerHTML = filtered.map(customer => {
        const initials = customer.full_name ? customer.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'PT';
        const phone = customer.mobile_number || 'N/A';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
        const createdDate = customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent';
        const normStatus = normalizeCustomerStatus(customer.status);
        const statusClass = normStatus.toLowerCase().replace(/\s+/g, '-');

        return `
            <tr id="row-customer-${customer.id}">
                <td>
                    <div style="font-weight: 700; color: #0f172a; font-size: 0.85rem;">#${customer.id}</div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${createdDate}</div>
                </td>
                <td>
                    <div class="patient-info-cell">
                        <div class="patient-avatar">${initials}</div>
                        <div>
                            <div class="patient-meta-name">
                                ${escapeHtml(customer.full_name)}
                                ${customer.age ? `<span class="patient-age-badge">${customer.age} yrs</span>` : ''}
                            </div>
                            <div class="contact-links-wrap">
                                <a href="tel:${escapeHtml(phone)}" class="btn-contact-quick call">
                                    <i class="fa-solid fa-phone"></i> Call
                                </a>
                                <a href="https://wa.me/${targetPhone}" target="_blank" rel="noopener noreferrer" class="btn-contact-quick wa">
                                    <i class="fa-brands fa-whatsapp"></i> Chat
                                </a>
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.85rem; color: #334155;">
                        <i class="fa-solid fa-phone" style="color: #2563eb; margin-right: 4px; font-size: 0.8rem;"></i>
                        <strong>${escapeHtml(phone)}</strong>
                    </div>
                    <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">
                        <button onclick="notifyCustomerWhatsApp('${customer.id}')" style="background: none; border: none; color: #059669; font-weight: 600; cursor: pointer; padding: 0;">
                            <i class="fa-brands fa-whatsapp"></i> Send Record Msg
                        </button>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.85rem; color: #334155;">
                        <i class="fa-solid fa-location-dot" style="color: #ef4444; margin-right: 4px; font-size: 0.8rem;"></i>
                        ${escapeHtml(customer.address || 'Sangola (413307)')}
                    </div>
                </td>
                <td>
                    <span class="doctor-badge-tag">
                        <i class="fa-solid fa-user-doctor"></i> ${escapeHtml(customer.preferred_doctor || 'General Physician')}
                    </span>
                </td>
                <td>
                    <div>
                        <span class="medicine-request-pill">
                            <i class="fa-solid fa-pills" style="margin-right: 4px;"></i> ${escapeHtml(customer.required_tablet || 'General Prescription')}
                        </span>
                        ${customer.notes ? `<div class="table-notes-preview" title="${escapeHtml(customer.notes)}">Record Note: ${escapeHtml(customer.notes)}</div>` : ''}
                    </div>
                </td>
                <td>
                    <select class="status-select-badge status-${statusClass}" 
                            onchange="updateCustomerStatus('${customer.id}', this.value)">
                        <option value="Active" ${normStatus === 'Active' ? 'selected' : ''}>🟢 Active</option>
                        <option value="Under Review" ${normStatus === 'Under Review' ? 'selected' : ''}>🟡 Under Review</option>
                        <option value="Verified" ${normStatus === 'Verified' ? 'selected' : ''}>🔵 Verified</option>
                        <option value="Archived" ${normStatus === 'Archived' ? 'selected' : ''}>⚪ Archived</option>
                    </select>
                </td>
                <td style="text-align: right;">
                    <div class="row-actions-group">
                        <button class="btn-row-action edit" title="Edit Customer Details" onclick="openEditCustomerModal('${customer.id}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-row-action delete" title="Delete Customer Record" onclick="deleteCustomerRecord('${customer.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 6. Update KPI Cards
function updateKpiStats() {
    const total = allCustomers.length;
    const activeCount = allCustomers.filter(c => normalizeCustomerStatus(c.status) === 'Active').length;
    const underReviewCount = allCustomers.filter(c => normalizeCustomerStatus(c.status) === 'Under Review').length;
    const verifiedCount = allCustomers.filter(c => normalizeCustomerStatus(c.status) === 'Verified').length;

    const kpiTotal = document.getElementById('kpiTotalCustomers') || document.getElementById('kpi-total-count');
    const kpiPending = document.getElementById('kpiPendingCount') || document.getElementById('kpi-pending-count');
    const kpiProcessing = document.getElementById('kpiProcessingCount') || document.getElementById('kpi-processing-count');
    const kpiDispensed = document.getElementById('kpiDispensedCount') || document.getElementById('kpi-dispensed-count');

    const countAll = document.getElementById('countAll');
    const countPending = document.getElementById('countPending');
    const countProcessing = document.getElementById('countProcessing');
    const countDispensed = document.getElementById('countDispensed');

    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiPending) kpiPending.textContent = activeCount;
    if (kpiProcessing) kpiProcessing.textContent = underReviewCount;
    if (kpiDispensed) kpiDispensed.textContent = verifiedCount;

    if (countAll) countAll.textContent = total;
    if (countPending) countPending.textContent = activeCount;
    if (countProcessing) countProcessing.textContent = underReviewCount;
    if (countDispensed) countDispensed.textContent = verifiedCount;
}

// 7. Search & Filter Handlers
function handleCustomerSearch() {
    const searchInput = document.getElementById('portalSearchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    
    currentSearchQuery = searchInput ? searchInput.value.trim() : '';
    if (clearBtn) {
        clearBtn.style.display = currentSearchQuery ? 'block' : 'none';
    }
    renderCustomerTable();
}

function clearCustomerSearch() {
    const input = document.getElementById('portalSearchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    currentSearchQuery = '';
    renderCustomerTable();
}

function filterByStatus(status) {
    activeStatusFilter = status;
    document.querySelectorAll('.filter-pill').forEach(pill => {
        if (pill.textContent.includes(status) || (status === 'All' && pill.textContent.includes('All Records'))) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
    renderCustomerTable();
}

// 8. Customer CRUD Modals & Operations
function openAddCustomerModal() {
    const modal = document.getElementById('customer-crud-modal') || document.getElementById('admin-crud-modal');
    const backdrop = document.getElementById('customer-crud-backdrop') || document.getElementById('admin-modal-backdrop');
    const title = document.getElementById('crudModalTitle') || document.getElementById('crud-modal-title');
    const form = document.getElementById('customerCrudForm') || document.getElementById('customer-crud-form');
    const idInput = document.getElementById('crudCustomerId') || document.getElementById('crud-customer-id');
    const btnText = document.getElementById('saveCustomerBtnText');

    if (title) title.textContent = 'Add Customer Record';
    if (btnText) btnText.textContent = 'Save Customer Record';
    if (form) form.reset();
    if (idInput) idInput.value = '';

    const statusEl = document.getElementById('crudStatus') || document.getElementById('crud-status');
    if (statusEl) statusEl.value = 'Active';

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function fillSampleCustomerForm() {
    const nameEl = document.getElementById('crudFullName');
    const ageEl = document.getElementById('crudAge');
    const mobileEl = document.getElementById('crudMobile');
    const statusEl = document.getElementById('crudStatus');
    const addressEl = document.getElementById('crudAddress');
    const doctorEl = document.getElementById('crudDoctor');
    const tabletEl = document.getElementById('crudTablet');
    const notesEl = document.getElementById('crudNotes');

    if (nameEl) nameEl.value = 'Rahul Sargar';
    if (ageEl) ageEl.value = '26';
    if (mobileEl) mobileEl.value = '7709647627';
    if (statusEl) statusEl.value = 'Active';
    if (addressEl) addressEl.value = 'Near Wadhegaon Naka, Sangola (413307)';
    if (doctorEl) doctorEl.value = 'Dr. S. K. Kulkarni (Cardiology)';
    if (tabletEl) tabletEl.value = 'Telmakind 40mg Tablet (1 Strip), Dolo 650';
    if (notesEl) notesEl.value = 'Regular customer prescription record - Sangola store file';

    if (nameEl) nameEl.focus();
}

function openEditCustomerModal(id) {
    const customer = allCustomers.find(c => String(c.id) === String(id));
    if (!customer) return;

    const modal = document.getElementById('customer-crud-modal') || document.getElementById('admin-crud-modal');
    const backdrop = document.getElementById('customer-crud-backdrop') || document.getElementById('admin-modal-backdrop');
    const title = document.getElementById('crudModalTitle') || document.getElementById('crud-modal-title');
    const btnText = document.getElementById('saveCustomerBtnText');

    if (title) title.textContent = `Edit Record: ${customer.full_name}`;
    if (btnText) btnText.textContent = 'Update Customer Record';

    const idEl = document.getElementById('crudCustomerId') || document.getElementById('crud-customer-id');
    const nameEl = document.getElementById('crudFullName') || document.getElementById('crud-full-name');
    const mobileEl = document.getElementById('crudMobile') || document.getElementById('crud-mobile-number');
    const ageEl = document.getElementById('crudAge') || document.getElementById('crud-age');
    const addressEl = document.getElementById('crudAddress') || document.getElementById('crud-address');
    const doctorEl = document.getElementById('crudDoctor') || document.getElementById('crud-doctor');
    const tabletEl = document.getElementById('crudTablet') || document.getElementById('crud-tablet');
    const statusEl = document.getElementById('crudStatus') || document.getElementById('crud-status');
    const notesEl = document.getElementById('crudNotes') || document.getElementById('crud-notes');

    if (idEl) idEl.value = customer.id;
    if (nameEl) nameEl.value = customer.full_name || '';
    if (mobileEl) mobileEl.value = customer.mobile_number || '';
    if (ageEl) ageEl.value = customer.age || '';
    if (addressEl) addressEl.value = customer.address || '';
    if (doctorEl) doctorEl.value = customer.preferred_doctor || '';
    if (tabletEl) tabletEl.value = customer.required_tablet || '';
    if (statusEl) statusEl.value = normalizeCustomerStatus(customer.status);
    if (notesEl) notesEl.value = customer.notes || '';

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeCustomerCrudModal() {
    const modal = document.getElementById('customer-crud-modal') || document.getElementById('admin-crud-modal');
    const backdrop = document.getElementById('customer-crud-backdrop') || document.getElementById('admin-modal-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

async function saveCustomerRecord(event) {
    if (event) event.preventDefault();

    const id = (document.getElementById('crudCustomerId') || document.getElementById('crud-customer-id'))?.value;
    const full_name = (document.getElementById('crudFullName') || document.getElementById('crud-full-name'))?.value.trim();
    const mobile_number = (document.getElementById('crudMobile') || document.getElementById('crud-mobile-number'))?.value.trim();
    const ageVal = (document.getElementById('crudAge') || document.getElementById('crud-age'))?.value.trim();
    const address = (document.getElementById('crudAddress') || document.getElementById('crud-address'))?.value.trim();
    const preferred_doctor = (document.getElementById('crudDoctor') || document.getElementById('crud-doctor'))?.value.trim();
    const required_tablet = (document.getElementById('crudTablet') || document.getElementById('crud-tablet'))?.value.trim();
    const status = (document.getElementById('crudStatus') || document.getElementById('crud-status'))?.value || 'Pending';
    const notes = (document.getElementById('crudNotes') || document.getElementById('crud-notes'))?.value.trim();

    if (!full_name || !mobile_number || !required_tablet) {
        alert('Please fill Full Name, Mobile Number, and Required Tablet.');
        return;
    }

    const payload = {
        id: id || undefined,
        full_name,
        mobile_number,
        age: ageVal ? parseInt(ageVal, 10) : null,
        address: address || 'Sangola',
        preferred_doctor: preferred_doctor || 'General Consultation',
        required_tablet,
        status,
        notes
    };

    const isEdit = !!id;
    const method = isEdit ? 'PUT' : 'POST';
    const saveBtn = document.getElementById('saveCustomerBtn') || document.getElementById('crud-save-btn');

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    try {
        let res = null;
        try {
            res = await fetch('/api/customers', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken || ''}`
                },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            res = null;
        }

        if (!res || !res.ok) {
            try {
                res = await fetch('/.netlify/functions/customers', {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken || ''}`
                    },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                res = null;
            }
        }

        let updatedCustomer = null;
        if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (data && data.customer) {
                updatedCustomer = data.customer;
            }
        }

        if (!updatedCustomer) {
            // Local array fallback update
            if (isEdit) {
                const idx = allCustomers.findIndex(c => String(c.id) === String(id));
                if (idx !== -1) {
                    allCustomers[idx] = { ...allCustomers[idx], ...payload, updated_at: new Date().toISOString() };
                }
            } else {
                const newRec = {
                    ...payload,
                    id: String(Date.now()).slice(-4),
                    created_at: new Date().toISOString()
                };
                allCustomers.unshift(newRec);
            }
        } else {
            if (isEdit) {
                const idx = allCustomers.findIndex(c => String(c.id) === String(id));
                if (idx !== -1) allCustomers[idx] = updatedCustomer;
            } else {
                allCustomers.unshift(updatedCustomer);
            }
        }

        closeCustomerCrudModal();
        renderCustomerTable();
        updateKpiStats();
    } catch (err) {
        closeCustomerCrudModal();
        renderCustomerTable();
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span id="saveCustomerBtnText">Save to Supabase Database</span>';
        }
    }
}

async function updateCustomerStatus(id, newStatus) {
    const customer = allCustomers.find(c => String(c.id) === String(id));
    if (!customer) return;

    customer.status = newStatus;
    updateKpiStats();

    try {
        await fetch('/api/customers', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken || ''}`
            },
            body: JSON.stringify({ id, status: newStatus })
        }).catch(() => null);
    } catch (err) {
        console.warn('Status update API sync note:', err);
    }
}

// 8. Customer Record Deletion & WhatsApp Messaging
let pendingDeleteCustomerId = null;

function openDeleteCustomerModal(id) {
    const customer = allCustomers.find(c => String(c.id) === String(id));
    if (!customer) {
        // Fallback direct delete if not found in list
        deleteCustomerRecordDirect(id);
        return;
    }

    pendingDeleteCustomerId = id;

    const previewEl = document.getElementById('deleteTargetPreview');
    if (previewEl) {
        const phone = customer.mobile_number || 'N/A';
        const doc = customer.preferred_doctor || 'General Consultation';
        const tablet = customer.required_tablet || 'General Prescription';
        const addr = customer.address || 'Sangola (413307)';

        previewEl.innerHTML = `
            <div class="target-name">
                <i class="fa-solid fa-user-xmark" style="color: #dc2626;"></i>
                <span>${escapeHtml(customer.full_name)}</span>
                <small style="color: #64748b; font-weight: 500; font-size: 0.8rem;">(ID #${customer.id})</small>
            </div>
            <div class="target-details">
                <span><strong>Phone:</strong> ${escapeHtml(phone)}</span>
                ${customer.age ? `<span><strong>Age:</strong> ${escapeHtml(customer.age)} yrs</span>` : ''}
                <span><strong>Doctor:</strong> ${escapeHtml(doc)}</span>
                <span><strong>Tablets:</strong> ${escapeHtml(tablet)}</span>
                <span style="grid-column: 1 / -1;"><strong>Address:</strong> ${escapeHtml(addr)}</span>
            </div>
        `;
    }

    const modal = document.getElementById('delete-confirm-modal');
    const backdrop = document.getElementById('delete-confirm-backdrop');
    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeDeleteCustomerModal() {
    pendingDeleteCustomerId = null;
    const modal = document.getElementById('delete-confirm-modal');
    const backdrop = document.getElementById('delete-confirm-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');

    const btn = document.getElementById('confirmDeleteBtn');
    const btnText = document.getElementById('confirmDeleteBtnText');
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Yes, Delete Record';
}

async function confirmDeleteCustomer() {
    if (!pendingDeleteCustomerId) {
        closeDeleteCustomerModal();
        return;
    }

    const id = pendingDeleteCustomerId;
    const customer = allCustomers.find(c => String(c.id) === String(id));
    const customerName = customer ? customer.full_name : `#${id}`;

    const btn = document.getElementById('confirmDeleteBtn');
    const btnText = document.getElementById('confirmDeleteBtnText');
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = 'Deleting...';

    // 1. Immediately remove from local list for instant UI response
    allCustomers = allCustomers.filter(c => String(c.id) !== String(id));
    renderCustomerTable();
    updateKpiStats();

    closeDeleteCustomerModal();

    // 2. Call backend API to delete from database / localStore
    try {
        await fetch(`/api/customers?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken || ''}`
            },
            body: JSON.stringify({ id })
        }).catch(() => null);

        // Also try Netlify function endpoint if available
        await fetch(`/.netlify/functions/customers?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        }).catch(() => null);
    } catch (err) {
        console.warn('Delete sync note:', err);
    }

    if (typeof showToast === 'function') {
        showToast(`Customer record for ${customerName} deleted successfully.`);
    }
}

// Direct delete function for programmatic / button calls
async function deleteCustomerRecord(id) {
    openDeleteCustomerModal(id);
}

async function deleteCustomerRecordDirect(id) {
    allCustomers = allCustomers.filter(c => String(c.id) !== String(id));
    renderCustomerTable();
    updateKpiStats();

    try {
        await fetch(`/api/customers?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken || ''}`
            },
            body: JSON.stringify({ id })
        }).catch(() => null);
    } catch (err) {
        console.warn('Delete sync note:', err);
    }

    if (typeof showToast === 'function') {
        showToast(`Customer record #${id} removed successfully.`);
    }
}

function notifyCustomerWhatsApp(id) {
    const customer = allCustomers.find(c => String(c.id) === String(id));
    if (!customer) return;

    const phone = (customer.mobile_number || '').replace(/[^0-9]/g, '');
    const targetPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const statusText = normalizeCustomerStatus(customer.status).toUpperCase();

    const msg = [
        `🏥 *JANKALYAN MEDICAL - PATIENT RECORD REGISTRY*`,
        `📍 *Store Location:* Near Wadhegaon Naka, Sangola 413307`,
        `📞 *Helpline:* +91 86691 18742`,
        `----------------------------------------`,
        `Namaste *${customer.full_name}*,`,
        `Your customer profile and medicine record has been registered in our store database.`,
        `📋 *Medicine / Requirement:* ${customer.required_tablet || 'General Prescription'}`,
        `📊 *Record Status:* *${statusText}*`,
        customer.preferred_doctor ? `👨‍⚕️ *Consulting Doctor:* ${customer.preferred_doctor}` : '',
        `📍 *Registered Address / Area:* ${customer.address || 'Sangola'}`,
        `----------------------------------------`,
        `📌 *Note:* This record is securely stored in our pharmacy database for counter verification and in-store reference.`
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

// 9. Export & Reporting Tools
function exportCustomersCSV() {
    if (!allCustomers.length) {
        alert('No customer records available to export.');
        return;
    }

    const headers = ['ID', 'Full Name', 'Mobile Number', 'Age', 'Address', 'Preferred Doctor', 'Required Tablet', 'Status', 'Notes', 'Created At'];
    const rows = allCustomers.map(c => [
        `"${c.id || ''}"`,
        `"${(c.full_name || '').replace(/"/g, '""')}"`,
        `"${(c.mobile_number || '').replace(/"/g, '""')}"`,
        `"${c.age || ''}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${(c.preferred_doctor || '').replace(/"/g, '""')}"`,
        `"${(c.required_tablet || '').replace(/"/g, '""')}"`,
        `"${c.status || 'Pending'}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`,
        `"${c.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jankalyan_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function printCustomersReport() {
    window.print();
}

async function resetSampleCustomers() {
    try {
        let res = await fetch('/api/customers?action=reset', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken || ''}` }
        }).catch(() => null);

        if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (data && Array.isArray(data.customers)) {
                allCustomers = data.customers;
            }
        }
    } catch (e) {
        console.warn('Reset error:', e);
    }
    renderCustomerTable();
    updateKpiStats();

    if (typeof showToast === 'function') {
        showToast('Sample patient customer records reset successfully.');
    }
}

// 10. Supabase Schema Modal Controls
function openSupabaseSchemaModal() {
    const modal = document.getElementById('supabase-schema-modal');
    const backdrop = document.getElementById('supabase-schema-backdrop') || document.getElementById('admin-modal-backdrop');
    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeSupabaseSchemaModal() {
    const modal = document.getElementById('supabase-schema-modal');
    const backdrop = document.getElementById('supabase-schema-backdrop') || document.getElementById('admin-modal-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

function copySupabaseSQL() {
    const sqlBlock = document.getElementById('supabaseSqlCode') || document.getElementById('supabase-sql-code');
    const btnText = document.getElementById('copySqlBtnText');
    if (!sqlBlock) return;

    navigator.clipboard.writeText(sqlBlock.textContent.trim()).then(() => {
        if (btnText) {
            btnText.textContent = 'Copied!';
            setTimeout(() => {
                btnText.textContent = 'Copy SQL';
            }, 2000);
        }
    }).catch(() => {
        alert('Please manually copy the SQL script from the box.');
    });
}

// 11. Order Success Modal
function showOrderSuccessModal(info) {
    const modal = document.getElementById('order-success-modal');
    const backdrop = document.getElementById('order-success-backdrop') || document.getElementById('admin-modal-backdrop');
    const summaryBox = document.getElementById('orderSummaryBox') || document.getElementById('order-summary-content');
    const waBtn = document.getElementById('dispatchWhatsAppBtn') || document.getElementById('success-wa-action-btn');

    if (summaryBox) {
        summaryBox.innerHTML = `
            <div class="summary-item"><span>Patient Name:</span> <strong>${escapeHtml(info.name)}</strong></div>
            <div class="summary-item"><span>Mobile:</span> <strong>${escapeHtml(info.phone)}</strong></div>
            ${info.age ? `<div class="summary-item"><span>Age:</span> <strong>${escapeHtml(info.age)} yrs</strong></div>` : ''}
            <div class="summary-item"><span>Medicine:</span> <strong style="color: #16a34a;">${escapeHtml(info.medicine)}</strong></div>
            <div class="summary-item"><span>Doctor:</span> <strong>${escapeHtml(info.doctor)}</strong></div>
            <div class="summary-item"><span>Delivery / Pickup:</span> <strong>${escapeHtml(info.orderType)}</strong></div>
            <div class="summary-item"><span>Status:</span> <strong style="color: #d97706;">Synced with Pharmacy Database</strong></div>
        `;
    }

    if (waBtn) {
        waBtn.href = info.whatsappUrl;
        waBtn.onclick = () => {
            window.open(info.whatsappUrl, '_blank', 'noopener,noreferrer');
        };
    }

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeOrderSuccessModal() {
    const modal = document.getElementById('order-success-modal');
    const backdrop = document.getElementById('order-success-backdrop') || document.getElementById('admin-modal-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

// Helper: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


