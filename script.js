/**
 * JANKALYAN MEDICAL - CLIENT LOGIC & INTERACTIVITY
 * Sangola's 24x7 Certified Community Pharmacy
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollSpy();
    initWhatsAppForm();
    initHeaderScroll();
    checkAdminAccountStatus();

    // Initialize public medicine items container if empty
    const pubList = document.getElementById('publicMedicinesList');
    if (pubList && pubList.children.length === 0) {
        addPublicMedicineRow({ name: 'Telmakind 40mg', type: 'Tablet', strength: '40mg', quantity: '1 Strip' });
    }
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
        const gender = document.getElementById('custGender')?.value || 'Not Specified';
        const address = document.getElementById('custAddress')?.value.trim() || 'Near Wadhegaon Naka';
        const areaVillage = document.getElementById('custAreaVillage')?.value.trim() || 'Sangola (413307)';
        const prescriptionAvail = document.getElementById('medPrescription')?.value || 'Yes';
        const doctor = document.getElementById('custDoctor')?.value.trim() || 'General Consultation / Self';
        const notes = document.getElementById('message')?.value.trim() || '';

        // Get medicines from dynamic list
        const publicMeds = typeof getPublicMedicinesData === 'function' ? getPublicMedicinesData() : [];
        const fallbackMed = document.getElementById('medName')?.value.trim() || '';
        const fallbackStrength = document.getElementById('medStrength')?.value.trim() || '';
        const fallbackType = document.getElementById('medType')?.value || 'Tablet';

        const medicines = publicMeds.length > 0
            ? publicMeds
            : (fallbackMed ? [{ name: fallbackMed, strength: fallbackStrength, type: fallbackType, quantity: '' }] : []);

        if (!name || !phone || medicines.length === 0) {
            alert('Please provide Full Name, Mobile Number, and at least one Medicine (e.g. tablet or syrup).');
            return;
        }

        const medSummary = medicines.map((m, idx) => {
            let txt = m.name;
            if (m.strength) txt += ` (${m.strength})`;
            if (m.quantity) txt += ` [${m.quantity}]`;
            return medicines.length > 1 ? `${idx + 1}. ${txt}` : txt;
        }).join(' | ');

        const uniqueTypes = [...new Set(medicines.map(m => m.type))];
        const typeSummary = uniqueTypes.join(', ');
        const strengthSummary = medicines.map(m => m.strength).filter(Boolean).join(', ');

        const submitBtn = document.getElementById('submitOrderBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving to Supabase Database...</span>';
        }

        const customerPayload = {
            full_name: name,
            mobile_number: phone,
            age: age ? parseInt(age, 10) : null,
            gender: gender,
            address: address,
            area_village: areaVillage,
            medicines: medicines,
            medicine_name: medSummary,
            required_tablet: medSummary,
            medicine_strength: strengthSummary,
            medicine_type: typeSummary || 'Tablet',
            preferred_doctor: doctor,
            prescription_available: prescriptionAvail,
            status: 'Active',
            notes: notes
        };

        // 1. Post to backend / Supabase database
        let savedCustomer = null;
        try {
            let res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerPayload)
            }).catch(() => null);

            if (!res || !res.ok) {
                res = await fetch('/.netlify/functions/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customerPayload)
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

        // Cache customer locally
        if (savedCustomer) {
            allCustomers.unshift(savedCustomer);
        } else {
            const fallbackCust = {
                id: String(Date.now()).slice(-4),
                ...customerPayload,
                created_at: new Date().toISOString()
            };
            allCustomers.unshift(fallbackCust);
        }
        try {
            localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(allCustomers));
        } catch (e) {
            // cache warning
        }

        // 2. Prepare WhatsApp message itemizing all medicines (tablets, syrups, etc.)
        const targetPhone = "918669118742";
        const medsLines = medicines.map((m, i) => {
            let line = `   ${i + 1}. *${m.name}* [${m.type}]`;
            if (m.strength) line += ` - ${m.strength}`;
            if (m.quantity) line += ` (Qty: ${m.quantity})`;
            return line;
        });

        const messageLines = [
            `🏥 *JANKALYAN MEDICAL - MEDICINE REQUIREMENT RECORD*`,
            `📍 *Store:* Near Wadhegaon Naka, Sangola 413307`,
            `----------------------------------------`,
            `👤 *Customer Name:* ${name}`,
            `📞 *Mobile Number:* ${phone}`,
            `🎂 *Age / Gender:* ${age ? age + ' yrs' : 'N/A'} | ${gender}`,
            `🏠 *Address:* ${address}`,
            `📍 *Area / Village:* ${areaVillage}`,
            `----------------------------------------`,
            `💊 *Medicines Required (${medicines.length} Item${medicines.length > 1 ? 's' : ''}):*`,
            ...medsLines,
            `📋 *Prescription Available:* ${prescriptionAvail}`,
            `👨‍⚕️ *Preferred Doctor:* ${doctor}`,
            notes ? `📝 *Notes / Requirement:* ${notes}` : '',
            `----------------------------------------`,
            `⚡ *Saved to Supabase database. Please confirm medicine availability at Jankalyan Medical Sangola.*`
        ].filter(Boolean);

        const encodedMessage = encodeURIComponent(messageLines.join('\n'));
        const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> <span>Save to Supabase & Dispatch on WhatsApp</span>';
        }

        // Show Success Modal with Summary
        showOrderSuccessModal({
            name,
            phone,
            age,
            gender,
            address,
            areaVillage,
            doctor,
            medicines,
            medicine: medSummary,
            strength: strengthSummary,
            medType: typeSummary,
            prescriptionAvail,
            whatsappUrl
        });

        // Reset form and reinitialize public medicines list with 1 default item
        medForm.reset();
        const pubContainer = document.getElementById('publicMedicinesList');
        if (pubContainer) {
            pubContainer.innerHTML = '';
            addPublicMedicineRow();
        }
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
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
    if (q.includes('owner') || q.includes('proprietor') || q.includes('malak') || q.includes('siddhu') || q.includes('hazare') || q.includes('hajare') || q.includes('मालक') || q.includes('संचालक')) {
        return `👤 **Store Ownership:**\n\n**Jankalyan Medical** is owned and managed by **Mr. Siddhu Hajare**.\n\nFor store inquiries, bulk medical requirements, or patient assistance, you can contact Mr. Siddhu Hajare at **+91 86691 18742**.`;
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
   ADMIN LOGIN, SINGLE-SLOT SETUP, CUSTOMER DATABASE & SUPABASE PORTAL SYSTEM
   ========================================================================== */

const CUSTOMERS_STORAGE_KEY = 'jankalyan_customers_store_v3';

let adminToken = localStorage.getItem('jankalyan_admin_token') || null;
let currentAdminUser = localStorage.getItem('jankalyan_admin_user') || 'Mr. Siddhu Hajare (Sangola Admin)';
let isSingleSlotAvailable = true;
let isSingleSlotConfigured = false;
let currentAdminData = null;

let allCustomers = [];
try {
    const cached = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
            allCustomers = parsed;
        }
    }
} catch (e) {
    console.warn('Customer cache parse notice:', e);
}
let activeStatusFilter = 'All';
let currentSearchQuery = '';
let isSupabaseConnected = false;

// 1. Single Slot Status Check
async function checkAdminAccountStatus() {
    try {
        let res = await fetch('/api/admin/account-status').catch(() => null);
        if (!res || !res.ok) {
            res = await fetch('/.netlify/functions/admin-auth/account-status').catch(() => null);
        }

        if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (data && data.success) {
                isSingleSlotAvailable = !!data.slotAvailable;
                isSingleSlotConfigured = !!data.isConfigured;
                if (data.admin) {
                    currentAdminData = data.admin;
                }
                updateAdminSlotUI();
            }
        }
    } catch (e) {
        console.warn('Status check warning:', e);
    }
}

function updateAdminSlotUI() {
    // 1. Footer pills & badges
    const footerBadge = document.getElementById('footerAdminStatusPill');
    const footerSlotText = document.getElementById('footerSlotText');
    const footerSlotTag = document.getElementById('footerSlotTag');

    if (footerBadge) {
        if (isSingleSlotAvailable) {
            footerBadge.innerHTML = '<i class="fa-solid fa-user-plus" style="color: #10b981;"></i> <span>Admin Registration (1 Slot Available)</span>';
        } else {
            footerBadge.innerHTML = '<i class="fa-solid fa-lock" style="color: #38bdf8;"></i> <span>Admin Sign In (Slot Claimed)</span>';
        }
    }

    if (footerSlotText) {
        footerSlotText.textContent = isSingleSlotAvailable ? '1 Slot Open' : 'Slot Locked';
    }
    if (footerSlotTag) {
        footerSlotTag.textContent = isSingleSlotAvailable ? '1 Slot Open' : 'Claimed';
        footerSlotTag.className = isSingleSlotAvailable ? 'slot-pill-tag' : 'slot-pill-tag locked';
    }

    // 2. Modal Slot Banner
    const banner = document.getElementById('slotBanner');
    const bannerIcon = document.getElementById('slotBannerIcon');
    const bannerTitle = document.getElementById('slotBannerTitle');
    const bannerDesc = document.getElementById('slotBannerDesc');

    if (banner && bannerIcon && bannerTitle && bannerDesc) {
        if (isSingleSlotAvailable) {
            banner.className = 'admin-slot-banner';
            bannerIcon.innerHTML = '<i class="fa-solid fa-shield-check"></i>';
            bannerTitle.textContent = '1 Master Admin Slot Available';
            bannerDesc.textContent = 'No administrator account has been set up yet. Create your single master admin credentials now to lock the slot.';
        } else {
            banner.className = 'admin-slot-banner locked';
            bannerIcon.innerHTML = '<i class="fa-solid fa-lock"></i>';
            bannerTitle.textContent = 'Admin Slot Locked (Single-Slot Enforced)';
            bannerDesc.textContent = `Master administrator account is active (${currentAdminData ? currentAdminData.name || currentAdminData.username : 'Configured'}). Subsequent account creation is locked.`;
        }
    }

    // 3. Modal Tabs
    const tabRegister = document.getElementById('authTabRegister');
    const registerBadge = document.getElementById('registerTabBadge');

    if (tabRegister) {
        if (isSingleSlotAvailable) {
            tabRegister.classList.remove('disabled');
            tabRegister.title = 'Create Master Admin Account';
            if (registerBadge) registerBadge.textContent = '1 Slot';
        } else {
            tabRegister.classList.add('disabled');
            tabRegister.title = 'Admin slot already claimed & locked';
            if (registerBadge) registerBadge.textContent = 'Locked';
        }
    }
}

// 2. Modal Open/Close Controls & Tab Switching
async function openAdminModal() {
    closeDrawer();
    checkAdminAccountStatus();

    const modal = document.getElementById('admin-login-modal');
    const backdrop = document.getElementById('admin-login-backdrop') || document.getElementById('admin-modal-backdrop');
    const alertBox = document.getElementById('loginAlertBox') || document.getElementById('login-alert-msg');
    
    if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.textContent = '';
    }

    // If stored session token exists, verify its integrity with the secure backend
    if (adminToken) {
        try {
            const verifyRes = await fetch('/api/admin/verify-token', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                if (verifyData && verifyData.success) {
                    closeAdminModal();
                    openAdminPortal();
                    return;
                }
            }
        } catch (e) {
            // If offline, allow local cached session
            closeAdminModal();
            openAdminPortal();
            return;
        }
        // Token expired or invalid: reset session cleanly
        adminToken = null;
        localStorage.removeItem('jankalyan_admin_token');
        localStorage.removeItem('jankalyan_admin_user');
    }

    // Auto switch to register if slot is available and not yet configured
    if (isSingleSlotAvailable) {
        switchAuthTab('register');
    } else {
        switchAuthTab('login');
    }

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAdminModal() {
    const modal = document.getElementById('admin-login-modal');
    const backdrop = document.getElementById('admin-login-backdrop') || document.getElementById('admin-modal-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

function switchAuthTab(tab) {
    const tabLogin = document.getElementById('authTabLogin') || document.getElementById('tabBtnSignIn');
    const tabRegister = document.getElementById('authTabRegister') || document.getElementById('tabBtnRegister');
    const loginForm = document.getElementById('adminLoginForm');
    const regForm = document.getElementById('adminRegisterForm');
    const alertBox = document.getElementById('loginAlertBox');

    if (alertBox) alertBox.style.display = 'none';

    if (tab === 'register') {
        if (!isSingleSlotAvailable) {
            showLoginAlert('Administrator account has already been registered. Only 1 admin slot is allowed. Please sign in.', 'error');
            return;
        }
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.add('active');
        if (loginForm) loginForm.style.display = 'none';
        if (regForm) regForm.style.display = 'block';

        setTimeout(() => {
            const el = document.getElementById('regAdminName') || document.getElementById('regFullName');
            if (el) el.focus();
        }, 150);
    } else {
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
        if (loginForm) loginForm.style.display = 'block';
        if (regForm) regForm.style.display = 'none';

        setTimeout(() => {
            const el = document.getElementById('adminUsername');
            if (el) el.focus();
        }, 150);
    }
}

function togglePasswordVisibility(fieldId = 'adminPassword', iconId = 'pwdToggleIcon') {
    const pwdField = document.getElementById(fieldId) || document.getElementById('adminPassword');
    const toggleIcon = document.getElementById(iconId) || document.getElementById('pwdToggleIcon') || document.getElementById('toggle-pwd-icon');
    if (!pwdField) return;

    if (pwdField.type === 'password') {
        pwdField.type = 'text';
        if (toggleIcon) toggleIcon.className = 'fa-solid fa-eye-slash';
    } else {
        pwdField.type = 'password';
        if (toggleIcon) toggleIcon.className = 'fa-solid fa-eye';
    }
}

function toggleRegPasswordVisibility() {
    togglePasswordVisibility('regAdminPassword', 'regPwdToggleIcon1');
}

// 3. Admin Registration Handler (Single-Slot Lock Enforced)
async function handleAdminRegister(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('regAdminName') || document.getElementById('regFullName');
    const usernameInput = document.getElementById('regAdminUsername') || document.getElementById('regUsername');
    const emailInput = document.getElementById('regEmail');
    const phoneInput = document.getElementById('regAdminPhone') || document.getElementById('regPhone');
    const passwordInput = document.getElementById('regAdminPassword') || document.getElementById('regPassword');
    const confirmInput = document.getElementById('regAdminConfirmPassword') || document.getElementById('regConfirmPassword');
    const submitBtn = document.getElementById('adminRegisterSubmitBtn');

    const name = nameInput ? nameInput.value.trim() : '';
    const username = usernameInput ? usernameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    const confirmPassword = confirmInput ? confirmInput.value.trim() : '';

    if (!name || !username || !password) {
        showLoginAlert('Please fill Full Name, Username, and Password.', 'error');
        return;
    }

    if (password.length < 6) {
        showLoginAlert('Security Requirement: Password must be at least 6 characters long.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showLoginAlert('Passwords do not match. Please re-type your password.', 'error');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Hashing & Locking Admin Slot...</span>';
    }

    try {
        let response = null;
        try {
            response = await fetch('/api/admin/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, phone, password })
            });
        } catch (e) {
            response = null;
        }

        if (!response || !response.ok) {
            try {
                response = await fetch('/.netlify/functions/admin-auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username, email, phone, password })
                });
            } catch (e) {
                // Secondary fallback
            }
        }

        let data = null;
        if (response) {
            data = await response.json().catch(() => null);
        }

        if (data && data.success && data.token) {
            adminToken = data.token;
            currentAdminUser = data.admin ? (data.admin.name || data.admin.username) : name;
            currentAdminData = data.admin;
            isSingleSlotAvailable = false;
            isSingleSlotConfigured = true;

            localStorage.setItem('jankalyan_admin_token', adminToken);
            localStorage.setItem('jankalyan_admin_user', currentAdminUser);

            // Clear sensitive input fields from DOM
            if (passwordInput) passwordInput.value = '';
            if (confirmInput) confirmInput.value = '';

            updateAdminSlotUI();
            showLoginAlert('🎉 Master Admin account created securely! Admin slot is now locked. Opening portal...', 'success');

            setTimeout(() => {
                closeAdminModal();
                openAdminPortal();
            }, 700);
        } else {
            showLoginAlert(data && data.error ? data.error : 'Registration Failed: Slot may already be locked.', 'error');
        }
    } catch (err) {
        showLoginAlert('Unable to register account. Please check your network connection.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-user-check"></i> <span>Create Master Admin & Lock Slot</span>';
        }
    }
}

// 4. Admin Login Handler
async function handleAdminLogin(event) {
    if (event) event.preventDefault();

    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');
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
            currentAdminData = data.admin;
            localStorage.setItem('jankalyan_admin_token', adminToken);
            localStorage.setItem('jankalyan_admin_user', currentAdminUser);

            if (passwordInput) passwordInput.value = '';

            showLoginAlert('Authentication successful! Loading customer medicine records...', 'success');
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
    checkAdminAccountStatus();
}

// 5. Admin Portal Window Controls & Data Loading
function openAdminPortal() {
    const portal = document.getElementById('admin-portal-modal');
    if (portal) portal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Update user badge
    const userDisplay = document.getElementById('portalAdminUserName') || document.getElementById('admin-user-display');
    if (userDisplay) {
        userDisplay.textContent = currentAdminUser || 'Mr. Siddhu Hajare (Sangola Admin)';
    }

    // Activate the current section tab
    switchAdminPortalSection(currentAdminPortalSection || 'customers');

    // Load customer records & medicine stock inventory from database
    loadCustomerRecords();
    if (typeof loadStockRecords === 'function') {
        loadStockRecords();
    }
}

function closeAdminPortal() {
    const portal = document.getElementById('admin-portal-modal');
    if (portal) portal.classList.remove('active');
    document.body.style.overflow = '';
}

// 5b. Admin Portal Subheader Navigation (Customer Records vs Medicine Stock Management)
let currentAdminPortalSection = 'customers';

function switchAdminPortalSection(section) {
    const targetSection = (section || 'customers').toLowerCase();
    currentAdminPortalSection = targetSection;

    const tabCustomer = document.getElementById('tabCustomerRecordsBtn');
    const tabStock = document.getElementById('tabStockManagementBtn');
    const secCustomer = document.getElementById('sectionCustomerRecords');
    const secStock = document.getElementById('sectionStockManagement');
    const sectionTag = document.getElementById('portalCurrentSectionTag');

    if (targetSection === 'stock' || targetSection === 'medicine-stock' || targetSection === 'inventory') {
        // Activate Stock tab
        if (tabStock) {
            tabStock.classList.add('active');
            tabStock.setAttribute('aria-selected', 'true');
        }
        if (tabCustomer) {
            tabCustomer.classList.remove('active');
            tabCustomer.setAttribute('aria-selected', 'false');
        }

        // Show Stock section, hide Customer section
        if (secStock) {
            secStock.style.display = 'block';
            secStock.classList.add('active');
        }
        if (secCustomer) {
            secCustomer.style.display = 'none';
            secCustomer.classList.remove('active');
        }

        // Update active section badge
        if (sectionTag) {
            sectionTag.innerHTML = '<i class="fa-solid fa-boxes-stacked"></i> Medicine Stock Management &bull; Active';
        }

        // Render stock data
        if (typeof renderStockTable === 'function') {
            renderStockTable();
        }
        if (typeof updateStockKpiStats === 'function') {
            updateStockKpiStats();
        }
    } else {
        // Default to Customer Medicine Records
        if (tabCustomer) {
            tabCustomer.classList.add('active');
            tabCustomer.setAttribute('aria-selected', 'true');
        }
        if (tabStock) {
            tabStock.classList.remove('active');
            tabStock.setAttribute('aria-selected', 'false');
        }

        // Show Customer section, hide Stock section
        if (secCustomer) {
            secCustomer.style.display = 'block';
            secCustomer.classList.add('active');
        }
        if (secStock) {
            secStock.style.display = 'none';
            secStock.classList.remove('active');
        }

        // Update active section badge
        if (sectionTag) {
            sectionTag.innerHTML = '<i class="fa-solid fa-store"></i> Sangola Store Counter &bull; Active';
        }

        // Render customer data
        if (typeof renderCustomerTable === 'function') {
            renderCustomerTable();
        }
        if (typeof updateKpiStats === 'function') {
            updateKpiStats();
        }
    }
}

// Expose globally on window for inline event handlers
if (typeof window !== 'undefined') {
    window.switchAdminPortalSection = switchAdminPortalSection;
}

// 6. Load Customer Records from Supabase / API
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

        if (response && response.status === 401) {
            handleAdminLogout();
            openAdminModal();
            showLoginAlert('Admin session expired or unauthorized. Please sign in again.', 'error');
            return;
        }

        if (response && response.ok) {
            const data = await response.json().catch(() => null);
            if (data && Array.isArray(data.customers)) {
                allCustomers = data.customers;
                // Securely persist to client local storage
                try {
                    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(allCustomers));
                } catch (e) {
                    console.warn('Storage save warning:', e);
                }
                isSupabaseConnected = !!data.supabaseConnected;
                updateSupabasePill(data.supabaseConnected);
            }
        }
    } catch (err) {
        console.warn('Could not fetch from API, using cached records:', err);
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

// Customer Registry View & Sort State
let customerViewMode = (typeof localStorage !== 'undefined' && localStorage.getItem('jankalyan_cust_view_mode')) || 'grid';
let customerSortMode = 'newest';
let isCustomerAlertDismissed = false;

function setCustomerViewMode(mode) {
    customerViewMode = mode;
    try {
        localStorage.setItem('jankalyan_cust_view_mode', mode);
    } catch (e) {}

    const btnGrid = document.getElementById('btnCustViewGrid');
    const btnTable = document.getElementById('btnCustViewTable');
    const gridWrapper = document.getElementById('customerGridWrapper');
    const tableWrapper = document.getElementById('customerTableWrapper');

    if (mode === 'grid') {
        if (btnGrid) btnGrid.classList.add('active');
        if (btnTable) btnTable.classList.remove('active');
        if (gridWrapper) gridWrapper.style.display = 'grid';
        if (tableWrapper) tableWrapper.style.display = 'none';
    } else {
        if (btnGrid) btnGrid.classList.remove('active');
        if (btnTable) btnTable.classList.add('active');
        if (gridWrapper) gridWrapper.style.display = 'none';
        if (tableWrapper) tableWrapper.style.display = 'block';
    }
    renderCustomerTable();
}

function handleCustomerSort(sortKey) {
    customerSortMode = sortKey;
    renderCustomerTable();
}

function dismissCustomerAlert() {
    isCustomerAlertDismissed = true;
    const banner = document.getElementById('customerSmartAlertBanner');
    if (banner) banner.style.display = 'none';
}

// 1-Click Patient Clinical Profile Presets
function applyCustomerPreset(presetId) {
    const presets = {
        rahul: {
            name: 'Rahul Sargar',
            age: 26,
            gender: 'Male',
            mobile: '7709647627',
            address: 'Near Wadhegaon Naka',
            area: 'Sangola Town (413307)',
            doctor: 'Dr. S. K. Kulkarni (Cardiology)',
            status: 'Active',
            rx: 'Yes',
            notes: 'Regular monthly cardiac prescription file & cough syrup requirement. Verified by Siddhu Hajare.',
            medicines: [
                { name: 'Telmakind 40', type: 'Tablet', strength: '40mg', quantity: '1 Strip (10 Tabs)' },
                { name: 'Ascoril D Plus Cough Syrup', type: 'Syrup / Liquid', strength: '100ml', quantity: '1 Bottle' },
                { name: 'Dolo 650', type: 'Tablet', strength: '650mg', quantity: '1 Strip (15 Tabs)' }
            ]
        },
        sunita: {
            name: 'Sunita Patil',
            age: 52,
            gender: 'Female',
            mobile: '9822451290',
            address: 'Main Bazaar Road, Opp Bank',
            area: 'Sangola (413307)',
            doctor: 'Dr. Patil Hospital',
            status: 'Active',
            rx: 'Yes',
            notes: 'Diabetic management tablets and calcium supplement for bone strength.',
            medicines: [
                { name: 'Glycomet GP2', type: 'Tablet', strength: '2mg / 500mg', quantity: '2 Strips (30 Tabs)' },
                { name: 'Pan-D Capsule', type: 'Capsule', strength: '40mg / 30mg', quantity: '1 Strip (15 Caps)' },
                { name: 'Shelcal 500', type: 'Tablet', strength: '500mg', quantity: '1 Strip (15 Tabs)' }
            ]
        },
        aarav: {
            name: 'Aarav Kadam (Child)',
            age: 4,
            gender: 'Male',
            mobile: '9423871234',
            address: 'Station Road, Kadam Vasti',
            area: 'Sangola (413307)',
            doctor: 'Dr. Shinde Children Clinic',
            status: 'Under Review',
            rx: 'Yes',
            notes: 'Pediatric cough and mild fever. Dose: 5 drops twice daily as per doctor Rx.',
            medicines: [
                { name: 'Ascoril LS Drops', type: 'Pediatric Drops', strength: '15ml', quantity: '1 Bottle' },
                { name: 'Calpol 250 Peadiatric Syrup', type: 'Syrup / Liquid', strength: '60ml', quantity: '1 Bottle' }
            ]
        },
        anand: {
            name: 'Anand Shinde',
            age: 34,
            gender: 'Male',
            mobile: '8669118742',
            address: 'Kadlas Naka, Anand Nagar',
            area: 'Sangola (413307)',
            doctor: 'General Counter Consultation',
            status: 'Active',
            rx: 'Yes',
            notes: 'Antibiotic course for bacterial infection and allergic cold.',
            medicines: [
                { name: 'Augmentin 625 Duo', type: 'Tablet', strength: '625mg', quantity: '1 Strip (10 Tabs)' },
                { name: 'Cetzine 10', type: 'Tablet', strength: '10mg', quantity: '1 Strip (10 Tabs)' }
            ]
        }
    };

    const data = presets[presetId];
    if (!data) return;

    const nameEl = document.getElementById('crudFullName');
    const ageEl = document.getElementById('crudAge');
    const genderEl = document.getElementById('crudGender');
    const mobileEl = document.getElementById('crudMobile');
    const addressEl = document.getElementById('crudAddress');
    const areaEl = document.getElementById('crudAreaVillage');
    const doctorEl = document.getElementById('crudDoctor');
    const statusEl = document.getElementById('crudStatus');
    const rxEl = document.getElementById('crudPrescriptionAvailable');
    const notesEl = document.getElementById('crudNotes');

    if (nameEl) nameEl.value = data.name;
    if (ageEl) ageEl.value = data.age;
    if (genderEl) genderEl.value = data.gender;
    if (mobileEl) mobileEl.value = data.mobile;
    if (addressEl) addressEl.value = data.address;
    if (areaEl) areaEl.value = data.area;
    if (doctorEl) doctorEl.value = data.doctor;
    if (statusEl) statusEl.value = data.status;
    if (rxEl) rxEl.value = data.rx;
    if (notesEl) notesEl.value = data.notes;

    const container = document.getElementById('crudMedicinesList');
    if (container) {
        container.innerHTML = '';
        data.medicines.forEach(m => addCrudMedicineRow(m));
    }

    if (typeof showToast === 'function') {
        showToast(`Auto-filled patient profile for ${data.name}`);
    }
}

// 1-Click Fast Stock Medicine Chip Adder
function addCustomerMedFromStock(name, type, strength, qty) {
    addCrudMedicineRow({
        name: name,
        type: type || 'Tablet',
        strength: strength || '',
        quantity: qty || '1 Strip'
    });
    if (typeof showToast === 'function') {
        showToast(`Added ${name} to medicine requirement`);
    }
}

// 7. Render Customer Bookings Table & Card Grid
function renderCustomerTable() {
    const tableBody = document.getElementById('customerTableBody') || document.getElementById('customer-table-body');
    const gridWrapper = document.getElementById('customerGridWrapper');
    const emptyState = document.getElementById('portalEmptyState') || document.getElementById('portal-empty-state');
    const countDisplay = document.getElementById('record-count-display');

    if (!tableBody && !gridWrapper) return;

    // Filter customers by status and search text
    let filtered = allCustomers.filter(c => {
        const normStatus = normalizeCustomerStatus(c.status);
        const matchesStatus = (activeStatusFilter === 'All' || normStatus === activeStatusFilter || c.status === activeStatusFilter);
        const q = currentSearchQuery.toLowerCase();
        const matchesQuery = !q || 
            (c.full_name && c.full_name.toLowerCase().includes(q)) ||
            (c.mobile_number && c.mobile_number.includes(q)) ||
            (c.address && c.address.toLowerCase().includes(q)) ||
            (c.area_village && c.area_village.toLowerCase().includes(q)) ||
            (c.preferred_doctor && c.preferred_doctor.toLowerCase().includes(q)) ||
            (c.medicine_name && c.medicine_name.toLowerCase().includes(q)) ||
            (c.required_tablet && c.required_tablet.toLowerCase().includes(q)) ||
            (c.medicine_type && c.medicine_type.toLowerCase().includes(q));

        return matchesStatus && matchesQuery;
    });

    // Sort filtered customers
    filtered.sort((a, b) => {
        if (customerSortMode === 'name_asc') {
            return (a.full_name || '').localeCompare(b.full_name || '');
        } else if (customerSortMode === 'name_desc') {
            return (b.full_name || '').localeCompare(a.full_name || '');
        } else if (customerSortMode === 'oldest') {
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        } else if (customerSortMode === 'meds_count') {
            const countA = Array.isArray(a.medicines) ? a.medicines.length : 1;
            const countB = Array.isArray(b.medicines) ? b.medicines.length : 1;
            return countB - countA;
        } else {
            // Default: newest first
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
    });

    if (countDisplay) {
        countDisplay.textContent = `Showing ${filtered.length} of ${allCustomers.length} registered patient medicine records`;
    }

    // Smart Alert Banner Logic
    const pendingRecordsCount = allCustomers.filter(c => {
        const s = normalizeCustomerStatus(c.status);
        return s === 'Active' || s === 'Under Review';
    }).length;

    const alertBanner = document.getElementById('customerSmartAlertBanner');
    const alertMsg = document.getElementById('customerSmartAlertMessage');
    if (alertBanner && alertMsg) {
        if (pendingRecordsCount > 0 && !isCustomerAlertDismissed) {
            alertBanner.style.display = 'flex';
            alertMsg.innerHTML = `<strong>Attention Required:</strong> You have <strong>${pendingRecordsCount} customer record${pendingRecordsCount > 1 ? 's' : ''}</strong> in Active or Under Review status awaiting counter dispensing or doctor Rx verification.`;
        } else {
            alertBanner.style.display = 'none';
        }
    }

    if (filtered.length === 0) {
        if (tableBody) tableBody.innerHTML = '';
        if (gridWrapper) gridWrapper.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Helper: Parse medicine items list
    function parseCustomerMeds(customer) {
        if (Array.isArray(customer.medicines) && customer.medicines.length > 0) {
            return customer.medicines;
        } else if (customer.medicine_name && (customer.medicine_name.includes(' | ') || customer.medicine_name.includes(' + '))) {
            const parts = customer.medicine_name.split(/\s*(?:\||\+)\s*/);
            return parts.map(part => {
                const clean = part.replace(/^\d+\.\s*/, '').trim();
                const isSyrup = clean.toLowerCase().includes('syrup') || clean.toLowerCase().includes('suspension');
                return {
                    name: clean,
                    type: isSyrup ? 'Syrup / Liquid' : (customer.medicine_type || 'Tablet'),
                    strength: customer.medicine_strength || '',
                    quantity: ''
                };
            }).filter(m => m.name);
        } else {
            return [{
                name: customer.medicine_name || customer.required_tablet || 'General Prescription',
                type: customer.medicine_type || 'Tablet',
                strength: customer.medicine_strength || '',
                quantity: ''
            }];
        }
    }

    // 1. Render Table View HTML
    if (tableBody) {
        tableBody.innerHTML = filtered.map(customer => {
            const initials = customer.full_name ? customer.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'PT';
            const phone = customer.mobile_number || 'N/A';
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
            const createdDate = customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent';
            const normStatus = normalizeCustomerStatus(customer.status);
            const statusClass = normStatus.toLowerCase().replace(/\s+/g, '-');
            const gender = customer.gender || '';
            const areaVillage = customer.area_village || '';
            const medName = customer.medicine_name || customer.required_tablet || 'General Prescription';
            const medStrength = customer.medicine_strength || '';
            const medType = customer.medicine_type || 'Tablet';
            const rxAvailable = customer.prescription_available || 'Yes';
            const medsList = parseCustomerMeds(customer);

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
                                    <strong>${escapeHtml(customer.full_name)}</strong>
                                    ${customer.age ? `<span class="patient-age-badge">${customer.age} yrs</span>` : ''}
                                    ${gender && gender !== 'Not Specified' ? `<span class="patient-gender-tag ${gender}">${escapeHtml(gender)}</span>` : ''}
                                </div>
                                <div class="contact-links-wrap">
                                    <button onclick="viewBookingDetails('${customer.id}')" class="btn-contact-quick" style="background: #eef2ff; color: #4f46e5; border-color: #c7d2fe;" title="View Medicine Record Slip">
                                        <i class="fa-solid fa-receipt"></i> Details
                                    </button>
                                    <a href="tel:${escapeHtml(phone)}" class="btn-contact-quick call">
                                        <i class="fa-solid fa-phone"></i> Call
                                    </a>
                                    <a href="https://wa.me/${targetPhone}" target="_blank" rel="noopener noreferrer" class="btn-contact-quick wa">
                                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
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
                                <i class="fa-brands fa-whatsapp"></i> Send Status Msg
                            </button>
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem; color: #334155;">
                            <i class="fa-solid fa-location-dot" style="color: #ef4444; margin-right: 4px; font-size: 0.8rem;"></i>
                            ${escapeHtml(customer.address || 'Sangola')}
                        </div>
                        ${areaVillage ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;"><i class="fa-solid fa-map-pin" style="color: #10b981; margin-right: 3px;"></i> ${escapeHtml(areaVillage)}</div>` : ''}
                    </td>
                    <td>
                        <div class="medicine-badge-wrap">
                            ${medsList.length > 1 ? `
                                <div style="margin-bottom: 4px;">
                                    <span class="badge-multi-meds">
                                        <i class="fa-solid fa-layer-group"></i> ${medsList.length} Medicines Required
                                    </span>
                                </div>
                                <div class="meds-compact-list">
                                    ${medsList.map(m => `
                                        <div class="med-compact-item" title="${escapeHtml(m.name)} - ${escapeHtml(m.type || 'Medicine')}">
                                            <span class="med-type-mini-icon"><i class="${getMedTypeIcon(m.type)}"></i></span>
                                            <span class="med-compact-name"><strong>${escapeHtml(m.name)}</strong> ${m.strength ? `<small>(${escapeHtml(m.strength)})</small>` : ''}</span>
                                            <span class="med-type-mini-tag">${escapeHtml(m.type || 'Medicine')}</span>
                                            ${m.quantity ? `<span class="med-qty-tag">${escapeHtml(m.quantity)}</span>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div>
                                    <span class="medicine-request-pill">
                                        <i class="${getMedTypeIcon(medsList[0]?.type || medType)}" style="margin-right: 4px;"></i> ${escapeHtml(medsList[0]?.name || medName)}
                                    </span>
                                    ${medsList[0]?.strength || medStrength ? `<span class="med-strength-text" style="margin-left: 4px;">(${escapeHtml(medsList[0]?.strength || medStrength)})</span>` : ''}
                                    ${medsList[0]?.quantity ? `<span class="med-qty-tag" style="margin-left: 4px;">${escapeHtml(medsList[0].quantity)}</span>` : ''}
                                </div>
                                <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px;">
                                    <span class="med-type-pill"><i class="${getMedTypeIcon(medsList[0]?.type || medType)}"></i> ${escapeHtml(medsList[0]?.type || medType)}</span>
                                </div>
                            `}
                            <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px;">
                                <span class="prescription-tag ${rxAvailable === 'Yes' ? 'rx-yes' : 'rx-no'}">
                                    <i class="fa-solid ${rxAvailable === 'Yes' ? 'fa-file-prescription' : 'fa-circle-info'}"></i> Rx: ${escapeHtml(rxAvailable)}
                                </span>
                            </div>
                            ${customer.notes ? `<div class="table-notes-preview" title="${escapeHtml(customer.notes)}">Note: ${escapeHtml(customer.notes)}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="doctor-badge-tag">
                            <i class="fa-solid fa-user-doctor"></i> ${escapeHtml(customer.preferred_doctor || 'General Consultation')}
                        </span>
                    </td>
                    <td>
                        <select class="status-select-badge status-${statusClass}" 
                                onchange="updateCustomerStatus('${customer.id}', this.value)">
                            <option value="Active" ${normStatus === 'Active' ? 'selected' : ''}>🟢 Active</option>
                            <option value="Under Review" ${normStatus === 'Under Review' ? 'selected' : ''}>🟡 Under Review</option>
                            <option value="Verified" ${normStatus === 'Verified' ? 'selected' : ''}>🔵 Dispensed</option>
                            <option value="Archived" ${normStatus === 'Archived' ? 'selected' : ''}>⚪ Archived</option>
                        </select>
                    </td>
                    <td style="text-align: right;">
                        <div class="row-actions-group">
                            <button class="btn-row-action" style="background: #eef2ff; color: #4f46e5;" title="View Customer Medicine Record & Slip" onclick="viewBookingDetails('${customer.id}')">
                                <i class="fa-solid fa-receipt"></i>
                            </button>
                            <button class="btn-row-action edit" title="Edit Customer Record" onclick="openEditCustomerModal('${customer.id}')">
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

    // 2. Render Card Grid View HTML
    if (gridWrapper) {
        gridWrapper.innerHTML = filtered.map(customer => {
            const initials = customer.full_name ? customer.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'PT';
            const phone = customer.mobile_number || 'N/A';
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
            const createdDate = customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent';
            const normStatus = normalizeCustomerStatus(customer.status);
            const statusClass = normStatus.toLowerCase().replace(/\s+/g, '-');
            const gender = customer.gender || '';
            const rxAvailable = customer.prescription_available || 'Yes';
            const medsList = parseCustomerMeds(customer);

            return `
                <div class="patient-card-item" id="card-cust-${customer.id}">
                    <!-- Card Top Header -->
                    <div class="patient-card-header">
                        <div class="patient-avatar-box">
                            <div class="patient-avatar">${initials}</div>
                            <div>
                                <div class="patient-card-name">
                                    ${escapeHtml(customer.full_name)}
                                </div>
                                <div class="patient-card-meta">
                                    <span>#${customer.id}</span>
                                    <span>&bull;</span>
                                    <span>${createdDate}</span>
                                </div>
                            </div>
                        </div>
                        <select class="status-select-badge status-${statusClass}" 
                                onchange="updateCustomerStatus('${customer.id}', this.value)"
                                style="font-size: 0.76rem; padding: 4px 8px;">
                            <option value="Active" ${normStatus === 'Active' ? 'selected' : ''}>🟢 Active</option>
                            <option value="Under Review" ${normStatus === 'Under Review' ? 'selected' : ''}>🟡 Review</option>
                            <option value="Verified" ${normStatus === 'Verified' ? 'selected' : ''}>🔵 Dispensed</option>
                            <option value="Archived" ${normStatus === 'Archived' ? 'selected' : ''}>⚪ Archived</option>
                        </select>
                    </div>

                    <!-- Demographics Row -->
                    <div class="patient-demographics-row">
                        ${customer.age ? `<span class="patient-age-badge"><i class="fa-solid fa-cake-candles"></i> ${customer.age} yrs</span>` : ''}
                        ${gender && gender !== 'Not Specified' ? `<span class="patient-gender-tag ${gender}"><i class="fa-solid fa-venus-mars"></i> ${escapeHtml(gender)}</span>` : ''}
                        <span class="patient-location-pill" title="${escapeHtml(customer.address || '')}">
                            <i class="fa-solid fa-location-dot"></i> ${escapeHtml(customer.area_village || customer.address || 'Sangola')}
                        </span>
                        <span class="prescription-tag ${rxAvailable === 'Yes' ? 'rx-yes' : 'rx-no'}" style="font-size: 0.72rem; padding: 2px 6px;">
                            <i class="fa-solid ${rxAvailable === 'Yes' ? 'fa-file-prescription' : 'fa-circle-info'}"></i> Rx: ${escapeHtml(rxAvailable)}
                        </span>
                    </div>

                    <!-- Medicines Section -->
                    <div class="patient-card-meds-box">
                        <div class="card-meds-title">
                            <span><i class="fa-solid fa-prescription-bottle-medical" style="color: #2563eb;"></i> Prescribed Medicines (${medsList.length}):</span>
                        </div>
                        <div class="patient-card-meds-list">
                            ${medsList.map((m, idx) => `
                                <div class="card-med-chip">
                                    <i class="${getMedTypeIcon(m.type)}" style="color: #2563eb;"></i>
                                    <span class="card-med-name">${escapeHtml(m.name)}</span>
                                    ${m.strength ? `<span class="card-med-strength">${escapeHtml(m.strength)}</span>` : ''}
                                    ${m.quantity ? `<span class="card-med-qty">${escapeHtml(m.quantity)}</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Doctor & Notes -->
                    <div class="patient-card-doctor-box">
                        <div class="card-doctor-info">
                            <i class="fa-solid fa-user-doctor" style="color: #059669;"></i>
                            <span>${escapeHtml(customer.preferred_doctor || 'General Consultation')}</span>
                        </div>
                        ${customer.notes ? `
                            <div class="card-pharmacist-note" title="${escapeHtml(customer.notes)}">
                                <i class="fa-solid fa-comment-medical"></i> ${escapeHtml(customer.notes)}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Card Actions Footer -->
                    <div class="patient-card-footer">
                        <div class="card-fast-contact">
                            <a href="tel:${escapeHtml(phone)}" class="btn-card-action call" title="Call ${escapeHtml(customer.full_name)}">
                                <i class="fa-solid fa-phone"></i> Call
                            </a>
                            <a href="https://wa.me/${targetPhone}" target="_blank" rel="noopener noreferrer" class="btn-card-action wa" title="WhatsApp Message">
                                <i class="fa-brands fa-whatsapp"></i> WhatsApp
                            </a>
                            <button type="button" class="btn-card-action slip" onclick="viewBookingDetails('${customer.id}')" title="View Full Clinical Slip">
                                <i class="fa-solid fa-receipt"></i> Slip
                            </button>
                        </div>
                        <div class="card-manage-actions">
                            <button type="button" class="btn-card-icon edit" onclick="openEditCustomerModal('${customer.id}')" title="Edit Patient Record">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn-card-icon delete" onclick="deleteCustomerRecord('${customer.id}')" title="Delete Patient Record">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 8. Update KPI Cards
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

    const tabCustomerCount = document.getElementById('tabCustomerCount');
    if (tabCustomerCount) tabCustomerCount.textContent = total;
}

// 9. Search & Filter Handlers
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

    // Update filter pills
    document.querySelectorAll('#statusFilterPills .filter-pill').forEach(pill => {
        if (pill.textContent.includes(status) || (status === 'All' && (pill.textContent.includes('All Records') || pill.textContent.includes('All Bookings')))) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    // Update KPI card active borders
    const cardMap = {
        'All': 'kpiCardCustAll',
        'Active': 'kpiCardCustActive',
        'Under Review': 'kpiCardCustReview',
        'Verified': 'kpiCardCustVerified'
    };

    ['kpiCardCustAll', 'kpiCardCustActive', 'kpiCardCustReview', 'kpiCardCustVerified'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });

    if (cardMap[status]) {
        const activeCard = document.getElementById(cardMap[status]);
        if (activeCard) activeCard.classList.add('active');
    }

    renderCustomerTable();
}

// 10. Booking Details Slip Modal
function viewBookingDetails(id) {
    const customer = allCustomers.find(c => String(c.id) === String(id));
    if (!customer) return;

    const modal = document.getElementById('booking-detail-modal');
    const backdrop = document.getElementById('booking-detail-backdrop');
    const content = document.getElementById('bookingDetailContent');
    const actionsRow = document.getElementById('bookingDetailActionsRow');

    const phone = customer.mobile_number || 'N/A';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const dateFormatted = customer.created_at ? new Date(customer.created_at).toLocaleString('en-IN') : 'Recent';
    const normStatus = normalizeCustomerStatus(customer.status);

    let medsList = [];
    if (Array.isArray(customer.medicines) && customer.medicines.length > 0) {
        medsList = customer.medicines;
    } else if (customer.medicine_name && (customer.medicine_name.includes(' | ') || customer.medicine_name.includes(' + '))) {
        const parts = customer.medicine_name.split(/\s*(?:\||\+)\s*/);
        medsList = parts.map(part => {
            const clean = part.replace(/^\d+\.\s*/, '').trim();
            const isSyrup = clean.toLowerCase().includes('syrup') || clean.toLowerCase().includes('suspension');
            return {
                name: clean,
                type: isSyrup ? 'Syrup / Liquid' : (customer.medicine_type || 'Tablet'),
                strength: customer.medicine_strength || '',
                quantity: ''
            };
        }).filter(m => m.name);
    } else {
        medsList = [{
            name: customer.medicine_name || customer.required_tablet || 'General Prescription',
            type: customer.medicine_type || 'Tablet',
            strength: customer.medicine_strength || '',
            quantity: ''
        }];
    }

    if (content) {
        content.innerHTML = `
            <div class="slip-header-card">
                <div>
                    <span class="slip-id-tag">Record #${escapeHtml(customer.id)}</span>
                    <div class="slip-date-text"><i class="fa-regular fa-clock"></i> Registered: ${escapeHtml(dateFormatted)}</div>
                </div>
                <div>
                    <span class="patient-gender-tag" style="font-size: 0.82rem; padding: 4px 10px; background: #ffffff; border: 1px solid #86efac; color: #166534;">
                        Status: <strong>${escapeHtml(normStatus)}</strong>
                    </span>
                </div>
            </div>

            <!-- Customer Information Card -->
            <div class="detail-section-card">
                <div class="detail-section-title"><i class="fa-solid fa-user"></i> Customer Information</div>
                <div class="detail-grid-2">
                    <div class="detail-item">
                        <span class="detail-item-label">Full Name</span>
                        <span class="detail-item-value">${escapeHtml(customer.full_name)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-item-label">Contact Phone</span>
                        <span class="detail-item-value">${escapeHtml(phone)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-item-label">Age & Gender</span>
                        <span class="detail-item-value">${customer.age ? `${customer.age} years` : 'Not specified'} (${escapeHtml(customer.gender || 'Not specified')})</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-item-label">Area / Village</span>
                        <span class="detail-item-value">${escapeHtml(customer.area_village || customer.address || 'Sangola')}</span>
                    </div>
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <span class="detail-item-label">Street / House Address</span>
                        <span class="detail-item-value">${escapeHtml(customer.address || 'Near Wadhegaon Naka, Sangola')}</span>
                    </div>
                </div>
            </div>

            <!-- Medicine Requirement Card -->
            <div class="detail-section-card">
                <div class="detail-section-title"><i class="fa-solid fa-prescription-bottle-medical"></i> Medicine Requirement (${medsList.length} Item${medsList.length > 1 ? 's' : ''})</div>
                
                ${medsList.length > 1 ? `
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                        ${medsList.map((m, idx) => `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; flex-wrap: wrap; gap: 8px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: #e0e7ff; color: #4338ca; font-weight: 700; font-size: 0.78rem;">${idx + 1}</span>
                                    <div>
                                        <div style="font-weight: 700; color: #0f172a; font-size: 0.92rem;">
                                            <i class="${getMedTypeIcon(m.type)}" style="color: #2563eb; margin-right: 4px;"></i>
                                            ${escapeHtml(m.name)}
                                        </div>
                                        <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
                                            ${m.strength ? `Strength: <strong>${escapeHtml(m.strength)}</strong>` : ''}
                                            ${m.strength && m.quantity ? ' &bull; ' : ''}
                                            ${m.quantity ? `Quantity: <strong>${escapeHtml(m.quantity)}</strong>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <span class="med-type-tag ${getMedTypeTagClass(m.type)}">${escapeHtml(m.type || 'Medicine')}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="detail-med-highlight">
                        <div class="detail-med-name">
                            <i class="${getMedTypeIcon(medsList[0]?.type || customer.medicine_type)}" style="color: #2563eb; margin-right: 4px;"></i>
                            ${escapeHtml(medsList[0]?.name || customer.medicine_name || customer.required_tablet || 'General Prescription')}
                        </div>
                        <div class="detail-med-meta">
                            <span><strong>Strength:</strong> ${escapeHtml(medsList[0]?.strength || customer.medicine_strength || 'Standard')}</span>
                            <span>&bull;</span>
                            <span><strong>Type:</strong> ${escapeHtml(medsList[0]?.type || customer.medicine_type || 'Tablet')}</span>
                            ${medsList[0]?.quantity ? `<span>&bull;</span><span><strong>Quantity:</strong> ${escapeHtml(medsList[0].quantity)}</span>` : ''}
                            <span>&bull;</span>
                            <span><strong>Rx on file:</strong> ${escapeHtml(customer.prescription_available || 'Yes')}</span>
                        </div>
                    </div>
                `}

                <div class="detail-grid-2" style="margin-top: 10px;">
                    <div class="detail-item">
                        <span class="detail-item-label">Preferred Doctor</span>
                        <span class="detail-item-value">${escapeHtml(customer.preferred_doctor || 'General Consultation')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-item-label">Prescription File</span>
                        <span class="detail-item-value">${escapeHtml(customer.prescription_available || 'Yes')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-item-label">Supabase Sync</span>
                        <span class="detail-item-value" style="color: #16a34a;"><i class="fa-solid fa-cloud-arrow-up"></i> Verified in Supabase</span>
                    </div>
                    ${customer.notes ? `
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <span class="detail-item-label">Pharmacist Notes</span>
                        <span class="detail-item-value" style="font-weight: 500; font-size: 0.84rem; color: #475569;">${escapeHtml(customer.notes)}</span>
                    </div>` : ''}
                </div>
            </div>
        `;
    }

    if (actionsRow) {
        actionsRow.innerHTML = `
            <a href="https://wa.me/${targetPhone}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="background: #25d366; border-color: #25d366; text-decoration: none;">
                <i class="fa-brands fa-whatsapp"></i>
                <span>Chat on WhatsApp</span>
            </a>
            <button type="button" class="btn-portal-secondary" onclick="printSingleBookingSlip('${customer.id}')">
                <i class="fa-solid fa-print"></i>
                <span>Print Slip</span>
            </button>
            <button type="button" class="btn-portal-outline" onclick="closeBookingDetailModal(); openEditCustomerModal('${customer.id}')">
                <i class="fa-solid fa-pen-to-square"></i>
                <span>Edit</span>
            </button>
            <button type="button" class="btn-portal-outline" onclick="closeBookingDetailModal()">Close</button>
        `;
    }

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeBookingDetailModal() {
    const modal = document.getElementById('booking-detail-modal');
    const backdrop = document.getElementById('booking-detail-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

function printSingleBookingSlip(id) {
    window.print();
}

// 11. Admin Profile & Security Settings Modal
function openAdminProfileModal() {
    const modal = document.getElementById('admin-profile-modal');
    const backdrop = document.getElementById('admin-profile-backdrop');
    const content = document.getElementById('adminProfileContent');

    if (content) {
        content.innerHTML = `
            <div class="profile-card-preview">
                <div class="profile-avatar-circle">
                    <i class="fa-solid fa-user-tie"></i>
                </div>
                <div class="profile-details">
                    <h4>${escapeHtml(currentAdminData ? currentAdminData.name || currentAdminUser : currentAdminUser)}</h4>
                    <span>Username: <strong>${escapeHtml(currentAdminData ? currentAdminData.username : 'admin')}</strong></span>
                    <span>Role: <strong>Master Pharmacist / Administrator</strong></span>
                    <span class="profile-slot-badge"><i class="fa-solid fa-shield-halved"></i> Single Slot #1 (Enforced & Locked)</span>
                </div>
            </div>

            <div class="form-section-divider">
                <span class="section-divider-title"><i class="fa-solid fa-key"></i> Update Admin Password</span>
            </div>

            <div class="form-group">
                <label for="profileFullName"><i class="fa-solid fa-user"></i> Display Name</label>
                <input type="text" id="profileFullName" value="${escapeHtml(currentAdminData ? currentAdminData.name || currentAdminUser : currentAdminUser)}">
            </div>

            <div class="form-group">
                <label for="profilePhone"><i class="fa-solid fa-phone"></i> Mobile Phone</label>
                <input type="tel" id="profilePhone" value="${escapeHtml(currentAdminData ? currentAdminData.phone || '7709647627' : '7709647627')}">
            </div>

            <div class="form-row">
                <div class="form-group flex-1">
                    <label for="profileNewPassword"><i class="fa-solid fa-lock"></i> New Password</label>
                    <input type="password" id="profileNewPassword" placeholder="Leave blank to keep current">
                </div>
                <div class="form-group flex-1">
                    <label for="profileConfirmPassword"><i class="fa-solid fa-lock-open"></i> Confirm New</label>
                    <input type="password" id="profileConfirmPassword" placeholder="Re-type new password">
                </div>
            </div>
        `;
    }

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeAdminProfileModal() {
    const modal = document.getElementById('admin-profile-modal');
    const backdrop = document.getElementById('admin-profile-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

async function saveAdminProfileChanges() {
    const name = document.getElementById('profileFullName')?.value.trim();
    const phone = document.getElementById('profilePhone')?.value.trim();
    const newPassword = document.getElementById('profileNewPassword')?.value.trim();
    const confirmPassword = document.getElementById('profileConfirmPassword')?.value.trim();

    if (newPassword && newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
    }

    if (newPassword && newPassword !== confirmPassword) {
        alert('New passwords do not match. Please re-enter.');
        return;
    }

    try {
        const payload = {
            name: name || currentAdminUser,
            phone: phone || '',
            newPassword: newPassword || undefined
        };

        let res = await fetch('/api/admin/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken || ''}`
            },
            body: JSON.stringify(payload)
        }).catch(() => null);

        if (!res || !res.ok) {
            res = await fetch('/.netlify/functions/admin-auth/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken || ''}`
                },
                body: JSON.stringify(payload)
            }).catch(() => null);
        }

        if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (data && data.admin) {
                currentAdminData = data.admin;
                currentAdminUser = data.admin.name || currentAdminUser;
                localStorage.setItem('jankalyan_admin_user', currentAdminUser);
                const userDisplay = document.getElementById('portalAdminUserName');
                if (userDisplay) userDisplay.textContent = currentAdminUser;
            }
        }

        closeAdminProfileModal();
        if (typeof showToast === 'function') {
            showToast('Admin profile updated successfully.');
        }
    } catch (e) {
        closeAdminProfileModal();
    }
}

/* ==========================================================================
   DYNAMIC MULTIPLE MEDICINE ROWS (TABLETS, SYRUPS, CAPSULES, DROPS, ETC.)
   ========================================================================== */

let crudMedRowCounter = 0;
let publicMedRowCounter = 0;

function getMedTypeIcon(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('syrup') || t.includes('liquid')) return 'fa-solid fa-bottle-droplet';
    if (t.includes('capsule')) return 'fa-solid fa-capsules';
    if (t.includes('drop')) return 'fa-solid fa-droplet';
    if (t.includes('inject') || t.includes('insulin')) return 'fa-solid fa-syringe';
    if (t.includes('ointment') || t.includes('gel')) return 'fa-solid fa-pump-medical';
    if (t.includes('ayurvedic') || t.includes('churna')) return 'fa-solid fa-leaf';
    if (t.includes('veterinary') || t.includes('bolus')) return 'fa-solid fa-paw';
    if (t.includes('surgical') || t.includes('diagnostic')) return 'fa-solid fa-kit-medical';
    return 'fa-solid fa-tablets';
}

function getMedTypeTagClass(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('syrup') || t.includes('liquid')) return 'type-syrup';
    if (t.includes('capsule')) return 'type-capsule';
    if (t.includes('drop')) return 'type-drops';
    return 'type-tablet';
}

// 1. Admin Customer Registration Dynamic Medicines List
function addCrudMedicineRow(data = {}) {
    const container = document.getElementById('crudMedicinesList');
    if (!container) return;

    crudMedRowCounter++;
    const rowId = `crud-med-${crudMedRowCounter}`;
    const initialType = data.type || 'Tablet';
    const initialName = data.name || '';
    const initialStrength = data.strength || '';
    const initialQty = data.quantity || data.qty || '';

    const rowDiv = document.createElement('div');
    rowDiv.className = 'med-item-row';
    rowDiv.id = rowId;

    rowDiv.innerHTML = `
        <div class="med-item-header">
            <span class="med-item-title">
                <i class="${getMedTypeIcon(initialType)}"></i>
                <span class="med-row-index-label">Medicine Item</span>
                <span class="med-type-tag ${getMedTypeTagClass(initialType)}">${escapeHtml(initialType)}</span>
            </span>
            <button type="button" class="btn-remove-med" onclick="removeCrudMedicineRow('${rowId}')" title="Remove this medicine">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
        <div class="form-row">
            <div class="form-group flex-2">
                <label><i class="fa-solid fa-pills"></i> Medicine Name <span class="required-star">*</span></label>
                <input type="text" class="crud-med-name-input" placeholder="e.g. Telmakind 40 / Ascoril D Syrup / Dolo 650" value="${escapeHtml(initialName)}" required>
            </div>
            <div class="form-group flex-1">
                <label><i class="fa-solid fa-capsules"></i> Type</label>
                <select class="crud-med-type-select" onchange="handleCrudMedTypeChange(this, '${rowId}')">
                    <option value="Tablet" ${initialType === 'Tablet' ? 'selected' : ''}>💊 Tablet</option>
                    <option value="Syrup / Liquid" ${initialType === 'Syrup / Liquid' ? 'selected' : ''}>🧪 Syrup / Liquid</option>
                    <option value="Capsule" ${initialType === 'Capsule' ? 'selected' : ''}>💊 Capsule</option>
                    <option value="Pediatric Drops" ${initialType === 'Pediatric Drops' ? 'selected' : ''}>💧 Pediatric Drops</option>
                    <option value="Injection / Insulin" ${initialType === 'Injection / Insulin' ? 'selected' : ''}>💉 Injection / Insulin</option>
                    <option value="Ointment / Gel" ${initialType === 'Ointment / Gel' ? 'selected' : ''}>🧴 Ointment / Gel</option>
                    <option value="Ayurvedic Tonic" ${initialType === 'Ayurvedic Tonic' ? 'selected' : ''}>🌿 Ayurvedic Tonic</option>
                    <option value="Veterinary Feed / Bolus" ${initialType === 'Veterinary Feed / Bolus' ? 'selected' : ''}>🐾 Veterinary Feed / Bolus</option>
                    <option value="Surgical / Diagnostic" ${initialType === 'Surgical / Diagnostic' ? 'selected' : ''}>🩹 Surgical / Diagnostic</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group flex-1">
                <label><i class="fa-solid fa-gauge-high"></i> Strength / Dosage</label>
                <input type="text" class="crud-med-strength-input" placeholder="e.g. 40mg, 500mg, 100ml" value="${escapeHtml(initialStrength)}">
            </div>
            <div class="form-group flex-1">
                <label><i class="fa-solid fa-boxes-stacked"></i> Quantity / Strips / Bottles</label>
                <input type="text" class="crud-med-qty-input" placeholder="e.g. 1 Strip, 2 Bottles, 10 Tabs" value="${escapeHtml(initialQty)}">
            </div>
        </div>
    `;

    container.appendChild(rowDiv);
    updateCrudMedRowsUI();

    if (!data.name) {
        const input = rowDiv.querySelector('.crud-med-name-input');
        if (input) input.focus();
    }
}

function handleCrudMedTypeChange(selectEl, rowId) {
    const rowDiv = document.getElementById(rowId);
    if (!rowDiv) return;
    const type = selectEl.value;
    const iconEl = rowDiv.querySelector('.med-item-title i');
    const tagEl = rowDiv.querySelector('.med-type-tag');
    if (iconEl) iconEl.className = getMedTypeIcon(type);
    if (tagEl) {
        tagEl.className = `med-type-tag ${getMedTypeTagClass(type)}`;
        tagEl.textContent = type;
    }
}

function removeCrudMedicineRow(rowId) {
    const container = document.getElementById('crudMedicinesList');
    if (!container) return;
    const rows = container.querySelectorAll('.med-item-row');
    if (rows.length <= 1) {
        if (typeof showToast === 'function') {
            showToast('At least one medicine item is required.');
        } else {
            alert('At least one medicine item is required.');
        }
        return;
    }
    const target = document.getElementById(rowId);
    if (target) {
        target.remove();
        updateCrudMedRowsUI();
    }
}

function updateCrudMedRowsUI() {
    const container = document.getElementById('crudMedicinesList');
    if (!container) return;
    const rows = container.querySelectorAll('.med-item-row');
    const badge = document.getElementById('crudMedCountBadge');
    if (badge) {
        badge.innerHTML = `<i class="fa-solid fa-pills"></i> ${rows.length} ${rows.length === 1 ? 'Item' : 'Medicines'}`;
    }
    rows.forEach((row, idx) => {
        const label = row.querySelector('.med-row-index-label');
        if (label) label.textContent = `Medicine #${idx + 1}`;
        const removeBtn = row.querySelector('.btn-remove-med');
        if (removeBtn) {
            removeBtn.style.display = rows.length <= 1 ? 'none' : 'inline-flex';
        }
    });
}

function getCrudMedicinesData() {
    const container = document.getElementById('crudMedicinesList');
    if (!container) return [];
    const rows = container.querySelectorAll('.med-item-row');
    const list = [];
    rows.forEach(row => {
        const name = row.querySelector('.crud-med-name-input')?.value.trim() || '';
        const type = row.querySelector('.crud-med-type-select')?.value || 'Tablet';
        const strength = row.querySelector('.crud-med-strength-input')?.value.trim() || '';
        const qty = row.querySelector('.crud-med-qty-input')?.value.trim() || '';
        if (name) {
            list.push({ name, type, strength, quantity: qty });
        }
    });
    return list;
}

// 2. Public Website Booking Form Dynamic Medicines List
function addPublicMedicineRow(data = {}) {
    const container = document.getElementById('publicMedicinesList');
    if (!container) return;

    publicMedRowCounter++;
    const rowId = `pub-med-${publicMedRowCounter}`;
    const initialType = data.type || 'Tablet';
    const initialName = data.name || '';
    const initialStrength = data.strength || '';
    const initialQty = data.quantity || data.qty || '';

    const rowDiv = document.createElement('div');
    rowDiv.className = 'med-item-row';
    rowDiv.id = rowId;

    rowDiv.innerHTML = `
        <div class="med-item-header">
            <span class="med-item-title">
                <i class="${getMedTypeIcon(initialType)}"></i>
                <span class="pub-row-index-label">Medicine Item</span>
                <span class="med-type-tag ${getMedTypeTagClass(initialType)}">${escapeHtml(initialType)}</span>
            </span>
            <button type="button" class="btn-remove-med" onclick="removePublicMedicineRow('${rowId}')" title="Remove this medicine">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
        <div class="form-row">
            <div class="form-group flex-2">
                <label><i class="fa-solid fa-pills"></i> Medicine Name <span class="required-star">*</span></label>
                <input type="text" class="pub-med-name-input" placeholder="e.g. Telma 40 / Ascoril D Syrup / Dolo 650" value="${escapeHtml(initialName)}" required>
            </div>
            <div class="form-group flex-1">
                <label><i class="fa-solid fa-capsules"></i> Type</label>
                <select class="pub-med-type-select" onchange="handlePublicMedTypeChange(this, '${rowId}')">
                    <option value="Tablet" ${initialType === 'Tablet' ? 'selected' : ''}>💊 Tablet</option>
                    <option value="Syrup / Liquid" ${initialType === 'Syrup / Liquid' ? 'selected' : ''}>🧪 Syrup / Liquid</option>
                    <option value="Capsule" ${initialType === 'Capsule' ? 'selected' : ''}>💊 Capsule</option>
                    <option value="Pediatric Drops" ${initialType === 'Pediatric Drops' ? 'selected' : ''}>💧 Pediatric Drops</option>
                    <option value="Injection / Insulin" ${initialType === 'Injection / Insulin' ? 'selected' : ''}>💉 Injection / Insulin</option>
                    <option value="Ointment / Gel" ${initialType === 'Ointment / Gel' ? 'selected' : ''}>🧴 Ointment / Gel</option>
                    <option value="Ayurvedic Tonic" ${initialType === 'Ayurvedic Tonic' ? 'selected' : ''}>🌿 Ayurvedic Tonic</option>
                    <option value="Veterinary Feed / Bolus" ${initialType === 'Veterinary Feed / Bolus' ? 'selected' : ''}>🐾 Veterinary Feed / Bolus</option>
                    <option value="Surgical / Diagnostic" ${initialType === 'Surgical / Diagnostic' ? 'selected' : ''}>🩹 Surgical / Diagnostic</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group flex-1">
                <label><i class="fa-solid fa-gauge-high"></i> Strength / Dosage</label>
                <input type="text" class="pub-med-strength-input" placeholder="e.g. 40mg, 500mg, 100ml" value="${escapeHtml(initialStrength)}">
            </div>
            <div class="form-group flex-1">
                <label><i class="fa-solid fa-boxes-stacked"></i> Quantity / Strips / Bottles</label>
                <input type="text" class="pub-med-qty-input" placeholder="e.g. 1 Strip, 2 Bottles" value="${escapeHtml(initialQty)}">
            </div>
        </div>
    `;

    container.appendChild(rowDiv);
    updatePublicMedRowsUI();

    if (!data.name) {
        const input = rowDiv.querySelector('.pub-med-name-input');
        if (input) input.focus();
    }
}

function handlePublicMedTypeChange(selectEl, rowId) {
    const rowDiv = document.getElementById(rowId);
    if (!rowDiv) return;
    const type = selectEl.value;
    const iconEl = rowDiv.querySelector('.med-item-title i');
    const tagEl = rowDiv.querySelector('.med-type-tag');
    if (iconEl) iconEl.className = getMedTypeIcon(type);
    if (tagEl) {
        tagEl.className = `med-type-tag ${getMedTypeTagClass(type)}`;
        tagEl.textContent = type;
    }
}

function removePublicMedicineRow(rowId) {
    const container = document.getElementById('publicMedicinesList');
    if (!container) return;
    const rows = container.querySelectorAll('.med-item-row');
    if (rows.length <= 1) {
        if (typeof showToast === 'function') {
            showToast('At least one medicine item is required.');
        } else {
            alert('At least one medicine item is required.');
        }
        return;
    }
    const target = document.getElementById(rowId);
    if (target) {
        target.remove();
        updatePublicMedRowsUI();
    }
}

function updatePublicMedRowsUI() {
    const container = document.getElementById('publicMedicinesList');
    if (!container) return;
    const rows = container.querySelectorAll('.med-item-row');
    const badge = document.getElementById('publicMedCountBadge');
    if (badge) {
        badge.innerHTML = `<i class="fa-solid fa-pills"></i> ${rows.length} ${rows.length === 1 ? 'Item' : 'Medicines'}`;
    }
    rows.forEach((row, idx) => {
        const label = row.querySelector('.pub-row-index-label');
        if (label) label.textContent = `Medicine #${idx + 1}`;
        const removeBtn = row.querySelector('.btn-remove-med');
        if (removeBtn) {
            removeBtn.style.display = rows.length <= 1 ? 'none' : 'inline-flex';
        }
    });
}

function getPublicMedicinesData() {
    const container = document.getElementById('publicMedicinesList');
    if (!container) return [];
    const rows = container.querySelectorAll('.med-item-row');
    const list = [];
    rows.forEach(row => {
        const name = row.querySelector('.pub-med-name-input')?.value.trim() || '';
        const type = row.querySelector('.pub-med-type-select')?.value || 'Tablet';
        const strength = row.querySelector('.pub-med-strength-input')?.value.trim() || '';
        const qty = row.querySelector('.pub-med-qty-input')?.value.trim() || '';
        if (name) {
            list.push({ name, type, strength, quantity: qty });
        }
    });
    return list;
}

// 12. Customer CRUD Modals & Operations
function openAddCustomerModal() {
    const modal = document.getElementById('customer-crud-modal') || document.getElementById('admin-crud-modal');
    const backdrop = document.getElementById('customer-crud-backdrop') || document.getElementById('admin-modal-backdrop');
    const title = document.getElementById('crudModalTitle') || document.getElementById('crud-modal-title');
    const form = document.getElementById('customerCrudForm') || document.getElementById('customer-crud-form');
    const idInput = document.getElementById('crudCustomerId') || document.getElementById('crud-customer-id');
    const btnText = document.getElementById('saveCustomerBtnText');

    if (title) title.textContent = 'Add New Customer';
    if (btnText) btnText.textContent = 'Save Customer Record';
    if (form) form.reset();
    if (idInput) idInput.value = '';

    const statusEl = document.getElementById('crudStatus') || document.getElementById('crud-status');
    if (statusEl) statusEl.value = 'Active';

    // Clear and initialize dynamic medicines list with 1 default row
    const container = document.getElementById('crudMedicinesList');
    if (container) {
        container.innerHTML = '';
        addCrudMedicineRow();
    }

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function fillSampleCustomerForm() {
    const nameEl = document.getElementById('crudFullName');
    const ageEl = document.getElementById('crudAge');
    const genderEl = document.getElementById('crudGender');
    const mobileEl = document.getElementById('crudMobile');
    const statusEl = document.getElementById('crudStatus');
    const addressEl = document.getElementById('crudAddress');
    const areaEl = document.getElementById('crudAreaVillage');
    const rxEl = document.getElementById('crudPrescriptionAvailable');
    const doctorEl = document.getElementById('crudDoctor');
    const notesEl = document.getElementById('crudNotes');

    if (nameEl) nameEl.value = 'Rahul Sargar';
    if (ageEl) ageEl.value = '26';
    if (genderEl) genderEl.value = 'Male';
    if (mobileEl) mobileEl.value = '7709647627';
    if (statusEl) statusEl.value = 'Active';
    if (addressEl) addressEl.value = 'Near Wadhegaon Naka, Sangola';
    if (areaEl) areaEl.value = 'Sangola Town (413307)';
    if (rxEl) rxEl.value = 'Yes';
    if (doctorEl) doctorEl.value = 'Dr. S. K. Kulkarni (Cardiology)';
    if (notesEl) notesEl.value = 'Regular monthly medicine profile - Jankalyan Sangola patient with Tablet and Syrup requirement.';

    // Populate multiple sample medicines (Tablet + Syrup + Tablet)
    const container = document.getElementById('crudMedicinesList');
    if (container) {
        container.innerHTML = '';
        addCrudMedicineRow({ name: 'Telmakind 40mg', type: 'Tablet', strength: '40mg', quantity: '1 Strip (10 Tabs)' });
        addCrudMedicineRow({ name: 'Ascoril D Plus Cough Syrup', type: 'Syrup / Liquid', strength: '100ml Bottle', quantity: '1 Bottle' });
        addCrudMedicineRow({ name: 'Dolo 650', type: 'Tablet', strength: '650mg', quantity: '1 Strip (15 Tabs)' });
    }

    if (nameEl) nameEl.focus();
}

function openEditCustomerModal(id) {
    const customer = allCustomers.find(c => String(c.id) === String(id));
    if (!customer) return;

    const modal = document.getElementById('customer-crud-modal') || document.getElementById('admin-crud-modal');
    const backdrop = document.getElementById('customer-crud-backdrop') || document.getElementById('admin-modal-backdrop');
    const title = document.getElementById('crudModalTitle') || document.getElementById('crud-modal-title');
    const btnText = document.getElementById('saveCustomerBtnText');

    if (title) title.textContent = `Edit Customer: ${customer.full_name}`;
    if (btnText) btnText.textContent = 'Update Customer Record';

    const idEl = document.getElementById('crudCustomerId') || document.getElementById('crud-customer-id');
    const nameEl = document.getElementById('crudFullName') || document.getElementById('crud-full-name');
    const mobileEl = document.getElementById('crudMobile') || document.getElementById('crud-mobile-number');
    const ageEl = document.getElementById('crudAge') || document.getElementById('crud-age');
    const genderEl = document.getElementById('crudGender');
    const addressEl = document.getElementById('crudAddress') || document.getElementById('crud-address');
    const areaEl = document.getElementById('crudAreaVillage');
    const rxEl = document.getElementById('crudPrescriptionAvailable');
    const doctorEl = document.getElementById('crudDoctor') || document.getElementById('crud-doctor');
    const statusEl = document.getElementById('crudStatus') || document.getElementById('crud-status');
    const notesEl = document.getElementById('crudNotes') || document.getElementById('crud-notes');

    if (idEl) idEl.value = customer.id;
    if (nameEl) nameEl.value = customer.full_name || '';
    if (mobileEl) mobileEl.value = customer.mobile_number || '';
    if (ageEl) ageEl.value = customer.age || '';
    if (genderEl) genderEl.value = customer.gender || 'Not Specified';
    if (addressEl) addressEl.value = customer.address || '';
    if (areaEl) areaEl.value = customer.area_village || '';
    if (rxEl) rxEl.value = customer.prescription_available || 'Yes';
    if (doctorEl) doctorEl.value = customer.preferred_doctor || '';
    if (statusEl) statusEl.value = normalizeCustomerStatus(customer.status);
    if (notesEl) notesEl.value = customer.notes || '';

    // Populate multiple medicines
    const container = document.getElementById('crudMedicinesList');
    if (container) {
        container.innerHTML = '';
        let meds = [];
        if (Array.isArray(customer.medicines) && customer.medicines.length > 0) {
            meds = customer.medicines;
        } else if (customer.medicine_name || customer.required_tablet) {
            const raw = customer.medicine_name || customer.required_tablet;
            if (raw.includes(' | ') || raw.includes(' + ')) {
                const parts = raw.split(/\s*(?:\||\+)\s*/);
                meds = parts.map(part => {
                    const clean = part.replace(/^\d+\.\s*/, '').trim();
                    const isSyrup = clean.toLowerCase().includes('syrup') || clean.toLowerCase().includes('suspension');
                    return {
                        name: clean,
                        type: isSyrup ? 'Syrup / Liquid' : (customer.medicine_type || 'Tablet'),
                        strength: customer.medicine_strength || '',
                        quantity: ''
                    };
                });
            } else {
                meds = [{
                    name: raw,
                    type: customer.medicine_type || 'Tablet',
                    strength: customer.medicine_strength || '',
                    quantity: ''
                }];
            }
        } else {
            meds = [{ name: '', type: 'Tablet', strength: '', quantity: '' }];
        }

        meds.forEach(m => addCrudMedicineRow(m));
    }

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
    const gender = document.getElementById('crudGender')?.value || 'Not Specified';
    const address = (document.getElementById('crudAddress') || document.getElementById('crud-address'))?.value.trim();
    const area_village = document.getElementById('crudAreaVillage')?.value.trim() || 'Sangola';
    const prescription_available = document.getElementById('crudPrescriptionAvailable')?.value || 'Yes';
    const preferred_doctor = (document.getElementById('crudDoctor') || document.getElementById('crud-doctor'))?.value.trim();
    const status = (document.getElementById('crudStatus') || document.getElementById('crud-status'))?.value || 'Active';
    const notes = (document.getElementById('crudNotes') || document.getElementById('crud-notes'))?.value.trim();

    if (!full_name || !mobile_number) {
        alert('Please fill Full Name and Mobile Number.');
        return;
    }

    const medicines = getCrudMedicinesData();
    if (medicines.length === 0) {
        alert('Please add at least one medicine item (e.g. tablet, syrup).');
        const input = document.querySelector('#crudMedicinesList .crud-med-name-input');
        if (input) input.focus();
        return;
    }

    const medSummary = medicines.map((m, idx) => {
        let txt = m.name;
        if (m.strength) txt += ` (${m.strength})`;
        if (m.quantity) txt += ` [${m.quantity}]`;
        return medicines.length > 1 ? `${idx + 1}. ${txt}` : txt;
    }).join(' | ');

    const uniqueTypes = [...new Set(medicines.map(m => m.type))];
    const typeSummary = uniqueTypes.join(', ');
    const strengthSummary = medicines.map(m => m.strength).filter(Boolean).join(', ');

    const payload = {
        id: id || undefined,
        full_name,
        mobile_number,
        age: ageVal ? parseInt(ageVal, 10) : null,
        gender,
        address: address || 'Sangola',
        area_village: area_village || 'Sangola',
        medicines: medicines,
        medicine_name: medSummary,
        required_tablet: medSummary,
        medicine_strength: strengthSummary,
        medicine_type: typeSummary || 'Tablet',
        prescription_available,
        preferred_doctor: preferred_doctor || 'General Consultation',
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

        // Persist to local storage
        try {
            localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(allCustomers));
        } catch (e) {
            console.warn('Storage save warning:', e);
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
            saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span id="saveCustomerBtnText">Save Customer Record</span>';
        }
    }
}

async function updateCustomerStatus(id, newStatus) {
    const customer = allCustomers.find(c => String(c.id) === String(id));
    if (!customer) return;

    customer.status = newStatus;
    try {
        localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(allCustomers));
    } catch (e) {
        console.warn('Storage save warning:', e);
    }
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

// 13. Customer Record Deletion & WhatsApp Messaging
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
    if (btnText) btnText.textContent = 'Yes, Delete Customer Record';
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
    try {
        localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(allCustomers));
    } catch (e) {
        console.warn('Storage save warning:', e);
    }
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
        showToast(`Customer medicine record for ${customerName} deleted successfully.`);
    }
}

// Direct delete function for programmatic / button calls
async function deleteCustomerRecord(id) {
    openDeleteCustomerModal(id);
}

async function deleteCustomerRecordDirect(id) {
    allCustomers = allCustomers.filter(c => String(c.id) !== String(id));
    try {
        localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(allCustomers));
    } catch (e) {
        console.warn('Storage save warning:', e);
    }
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
        `🏥 *JANKALYAN MEDICAL - MEDICINE RECORD STATUS*`,
        `📍 *Store Location:* Near Wadhegaon Naka, Sangola 413307`,
        `📞 *Helpline:* +91 86691 18742`,
        `----------------------------------------`,
        `Namaste *${customer.full_name}*,`,
        `Your customer medicine record has been reviewed by Jankalyan Medical Sangola.`,
        `📋 *Medicine / Requirement:* ${customer.required_tablet || customer.medicine_name || 'General Prescription'}`,
        `📊 *Record Status:* *${statusText}*`,
        customer.preferred_doctor ? `👨‍⚕️ *Consulting Doctor:* ${customer.preferred_doctor}` : '',
        `📍 *Registered Address / Area:* ${customer.address || 'Sangola'}`,
        `----------------------------------------`,
        `📌 *Note:* Please collect your verified medicines from our counter at Wadhegaon Naka, Sangola or reply here for doorstep delivery inquiries.`
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

// 14. Export & Reporting Tools
function exportCustomersCSV() {
    if (!allCustomers.length) {
        alert('No customer medicine records available to export.');
        return;
    }

    const headers = [
        'Record ID',
        'Full Name',
        'Mobile Number',
        'Age',
        'Gender',
        'Address',
        'Area / Village',
        'Medicine Name',
        'Medicine Strength',
        'Medicine Type',
        'Preferred Doctor',
        'Prescription Available',
        'Status',
        'Notes',
        'Registration Date'
    ];
    
    const rows = allCustomers.map(c => [
        `"${c.id || ''}"`,
        `"${(c.full_name || '').replace(/"/g, '""')}"`,
        `"${(c.mobile_number || '').replace(/"/g, '""')}"`,
        `"${c.age || ''}"`,
        `"${(c.gender || 'Not Specified').replace(/"/g, '""')}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${(c.area_village || '').replace(/"/g, '""')}"`,
        `"${(c.medicine_name || c.required_tablet || '').replace(/"/g, '""')}"`,
        `"${(c.medicine_strength || '').replace(/"/g, '""')}"`,
        `"${(c.medicine_type || 'Tablet').replace(/"/g, '""')}"`,
        `"${(c.preferred_doctor || '').replace(/"/g, '""')}"`,
        `"${(c.prescription_available || 'Yes').replace(/"/g, '""')}"`,
        `"${c.status || 'Active'}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`,
        `"${c.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jankalyan_customer_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function printCustomersReport() {
    window.print();
}

async function resetSampleCustomers() {
    try {
        let res = await fetch('/api/admin/reset-samples', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken || ''}` }
        }).catch(() => null);

        if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (data && Array.isArray(data.customers)) {
                allCustomers = data.customers;
                try {
                    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(allCustomers));
                } catch (e) {
                    console.warn('Storage save warning:', e);
                }
            }
        }
    } catch (e) {
        console.warn('Reset error:', e);
    }
    renderCustomerTable();
    updateKpiStats();

    if (typeof showToast === 'function') {
        showToast('Sample customer medicine records reset successfully.');
    }
}

// 15. Supabase Schema Modal Controls & Tab Switching
function selectSchemaTab(tab) {
    const stockBtn = document.getElementById('schemaTabStockBtn') || document.getElementById('schemaTabDistBtn');
    const custBtn = document.getElementById('schemaTabCustBtn');
    const bothBtn = document.getElementById('schemaTabBothBtn');
    const codeBlock = document.getElementById('supabaseSqlCode');
    const headerLabel = document.getElementById('schemaCodeHeaderLabel');
    const statusHeadline = document.getElementById('schemaStatusHeadline');
    const statusDetail = document.getElementById('schemaStatusDetail');

    [stockBtn, custBtn, bothBtn].forEach(b => { if (b) b.classList.remove('active'); });

    const medicineStockSQL = `-- ============================================================================
-- JANKALYAN MEDICAL SANGOLA - MEDICINE STOCK & INVENTORY TABLE
-- Supabase SQL Editor Script: medicine_stock
-- Tracks Live Inventory, Batch Numbers, Expiry Dates, Shelf Racks & Pricing
-- ============================================================================

-- 1. Create medicine_stock table in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS medicine_stock (
  id BIGSERIAL PRIMARY KEY,
  medicine_name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL DEFAULT 'Tablet',
  manufacturer TEXT,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  unit TEXT NOT NULL DEFAULT 'Strips',
  purchase_price NUMERIC(10, 2) DEFAULT 0.00,
  mrp NUMERIC(10, 2) DEFAULT 0.00,
  selling_price NUMERIC(10, 2) DEFAULT 0.00,
  rack_location TEXT DEFAULT 'Rack A-1',
  prescription_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) and public access:
ALTER TABLE medicine_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated and public access to medicine_stock"
ON medicine_stock FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Create indexes for fast search & low stock / expiry alerting:
CREATE INDEX IF NOT EXISTS idx_stock_med_name ON medicine_stock(medicine_name);
CREATE INDEX IF NOT EXISTS idx_stock_batch ON medicine_stock(batch_number);
CREATE INDEX IF NOT EXISTS idx_stock_category ON medicine_stock(category);
CREATE INDEX IF NOT EXISTS idx_stock_expiry ON medicine_stock(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_qty ON medicine_stock(quantity);
CREATE INDEX IF NOT EXISTS idx_stock_rack ON medicine_stock(rack_location);`;

    const customersSQL = `-- ============================================================================
-- JANKALYAN MEDICAL SANGOLA - CUSTOMER MEDICINE REGISTRY TABLE
-- Supabase SQL Editor Script: customers
-- ============================================================================

-- 1. Create customers table in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  age INTEGER,
  gender TEXT DEFAULT 'Not Specified',
  address TEXT,
  area_village TEXT,
  medicines JSONB DEFAULT '[]'::jsonb,
  medicine_name TEXT,
  required_tablet TEXT,
  medicine_strength TEXT,
  medicine_type TEXT DEFAULT 'Tablet',
  preferred_doctor TEXT,
  prescription_available TEXT DEFAULT 'Yes',
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) and public access:
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated and public access to customers"
ON customers FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Create indexes:
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);`;

    if (tab === 'customers') {
        if (custBtn) custBtn.classList.add('active');
        if (headerLabel) headerLabel.innerHTML = '<i class="fa-solid fa-code"></i> Supabase SQL Table Definition (<code>customers</code>)';
        if (codeBlock) codeBlock.innerHTML = `<code>${escapeHtml(customersSQL)}</code>`;
        if (statusHeadline) statusHeadline.textContent = 'Supabase Table: customers (Patient Medicine Registry)';
        if (statusDetail) statusDetail.innerHTML = 'Tracks customer tablet requirements, prescription verification, doctor details, and WhatsApp dispatch orders.';
    } else if (tab === 'both') {
        if (bothBtn) bothBtn.classList.add('active');
        if (headerLabel) headerLabel.innerHTML = '<i class="fa-solid fa-layer-group"></i> Combined Supabase SQL (Both Tables)';
        if (codeBlock) codeBlock.innerHTML = `<code>${escapeHtml(medicineStockSQL + '\n\n' + customersSQL)}</code>`;
        if (statusHeadline) statusHeadline.textContent = 'Combined Supabase Schema (medicine_stock + customers)';
        if (statusDetail) statusDetail.innerHTML = 'Run this unified script once in Supabase SQL Editor to provision both the Medicine Stock Management and Customer Medicine Registry databases.';
    } else {
        if (stockBtn) stockBtn.classList.add('active');
        if (headerLabel) headerLabel.innerHTML = '<i class="fa-solid fa-code"></i> Supabase SQL Table Definition (<code>medicine_stock</code>)';
        if (codeBlock) codeBlock.innerHTML = `<code>${escapeHtml(medicineStockSQL)}</code>`;
        if (statusHeadline) statusHeadline.textContent = 'Supabase Table: medicine_stock (Pharmacy Inventory & Alerts)';
        if (statusDetail) statusDetail.innerHTML = 'Tracks pharmacy medicine catalog, batch numbers, expiry dates, in-stock quantities, reorder thresholds, shelf rack locations, and MRP/selling prices.';
    }
}

function openSupabaseSchemaModal(tab = 'stock') {
    selectSchemaTab(tab);
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

// 16. Order Success Modal
function showOrderSuccessModal(info) {
    const modal = document.getElementById('order-success-modal');
    const backdrop = document.getElementById('order-success-backdrop') || document.getElementById('admin-modal-backdrop');
    const summaryBox = document.getElementById('orderSummaryBox') || document.getElementById('order-summary-content');
    const waBtn = document.getElementById('dispatchWhatsAppBtn') || document.getElementById('success-wa-action-btn');

    if (summaryBox) {
        const medsHtml = info.medicines && info.medicines.length > 1
            ? `<div class="summary-item" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                <span>Required Medicines (${info.medicines.length} Items):</span>
                <div style="width: 100%; display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                    ${info.medicines.map((m, idx) => `
                        <div style="font-size: 0.84rem; background: #f0fdf4; padding: 4px 8px; border-radius: 6px; border: 1px solid #bbf7d0; display: flex; justify-content: space-between; align-items: center;">
                            <span><strong>${idx + 1}. ${escapeHtml(m.name)}</strong> ${m.strength ? `<small>(${escapeHtml(m.strength)})</small>` : ''}</span>
                            <span class="med-type-tag ${getMedTypeTagClass(m.type)}" style="font-size: 0.72rem; padding: 1px 6px;">${escapeHtml(m.type)}</span>
                        </div>
                    `).join('')}
                </div>
               </div>`
            : `<div class="summary-item"><span>Medicine Name:</span> <strong style="color: #16a34a;">${escapeHtml(info.medicine)} ${info.strength ? `(${escapeHtml(info.strength)})` : ''}</strong></div>
               <div class="summary-item"><span>Medicine Type:</span> <strong>${escapeHtml(info.medType || 'Tablet')}</strong></div>`;

        summaryBox.innerHTML = `
            <div class="summary-item"><span>Customer Name:</span> <strong>${escapeHtml(info.name)}</strong></div>
            <div class="summary-item"><span>Mobile Number:</span> <strong>${escapeHtml(info.phone)}</strong></div>
            ${info.age ? `<div class="summary-item"><span>Age / Gender:</span> <strong>${escapeHtml(info.age)} yrs (${escapeHtml(info.gender || 'N/A')})</strong></div>` : ''}
            <div class="summary-item"><span>Area / Village:</span> <strong>${escapeHtml(info.areaVillage || info.address || 'Sangola')}</strong></div>
            ${medsHtml}
            <div class="summary-item"><span>Prescription:</span> <strong>${escapeHtml(info.prescriptionAvail || 'Yes')}</strong></div>
            <div class="summary-item"><span>Preferred Doctor:</span> <strong>${escapeHtml(info.doctor || 'General Consultation')}</strong></div>
            <div class="summary-item"><span>Supabase Status:</span> <strong style="color: #15803d;"><i class="fa-solid fa-cloud-arrow-up"></i> Saved to Supabase Database</strong></div>
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

// 17. Floating Toast Notification
function showToast(message, type = 'success') {
    let toast = document.getElementById('jankalyanGlobalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'jankalyanGlobalToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.backgroundColor = '#064e3b';
        toast.style.color = '#ffffff';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.25)';
        toast.style.fontSize = '0.9rem';
        toast.style.fontWeight = '600';
        toast.style.zIndex = '100000';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(15px)';
        toast.style.pointerEvents = 'none';
        document.body.appendChild(toast);
    }

    const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';
    toast.style.backgroundColor = type === 'error' ? '#991b1b' : '#065f46';
    toast.innerHTML = `<i class="fa-solid ${icon}" style="font-size: 1.1rem;"></i> <span>${escapeHtml(message)}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(15px)';
    }, 4000);
}

/* ==========================================================================
   18. MEDICINE STOCK MANAGEMENT & PHARMACY INVENTORY
   Supabase Database & Admin Master Control Integration
   Tracks Live Medicine Stock, Batches, Expiry Dates, Shelf Racks & Pricing
   ========================================================================== */

let allStockItems = [];
let currentStockStatusFilter = 'All';
let currentStockCategoryFilter = 'All';
let stockSearchQuery = '';
let pendingDeleteStockId = null;
let currentStockViewMode = 'grid';
try {
    const savedMode = localStorage.getItem('jankalyan_stock_view_mode');
    if (savedMode) currentStockViewMode = savedMode;
} catch (e) {}
let currentStockSort = 'name_asc';
let isStockAlertDismissed = false;
const STOCK_STORAGE_KEY = 'jankalyan_medicine_stock';

// Fast-fill presets for popular pharmacy medicines in Sangola
const POPULAR_MEDICINE_PRESETS = {
    dolo650: {
        medicine_name: 'Dolo 650mg Tablet',
        generic_name: 'Paracetamol 650mg IP',
        category: 'Tablet',
        manufacturer: 'Micro Labs Ltd',
        unit: 'Strips (15 tabs)',
        rack_location: 'Rack A-1 (Counter)',
        purchase_price: 21.50,
        mrp: 33.60,
        selling_price: 31.00,
        quantity: 100,
        min_stock_level: 20,
        prescription_required: false,
        notes: 'Fast-moving antipyretic & analgesic. Keep well-stocked on front counter.'
    },
    telma40: {
        medicine_name: 'Telma 40mg Tablet',
        generic_name: 'Telmisartan 40mg IP',
        category: 'Tablet',
        manufacturer: 'Glenmark Pharmaceuticals',
        unit: 'Strips (15 tabs)',
        rack_location: 'Rack B-3 (Cardiac)',
        purchase_price: 135.00,
        mrp: 220.00,
        selling_price: 205.00,
        quantity: 45,
        min_stock_level: 15,
        prescription_required: true,
        notes: 'Blood pressure maintenance. Schedule H doctor prescription required.'
    },
    pand: {
        medicine_name: 'Pan-D Capsule',
        generic_name: 'Pantoprazole 40mg + Domperidone 30mg SR',
        category: 'Capsule',
        manufacturer: 'Alkem Laboratories',
        unit: 'Strips (15 caps)',
        rack_location: 'Rack C-1 (Gastro)',
        purchase_price: 125.00,
        mrp: 199.00,
        selling_price: 185.00,
        quantity: 50,
        min_stock_level: 15,
        prescription_required: false,
        notes: 'Gastro-resistant capsules for GERD and acidity relief.'
    },
    augmentin: {
        medicine_name: 'Augmentin 625 Duo Tablet',
        generic_name: 'Amoxycillin 500mg + Potassium Clavulanate 125mg IP',
        category: 'Tablet',
        manufacturer: 'GSK Pharmaceuticals',
        unit: 'Strips (10 tabs)',
        rack_location: 'Rack B-1 (Antibiotics)',
        purchase_price: 148.00,
        mrp: 223.00,
        selling_price: 208.00,
        quantity: 30,
        min_stock_level: 10,
        prescription_required: true,
        notes: 'Schedule H1 broad-spectrum antibiotic. Store in cool, dry place.'
    },
    ascoril: {
        medicine_name: 'Ascoril-D Cough Syrup',
        generic_name: 'Dextromethorphan HBr 10mg + Phenylephrine 5mg + Chlorpheniramine 2mg',
        category: 'Syrup / Liquid',
        manufacturer: 'Glenmark Pharma',
        unit: 'Bottles (100ml)',
        rack_location: 'Rack S-2 (Syrups)',
        purchase_price: 88.00,
        mrp: 138.00,
        selling_price: 128.00,
        quantity: 25,
        min_stock_level: 12,
        prescription_required: false,
        notes: 'Syrup for dry cough, cold and throat congestion relief.'
    },
    shelcal: {
        medicine_name: 'Shelcal 500 Tablet',
        generic_name: 'Calcium 500mg + Vitamin D3 250 IU',
        category: 'Tablet',
        manufacturer: 'Torrent Pharmaceuticals',
        unit: 'Strips (15 tabs)',
        rack_location: 'Rack C-2 (Supplements)',
        purchase_price: 78.00,
        mrp: 131.00,
        selling_price: 122.00,
        quantity: 60,
        min_stock_level: 15,
        prescription_required: false,
        notes: 'Essential daily calcium and vitamin D3 bone supplement.'
    },
    azithral: {
        medicine_name: 'Azithral 500 Tablet',
        generic_name: 'Azithromycin 500mg IP',
        category: 'Tablet',
        manufacturer: 'Alembic Pharmaceuticals',
        unit: 'Strips (5 tabs)',
        rack_location: 'Rack A-4 (Antibiotics)',
        purchase_price: 92.00,
        mrp: 142.00,
        selling_price: 132.00,
        quantity: 35,
        min_stock_level: 10,
        prescription_required: true,
        notes: 'Broad-spectrum macrolide antibiotic. Schedule H1 prescription.'
    },
    betadine: {
        medicine_name: 'Betadine 10% Ointment',
        generic_name: 'Povidone-Iodine 10% w/w',
        category: 'Ointment / Cream',
        manufacturer: 'Win-Medicare Ltd',
        unit: 'Tubes (20g)',
        rack_location: 'Rack D-1 (Antiseptics)',
        purchase_price: 75.00,
        mrp: 115.00,
        selling_price: 108.00,
        quantity: 40,
        min_stock_level: 10,
        prescription_required: false,
        notes: 'Microbicidal first-aid ointment for wound healing.'
    },
    monocef: {
        medicine_name: 'Monocef 1g Injection',
        generic_name: 'Ceftriaxone 1000mg IP (with sterile water)',
        category: 'Injection / Vial',
        manufacturer: 'Aristo Pharmaceuticals',
        unit: 'Vials (1g)',
        rack_location: 'Cold Storage (2-8°C)',
        purchase_price: 52.00,
        mrp: 78.00,
        selling_price: 72.00,
        quantity: 20,
        min_stock_level: 8,
        prescription_required: true,
        notes: 'Cephalosporin antibiotic injection. Strict clinical prescription.'
    },
    cetirizine: {
        medicine_name: 'Cetzine 10mg Tablet',
        generic_name: 'Cetirizine Hydrochloride 10mg IP',
        category: 'Tablet',
        manufacturer: 'Dr. Reddy\'s Laboratories',
        unit: 'Strips (10 tabs)',
        rack_location: 'Rack A-2 (Anti-Allergy)',
        purchase_price: 18.50,
        mrp: 28.50,
        selling_price: 26.00,
        quantity: 75,
        min_stock_level: 15,
        prescription_required: false,
        notes: 'Non-sedating antihistamine for seasonal rhinitis and allergies.'
    },
    electral: {
        medicine_name: 'Electral ORS Sachet',
        generic_name: 'Oral Rehydration Salts (WHO Formula)',
        category: 'Pediatric Drops / Food',
        manufacturer: 'FDC Ltd',
        unit: 'Sachets (21.8g)',
        rack_location: 'Counter Front Display',
        purchase_price: 16.00,
        mrp: 24.50,
        selling_price: 22.00,
        quantity: 80,
        min_stock_level: 20,
        prescription_required: false,
        notes: 'Rapid hydration recovery for diarrhea, vomiting and heat exhaustion.'
    }
};

// Initial medicine stock demo items
const INITIAL_STOCK_SAMPLE_ITEMS = [
    {
        id: 1,
        medicine_name: 'Dolo 650mg Tablet',
        generic_name: 'Paracetamol 650mg',
        category: 'Tablet',
        manufacturer: 'Micro Labs Ltd',
        batch_number: 'DL-2204',
        expiry_date: '2027-11-30',
        quantity: 145,
        min_stock_level: 20,
        unit: 'Strips (15 tabs)',
        purchase_price: 21.50,
        mrp: 33.60,
        selling_price: 31.00,
        rack_location: 'Rack A-1 (Counter)',
        prescription_required: false,
        notes: 'Fast-moving antipyretic & pain relief. High seasonal demand in Sangola.'
    },
    {
        id: 2,
        medicine_name: 'Telmakind 40mg Tablet',
        generic_name: 'Telmisartan 40mg IP',
        category: 'Tablet',
        manufacturer: 'Mankind Pharma',
        batch_number: 'TLM-8491',
        expiry_date: '2028-08-31',
        quantity: 12,
        min_stock_level: 25,
        unit: 'Strips (10 tabs)',
        purchase_price: 26.00,
        mrp: 42.50,
        selling_price: 39.00,
        rack_location: 'Rack B-3 (Cardiac)',
        prescription_required: true,
        notes: 'Essential blood pressure maintenance medicine for elderly patients.'
    },
    {
        id: 3,
        medicine_name: 'Pan-D Capsules',
        generic_name: 'Pantoprazole 40mg + Domperidone 30mg SR',
        category: 'Capsule',
        manufacturer: 'Alkem Laboratories',
        batch_number: 'PND-1092',
        expiry_date: '2028-04-30',
        quantity: 0,
        min_stock_level: 15,
        unit: 'Strips (15 caps)',
        purchase_price: 125.00,
        mrp: 199.00,
        selling_price: 185.00,
        rack_location: 'Rack C-1 (Gastro)',
        prescription_required: false,
        notes: 'Out of stock! Urgently reorder 20 boxes via Alkem Pandharpur supplier.'
    },
    {
        id: 4,
        medicine_name: 'Azee 500 Tablets',
        generic_name: 'Azithromycin 500mg IP',
        category: 'Tablet',
        manufacturer: 'Cipla Ltd',
        batch_number: 'AZ-9021',
        expiry_date: '2028-03-31',
        quantity: 65,
        min_stock_level: 15,
        unit: 'Strips (3 tabs)',
        purchase_price: 85.00,
        mrp: 132.00,
        selling_price: 124.00,
        rack_location: 'Rack A-4 (Antibiotics)',
        prescription_required: true,
        notes: 'Broad-spectrum antibiotic. Keep in dry place below 25°C.'
    },
    {
        id: 5,
        medicine_name: 'Ascoril-D Cough Syrup',
        generic_name: 'Dextromethorphan + Phenylephrine + Chlorpheniramine',
        category: 'Syrup / Liquid',
        manufacturer: 'Glenmark Pharma',
        batch_number: 'ASC-883',
        expiry_date: '2026-10-15',
        quantity: 8,
        min_stock_level: 15,
        unit: 'Bottles (100ml)',
        purchase_price: 88.00,
        mrp: 138.00,
        selling_price: 128.00,
        rack_location: 'Rack S-2 (Syrups)',
        prescription_required: false,
        notes: 'Expiring soon in Oct 2026! Return or dispense priority.'
    },
    {
        id: 6,
        medicine_name: 'Augmentin 625 Duo Tablets',
        generic_name: 'Amoxycillin 500mg + Potassium Clavulanate 125mg',
        category: 'Tablet',
        manufacturer: 'GSK Pharmaceuticals',
        batch_number: 'AUG-441',
        expiry_date: '2027-09-30',
        quantity: 40,
        min_stock_level: 10,
        unit: 'Strips (10 tabs)',
        purchase_price: 148.00,
        mrp: 223.00,
        selling_price: 208.00,
        rack_location: 'Rack B-1 (Antibiotics)',
        prescription_required: true,
        notes: 'Moisture-sensitive blister packing. Schedule H1 Rx strictly required.'
    },
    {
        id: 7,
        medicine_name: 'Volini Pain Relief Gel',
        generic_name: 'Diclofenac Diethylamine + Virgin Linseed Oil + Methyl Salicylate',
        category: 'Ointment / Cream',
        manufacturer: 'Sun Pharma',
        batch_number: 'VL-410',
        expiry_date: '2028-10-31',
        quantity: 28,
        min_stock_level: 10,
        unit: 'Tubes (75g)',
        purchase_price: 145.00,
        mrp: 210.00,
        selling_price: 195.00,
        rack_location: 'Rack D-2 (Topicals)',
        prescription_required: false,
        notes: 'Fast-acting topical analgesic gel for joint & muscle pain.'
    },
    {
        id: 8,
        medicine_name: 'Gemcal 500mg Softgels',
        generic_name: 'Calcium Carbonate 500mg + Calcitriol 0.25mcg + Zinc 7.5mg',
        category: 'Capsule',
        manufacturer: 'Alkem Laboratories',
        batch_number: 'GMC-182',
        expiry_date: '2028-05-31',
        quantity: 5,
        min_stock_level: 15,
        unit: 'Strips (15 softgels)',
        purchase_price: 180.00,
        mrp: 285.00,
        selling_price: 265.00,
        rack_location: 'Rack C-2 (Supplements)',
        prescription_required: false,
        notes: 'Low stock! High regular demand for orthopaedic prescriptions.'
    },
    {
        id: 9,
        medicine_name: 'Betadine 10% Ointment',
        generic_name: 'Povidone-Iodine 10% w/w',
        category: 'Ointment / Cream',
        manufacturer: 'Win-Medicare Ltd',
        batch_number: 'BT-991',
        expiry_date: '2028-02-28',
        quantity: 35,
        min_stock_level: 10,
        unit: 'Tubes (20g)',
        purchase_price: 75.00,
        mrp: 115.00,
        selling_price: 108.00,
        rack_location: 'Rack D-1 (Antiseptics)',
        prescription_required: false,
        notes: 'Standard first aid antiseptic ointment.'
    },
    {
        id: 10,
        medicine_name: 'Corex-DX Cough Syrup',
        generic_name: 'Dextromethorphan HBr 10mg + Chlorpheniramine Maleate 2mg',
        category: 'Syrup / Liquid',
        manufacturer: 'Pfizer Ltd',
        batch_number: 'CDX-301',
        expiry_date: '2027-12-31',
        quantity: 0,
        min_stock_level: 12,
        unit: 'Bottles (100ml)',
        purchase_price: 96.00,
        mrp: 145.00,
        selling_price: 135.00,
        rack_location: 'Rack S-1 (Syrups)',
        prescription_required: true,
        notes: 'Out of stock. Inquire with Pandharpur supplier.'
    }
];

// Helper: Calculate days until medicine expiry date
function getDaysUntilExpiry(expiryDateStr) {
    if (!expiryDateStr) return 999;
    const expiry = new Date(expiryDateStr);
    if (isNaN(expiry.getTime())) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper: Determine stock health classification
function getStockHealthStatus(item) {
    const qty = Number(item.quantity) || 0;
    const minLevel = Number(item.min_stock_level) || 10;
    const daysToExpiry = getDaysUntilExpiry(item.expiry_date);

    if (qty <= 0) return 'out_of_stock';
    if (daysToExpiry <= 90) return 'expiring_soon';
    if (qty <= minLevel) return 'low_stock';
    return 'in_stock';
}

// Load Medicine Stock Records from Server API / Supabase with Local Cache Fallback
async function loadStockRecords(forceRefresh = false) {
    const tableBody = document.getElementById('stockTableBody');
    const loadingState = document.getElementById('stockLoadingSpinner');
    const emptyState = document.getElementById('stockEmptyState');
    const refreshIcon = document.getElementById('stockRefreshIcon');

    if (refreshIcon) refreshIcon.classList.add('fa-spin');
    if (loadingState && (!allStockItems || allStockItems.length === 0 || forceRefresh)) {
        loadingState.style.display = 'flex';
    }

    // 1. Initial local cache check
    if (!allStockItems.length && !forceRefresh) {
        try {
            const cached = localStorage.getItem(STOCK_STORAGE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    allStockItems = parsed;
                    renderStockTable();
                    updateStockKpiStats();
                }
            }
        } catch (e) {}
    }

    // 2. Fetch fresh stock from backend server
    try {
        const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/stock', { headers });
        if (res.ok) {
            const data = await res.json();
            if (data && data.success && Array.isArray(data.items)) {
                allStockItems = data.items;
                try {
                    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
                } catch (e) {}
                renderStockTable();
                updateStockKpiStats(data.kpis);
                if (forceRefresh) showToast('Medicine stock inventory synchronized successfully.');
                return;
            }
        }
    } catch (err) {
        console.warn('Backend stock fetch failed, using local/sample cache:', err);
    } finally {
        if (loadingState) loadingState.style.display = 'none';
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
    }

    // 3. Fallback to sample items if empty
    if (!allStockItems || allStockItems.length === 0) {
        allStockItems = JSON.parse(JSON.stringify(INITIAL_STOCK_SAMPLE_ITEMS));
        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}
    }

    renderStockTable();
    updateStockKpiStats();
}

// Switch Stock View Mode: Cards Grid vs Data Table
function switchStockViewMode(mode) {
    currentStockViewMode = mode;
    try {
        localStorage.setItem('jankalyan_stock_view_mode', mode);
    } catch (e) {}

    const btnGrid = document.getElementById('btnViewGrid') || document.getElementById('viewModeGridBtn');
    const btnTable = document.getElementById('btnViewTable') || document.getElementById('viewModeTableBtn');

    if (btnGrid && btnTable) {
        if (mode === 'grid') {
            btnGrid.classList.add('active');
            btnTable.classList.remove('active');
        } else {
            btnTable.classList.add('active');
            btnGrid.classList.remove('active');
        }
    }

    renderStockUI();
}

function setStockViewMode(mode) {
    switchStockViewMode(mode);
}

// Handle Sort Dropdown Change
function handleStockSortChange(sortVal) {
    currentStockSort = sortVal;
    renderStockUI();
}

function handleStockSort(sortVal) {
    handleStockSortChange(sortVal);
}

// Sort stock records according to active criteria
function sortStockItems(items) {
    const list = [...items];
    switch (currentStockSort) {
        case 'name_asc':
            list.sort((a, b) => (a.medicine_name || '').localeCompare(b.medicine_name || ''));
            break;
        case 'name_desc':
            list.sort((a, b) => (b.medicine_name || '').localeCompare(a.medicine_name || ''));
            break;
        case 'qty_asc':
            list.sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0));
            break;
        case 'qty_desc':
            list.sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0));
            break;
        case 'expiry_asc':
            list.sort((a, b) => getDaysUntilExpiry(a.expiry_date) - getDaysUntilExpiry(b.expiry_date));
            break;
        case 'price_desc':
            list.sort((a, b) => (Number(b.selling_price) || 0) - (Number(a.selling_price) || 0));
            break;
        case 'mrp_desc':
            list.sort((a, b) => (Number(b.mrp) || 0) - (Number(a.mrp) || 0));
            break;
        case 'margin_desc':
            list.sort((a, b) => {
                const costA = Number(a.purchase_price) || 0;
                const sellA = Number(a.selling_price) || 0;
                const marginA = costA > 0 ? (sellA - costA) / costA : 0;
                const costB = Number(b.purchase_price) || 0;
                const sellB = Number(b.selling_price) || 0;
                const marginB = costB > 0 ? (sellB - costB) / costB : 0;
                return marginB - marginA;
            });
            break;
        default:
            list.sort((a, b) => (a.medicine_name || '').localeCompare(b.medicine_name || ''));
    }
    return list;
}

// Smart Urgent Alert Banner Logic
function renderStockSmartAlert() {
    const alertEl = document.getElementById('stockSmartAlertBanner') || document.getElementById('stockSmartAlert');
    const msgEl = document.getElementById('stockSmartAlertMessage') || document.getElementById('smartAlertMessage');
    if (!alertEl || !msgEl) return;

    if (isStockAlertDismissed) {
        alertEl.style.display = 'none';
        return;
    }

    let outCount = 0;
    let lowCount = 0;
    let expCount = 0;

    allStockItems.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const min = Number(item.min_stock_level) || 10;
        const days = getDaysUntilExpiry(item.expiry_date);

        if (qty <= 0) outCount++;
        else if (qty <= min) lowCount++;
        if (days >= 0 && days <= 90) expCount++;
    });

    if (outCount > 0 || lowCount > 0 || expCount > 0) {
        const textParts = [];
        if (outCount > 0) textParts.push(`<strong>${outCount} medicines are completely Out of Stock</strong>`);
        if (lowCount > 0) textParts.push(`<strong>${lowCount} medicines reached Low Alert level</strong>`);
        if (expCount > 0) textParts.push(`<strong>${expCount} medicines expiring within 90 days</strong>`);

        msgEl.innerHTML = `<strong>Attention Required:</strong> ${textParts.join(' and ')}. Review inventory and place reorder with pharmaceutical distributors.`;
        alertEl.style.display = 'flex';
    } else {
        alertEl.style.display = 'none';
    }
}

function dismissStockAlert() {
    isStockAlertDismissed = true;
    const alertEl = document.getElementById('stockSmartAlertBanner') || document.getElementById('stockSmartAlert');
    if (alertEl) alertEl.style.display = 'none';
}

function filterStockToUrgent() {
    filterStockByStatus('out_of_stock');
}

// 1-Click Fast Stock Quantity Stepper (+ / -)
async function quickStepStock(id, delta) {
    const index = allStockItems.findIndex(s => String(s.id) === String(id));
    if (index === -1) return;

    const item = allStockItems[index];
    const oldQty = Number(item.quantity) || 0;
    const newQty = Math.max(0, oldQty + delta);

    if (newQty === oldQty) return;

    item.quantity = newQty;
    item.updated_at = new Date().toISOString();

    try {
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
    } catch (e) {}

    renderStockUI();
    updateStockKpiStats();

    const actionWord = delta > 0 ? `+${delta} added` : `${delta} dispensed`;
    showToast(`${item.medicine_name}: Stock is now ${newQty} ${item.unit || 'units'} (${actionWord})`);

    // Asynchronously synchronize with server backend
    try {
        const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`/api/stock/${id}/adjust`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                delta,
                reason: delta > 0 ? 'Quick Inward' : 'Counter Dispensed Sale',
                notes: 'Quick 1-click stepper adjustment from Stock Hub'
            })
        }).catch(() => null);
    } catch (e) {}
}

// Main Stock UI Rendering Engine (Handles Filter, Sort, View Modes)
function renderStockUI() {
    const tableBody = document.getElementById('stockTableBody');
    const emptyState = document.getElementById('stockEmptyState');
    const tableWrapper = document.getElementById('stockTableWrapper');
    const cardsGrid = document.getElementById('stockGridWrapper') || document.getElementById('stockCardsGrid');

    // Synchronize toggle button active states
    const btnGrid = document.getElementById('btnViewGrid') || document.getElementById('viewModeGridBtn');
    const btnTable = document.getElementById('btnViewTable') || document.getElementById('viewModeTableBtn');
    if (btnGrid && btnTable) {
        if (currentStockViewMode === 'grid') {
            btnGrid.classList.add('active');
            btnTable.classList.remove('active');
        } else {
            btnTable.classList.add('active');
            btnGrid.classList.remove('active');
        }
    }

    // Filter items according to active filters and search query
    let filtered = [...allStockItems];

    // Status filter
    if (currentStockStatusFilter !== 'All') {
        filtered = filtered.filter(item => {
            const health = getStockHealthStatus(item);
            return health === currentStockStatusFilter;
        });
    }

    // Category filter
    if (currentStockCategoryFilter !== 'All') {
        filtered = filtered.filter(item => (item.category || '').toLowerCase() === currentStockCategoryFilter.toLowerCase());
    }

    // Search query
    if (stockSearchQuery.trim()) {
        const q = stockSearchQuery.trim().toLowerCase();
        filtered = filtered.filter(item => {
            return (
                (item.medicine_name && item.medicine_name.toLowerCase().includes(q)) ||
                (item.generic_name && item.generic_name.toLowerCase().includes(q)) ||
                (item.manufacturer && item.manufacturer.toLowerCase().includes(q)) ||
                (item.batch_number && item.batch_number.toLowerCase().includes(q)) ||
                (item.category && item.category.toLowerCase().includes(q)) ||
                (item.rack_location && item.rack_location.toLowerCase().includes(q)) ||
                (item.notes && item.notes.toLowerCase().includes(q))
            );
        });
    }

    // Apply Sorting
    filtered = sortStockItems(filtered);

    // Update Smart Alert Banner
    renderStockSmartAlert();

    // Show / hide empty state
    if (filtered.length === 0) {
        if (tableBody) tableBody.innerHTML = '';
        if (cardsGrid) cardsGrid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (tableWrapper) tableWrapper.style.display = 'none';
        if (cardsGrid) cardsGrid.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (currentStockViewMode === 'grid') {
        // Render Cards Grid
        if (tableWrapper) tableWrapper.style.display = 'none';
        if (cardsGrid) {
            cardsGrid.style.display = 'grid';
            renderStockCardsGrid(filtered, cardsGrid);
        }
    } else {
        // Render Data Table
        if (cardsGrid) cardsGrid.style.display = 'none';
        if (tableWrapper) tableWrapper.style.display = 'block';
        if (tableBody) {
            renderStockTableRows(filtered, tableBody);
        }
    }
}

// Alias for backwards compatibility
function renderStockTable() {
    renderStockUI();
}

// Render Visual Cards Grid View
function renderStockCardsGrid(items, container) {
    container.innerHTML = items.map(item => {
        const qty = Number(item.quantity) || 0;
        const minLevel = Number(item.min_stock_level) || 10;
        const daysToExpiry = getDaysUntilExpiry(item.expiry_date);
        const health = getStockHealthStatus(item);

        // Progress bar percentage based on reorder threshold
        const maxRef = Math.max(minLevel * 2.5, 30);
        const pct = Math.min(100, Math.round((qty / maxRef) * 100));

        let healthClass = 'safe';
        let cardStatusClass = '';
        let healthLabel = 'In Stock';
        let barClass = 'safe';
        let qtyTextClass = 'text-safe';

        if (health === 'out_of_stock') {
            healthClass = 'danger';
            cardStatusClass = 'status-out';
            healthLabel = 'Out of Stock';
            barClass = 'out';
            qtyTextClass = 'text-out';
        } else if (health === 'low_stock') {
            healthClass = 'warn';
            cardStatusClass = 'status-low';
            healthLabel = 'Low Stock';
            barClass = 'low';
            qtyTextClass = 'text-low';
        } else if (health === 'expiring_soon') {
            healthClass = 'amber';
            healthLabel = 'Expiring Soon';
        }

        // Expiry text formatting
        let expiryBadgeHtml = '';
        if (daysToExpiry < 0) {
            expiryBadgeHtml = `<span class="stock-badge-tag expired"><i class="fa-solid fa-triangle-exclamation"></i> Expired (${Math.abs(daysToExpiry)}d ago)</span>`;
        } else if (daysToExpiry <= 90) {
            expiryBadgeHtml = `<span class="stock-badge-tag expiring"><i class="fa-solid fa-hourglass-half"></i> ⏳ ${daysToExpiry} days left</span>`;
        } else {
            const expYears = (daysToExpiry / 365).toFixed(1);
            expiryBadgeHtml = `<span class="stock-badge-tag safe"><i class="fa-solid fa-circle-check"></i> ${expYears} yrs left</span>`;
        }

        // Commercials & profit margin
        const purchaseRate = Number(item.purchase_price) || 0;
        const mrpRate = Number(item.mrp) || 0;
        const sellRate = Number(item.selling_price) || 0;
        let marginBadge = '';
        if (purchaseRate > 0 && sellRate > purchaseRate) {
            const marginPct = (((sellRate - purchaseRate) / purchaseRate) * 100).toFixed(0);
            marginBadge = `<span class="price-item-margin">+${marginPct}% Margin</span>`;
        }

        return `
            <div class="stock-card ${cardStatusClass}" data-stock-id="${item.id}">
                <!-- Card Header -->
                <div class="stock-card-header">
                    <div class="stock-card-title-group">
                        <h4 class="stock-card-med-name">${escapeHtml(item.medicine_name || 'Unnamed')}</h4>
                        ${item.generic_name ? `<span class="stock-card-generic"><i class="fa-solid fa-flask-vial"></i> ${escapeHtml(item.generic_name)}</span>` : ''}
                    </div>
                    <div class="stock-card-badges">
                        <span class="stock-category-chip"><i class="fa-solid fa-tag"></i> ${escapeHtml(item.category || 'Tablet')}</span>
                        ${item.prescription_required ? '<span class="rx-pill-badge" title="Doctor Prescription Required"><i class="fa-solid fa-prescription"></i> Rx</span>' : ''}
                    </div>
                </div>

                <!-- Manufacturer & Batch -->
                <div class="stock-card-mfr-batch">
                    <span><i class="fa-solid fa-industry" style="color: #64748b; font-size: 0.72rem;"></i> ${escapeHtml(item.manufacturer || 'Pharma')}</span>
                    <span class="stock-batch-code">${escapeHtml(item.batch_number || 'N/A')}</span>
                </div>

                <!-- Visual Stock Progress Meter -->
                <div class="stock-level-bar-wrap">
                    <div class="stock-level-bar-track">
                        <div class="stock-level-bar-fill ${barClass}" style="width: ${qty === 0 ? '4%' : pct + '%'};"></div>
                    </div>
                    <div class="stock-level-labels">
                        <span>Status: <strong style="color: ${qty === 0 ? '#dc2626' : (qty <= minLevel ? '#d97706' : '#059669')};">${healthLabel}</strong></span>
                        <span>Reorder alert: ${minLevel} ${escapeHtml(item.unit || 'units')}</span>
                    </div>
                </div>

                <!-- 1-Click Fast Stepper Quantity Controls -->
                <div class="stock-stepper-box">
                    <div class="stepper-left-actions">
                        <button type="button" class="btn-stepper minus" onclick="quickStepStock(${item.id}, -1)" ${qty <= 0 ? 'disabled' : ''} title="Dispense / Deduct 1 Unit (-1)">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                    </div>

                    <div class="stepper-center-info">
                        <div class="stepper-big-qty ${qtyTextClass}">${qty}</div>
                        <span class="stepper-unit-label">${escapeHtml(item.unit || 'Units')} in Stock</span>
                    </div>

                    <div class="stepper-right-actions">
                        <button type="button" class="btn-stepper" onclick="quickStepStock(${item.id}, 1)" title="Inward / Add 1 Unit (+1)">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <button type="button" class="btn-stepper-box-10" onclick="quickStepStock(${item.id}, 10)" title="Add 1 Full Box (+10 Units)">
                            +10
                        </button>
                    </div>
                </div>

                <!-- Pricing & Margin Strip -->
                <div class="stock-card-price-strip">
                    <div>
                        <span style="color: #64748b; font-size: 0.72rem; display: block;">Selling Price</span>
                        <strong class="price-item-selling">₹${sellRate.toFixed(2)}</strong>
                    </div>
                    ${mrpRate > 0 ? `
                        <div>
                            <span style="color: #64748b; font-size: 0.72rem; display: block;">MRP</span>
                            <span class="price-item-mrp">₹${mrpRate.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div>
                        <span style="color: #64748b; font-size: 0.72rem; display: block;">Cost: ₹${purchaseRate.toFixed(2)}</span>
                        ${marginBadge}
                    </div>
                </div>

                <!-- Card Footer & Actions -->
                <div class="stock-card-footer">
                    <div class="card-footer-info">
                        <span class="rack-badge" title="Storage Shelf Location"><i class="fa-solid fa-map-pin"></i> ${escapeHtml(item.rack_location || 'Shelf')}</span>
                        ${expiryBadgeHtml}
                    </div>

                    <div class="stock-actions-group">
                        <button type="button" class="btn-stock-action btn-adjust" onclick="openStockAdjustModal(${item.id})" title="Quick Stock Adjustment (+/- Units)">
                            <i class="fa-solid fa-sliders"></i>
                            <span>Adjust</span>
                        </button>
                        <button type="button" class="btn-stock-action btn-edit" onclick="openEditStockModal(${item.id})" title="Edit Details">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-stock-action btn-delete" onclick="openDeleteStockModal(${item.id})" title="Delete Item">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Data Table Rows (with inline stepper support)
function renderStockTableRows(items, tableBody) {
    tableBody.innerHTML = items.map(item => {
        const qty = Number(item.quantity) || 0;
        const minLevel = Number(item.min_stock_level) || 10;
        const daysToExpiry = getDaysUntilExpiry(item.expiry_date);
        const health = getStockHealthStatus(item);

        // Expiry text formatting
        let expiryBadgeHtml = '';
        if (daysToExpiry < 0) {
            expiryBadgeHtml = `<span class="stock-badge-tag expired"><i class="fa-solid fa-triangle-exclamation"></i> EXPIRED (${Math.abs(daysToExpiry)}d ago)</span>`;
        } else if (daysToExpiry <= 90) {
            expiryBadgeHtml = `<span class="stock-badge-tag expiring"><i class="fa-solid fa-hourglass-half"></i> Expiring in ${daysToExpiry} days</span>`;
        } else {
            const expYears = (daysToExpiry / 365).toFixed(1);
            expiryBadgeHtml = `<span class="stock-badge-tag safe"><i class="fa-solid fa-circle-check"></i> ${expYears} yrs left</span>`;
        }

        // Qty styling
        let qtyColor = '#059669';
        let qtyBg = '#ecfdf5';
        let qtyBorder = '#a7f3d0';
        if (qty <= 0) {
            qtyColor = '#dc2626';
            qtyBg = '#fef2f2';
            qtyBorder = '#fca5a5';
        } else if (qty <= minLevel) {
            qtyColor = '#d97706';
            qtyBg = '#fffbeb';
            qtyBorder = '#fde68a';
        }

        // Health pill
        let healthPillHtml = '';
        if (health === 'out_of_stock') {
            healthPillHtml = `<span class="stock-health-pill out"><i class="fa-solid fa-circle-xmark"></i> Out of Stock</span>`;
        } else if (health === 'low_stock') {
            healthPillHtml = `<span class="stock-health-pill low"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock (${qty})</span>`;
        } else if (health === 'expiring_soon') {
            healthPillHtml = `<span class="stock-health-pill expiring"><i class="fa-solid fa-hourglass-half"></i> Expiring Soon</span>`;
        } else {
            healthPillHtml = `<span class="stock-health-pill ok"><i class="fa-solid fa-circle-check"></i> In Stock</span>`;
        }

        const purchaseRate = Number(item.purchase_price) || 0;
        const mrpRate = Number(item.mrp) || 0;
        const sellRate = Number(item.selling_price) || 0;

        return `
            <tr data-stock-id="${item.id}" class="stock-row ${health === 'out_of_stock' ? 'row-out-of-stock' : ''}">
                <!-- Medicine & Composition -->
                <td>
                    <div class="stock-med-cell">
                        <div class="stock-med-name-wrap">
                            <strong class="stock-med-title">${escapeHtml(item.medicine_name || 'Unnamed')}</strong>
                            ${item.prescription_required ? '<span class="rx-pill-badge" title="Schedule H/H1 Doctor Prescription Required"><i class="fa-solid fa-prescription"></i> Rx</span>' : ''}
                        </div>
                        ${item.generic_name ? `<span class="stock-generic-sub"><i class="fa-solid fa-flask-vial"></i> ${escapeHtml(item.generic_name)}</span>` : ''}
                        ${item.notes ? `<small class="stock-notes-sub" title="${escapeHtml(item.notes)}"><i class="fa-solid fa-circle-info"></i> ${escapeHtml(item.notes.slice(0, 50))}${item.notes.length > 50 ? '...' : ''}</small>` : ''}
                    </div>
                </td>

                <!-- Category & Manufacturer -->
                <td>
                    <div class="stock-mfr-cell">
                        <span class="stock-category-chip"><i class="fa-solid fa-tag"></i> ${escapeHtml(item.category || 'Tablet')}</span>
                        <span class="stock-mfr-name">${escapeHtml(item.manufacturer || 'Standard Pharma')}</span>
                    </div>
                </td>

                <!-- Batch No. & Expiry -->
                <td>
                    <div class="stock-batch-cell">
                        <span class="stock-batch-code">${escapeHtml(item.batch_number || 'N/A')}</span>
                        <div class="stock-expiry-line">
                            <span class="stock-expiry-date">${item.expiry_date || 'N/A'}</span>
                            ${expiryBadgeHtml}
                        </div>
                    </div>
                </td>

                <!-- In-Stock Qty with Fast Inline Stepper -->
                <td>
                    <div class="stock-qty-cell">
                        <div class="table-stepper-wrap" style="background: ${qtyBg}; border-color: ${qtyBorder};">
                            <button type="button" class="btn-table-step minus" onclick="quickStepStock(${item.id}, -1)" ${qty <= 0 ? 'disabled' : ''} title="Dispense 1 unit (-1)">-</button>
                            <span class="table-step-qty" style="color: ${qtyColor};">${qty}</span>
                            <button type="button" class="btn-table-step" onclick="quickStepStock(${item.id}, 1)" title="Add 1 unit (+1)">+</button>
                        </div>
                        <small style="display: block; font-size: 0.7rem; color: #64748b; margin-top: 2px;">${escapeHtml(item.unit || 'Units')}</small>
                    </div>
                </td>

                <!-- Min Reorder Level -->
                <td>
                    <div class="stock-min-cell">
                        <span class="min-level-text">${minLevel} ${escapeHtml(item.unit || 'Units')}</span>
                        ${qty <= minLevel ? '<small style="color: #ea580c; font-weight: 600; display: block; font-size: 0.74rem;">⚠️ Reorder Required</small>' : '<small style="color: #64748b; display: block; font-size: 0.74rem;">Shelf Threshold</small>'}
                    </div>
                </td>

                <!-- Pricing (₹) -->
                <td>
                    <div class="stock-price-cell">
                        <div class="price-row"><span class="price-lbl">Cost:</span> <span class="price-val">₹${purchaseRate.toFixed(2)}</span></div>
                        <div class="price-row"><span class="price-lbl">MRP:</span> <span class="price-val mrp-val">₹${mrpRate.toFixed(2)}</span></div>
                        <div class="price-row"><span class="price-lbl">Sell:</span> <strong class="price-val sell-val" style="color: #059669;">₹${sellRate.toFixed(2)}</strong></div>
                    </div>
                </td>

                <!-- Rack / Shelf Location -->
                <td>
                    <div class="stock-rack-cell">
                        <span class="rack-badge"><i class="fa-solid fa-map-pin"></i> ${escapeHtml(item.rack_location || 'General Shelf')}</span>
                    </div>
                </td>

                <!-- Stock Health Status -->
                <td>
                    ${healthPillHtml}
                </td>

                <!-- Actions -->
                <td class="text-right">
                    <div class="stock-actions-group">
                        <button type="button" class="btn-stock-action btn-adjust" onclick="openStockAdjustModal(${item.id})" title="Quick Stock Adjustment (+/- Units)">
                            <i class="fa-solid fa-sliders"></i>
                            <span>Adjust</span>
                        </button>
                        <button type="button" class="btn-stock-action btn-edit" onclick="openEditStockModal(${item.id})" title="Edit Medicine Stock Details">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-stock-action btn-delete" onclick="openDeleteStockModal(${item.id})" title="Delete Medicine Stock Item">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update KPI Stats Cards and Filter Counts
function updateStockKpiStats(serverKpis) {
    const totalItems = allStockItems.length;
    let totalQty = 0;
    let totalValuation = 0;
    let lowCount = 0;
    let outCount = 0;
    let expiringCount = 0;
    let adequateCount = 0;

    allStockItems.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const minLevel = Number(item.min_stock_level) || 10;
        const daysToExpiry = getDaysUntilExpiry(item.expiry_date);
        const cost = Number(item.purchase_price) || 0;

        totalQty += qty;
        totalValuation += qty * cost;

        if (qty <= 0) {
            outCount++;
        } else if (daysToExpiry <= 90) {
            expiringCount++;
        } else if (qty <= minLevel) {
            lowCount++;
        } else {
            adequateCount++;
        }
    });

    // Update KPI Card UI elements
    const kpiTotalEl = document.getElementById('kpiStockTotalItems');
    const kpiValuationEl = document.getElementById('kpiStockValuation');
    const kpiAdequateEl = document.getElementById('kpiStockAdequateCount');
    const kpiLowEl = document.getElementById('kpiStockLowCount');
    const kpiOutEl = document.getElementById('kpiStockOutCount');
    const kpiExpiringEl = document.getElementById('kpiStockExpiringCount');
    const tabStockBadge = document.getElementById('tabStockCount');

    if (kpiTotalEl) kpiTotalEl.textContent = totalItems;
    if (kpiValuationEl) kpiValuationEl.textContent = `₹${Math.round(totalValuation).toLocaleString('en-IN')} Total Valuation • ${totalQty} Units`;
    if (kpiAdequateEl) kpiAdequateEl.textContent = adequateCount;
    if (kpiLowEl) kpiLowEl.textContent = lowCount;
    if (kpiOutEl) kpiOutEl.textContent = outCount;
    if (kpiExpiringEl) kpiExpiringEl.textContent = expiringCount;
    if (tabStockBadge) tabStockBadge.textContent = totalItems;

    // Update filter counts
    const countAll = document.getElementById('stockCountAll');
    const countAdequate = document.getElementById('stockCountAdequate');
    const countLow = document.getElementById('stockCountLow');
    const countOut = document.getElementById('stockCountOut');
    const countExpiring = document.getElementById('stockCountExpiring');

    if (countAll) countAll.textContent = totalItems;
    if (countAdequate) countAdequate.textContent = adequateCount;
    if (countLow) countLow.textContent = lowCount;
    if (countOut) countOut.textContent = outCount;
    if (countExpiring) countExpiring.textContent = expiringCount;
}

// Open Add Stock Modal
function openAddStockModal() {
    const modal = document.getElementById('stock-crud-modal');
    const backdrop = document.getElementById('stock-crud-backdrop');
    const form = document.getElementById('medicineStockForm');

    if (form) form.reset();

    const titleEl = document.getElementById('stockCrudModalTitle');
    const saveBtnText = document.getElementById('saveStockBtnText');
    const idEl = document.getElementById('stockCrudItemId');

    if (titleEl) titleEl.textContent = 'Add Medicine Stock';
    if (saveBtnText) saveBtnText.textContent = 'Save Medicine Stock';
    if (idEl) idEl.value = '';

    // Set sensible defaults
    const categoryEl = document.getElementById('stockCategory');
    const qtyEl = document.getElementById('stockQuantity');
    const minLevelEl = document.getElementById('stockMinLevel');
    const unitEl = document.getElementById('stockUnit');
    const rackEl = document.getElementById('stockRackLocation');
    const expEl = document.getElementById('stockExpiryDate');

    if (categoryEl) categoryEl.value = 'Tablet';
    if (qtyEl) qtyEl.value = '20';
    if (minLevelEl) minLevelEl.value = '10';
    if (unitEl) unitEl.value = 'Strips (10 tabs)';
    if (rackEl) rackEl.value = 'Rack A-1';

    // Default expiry date: 2 years ahead
    if (expEl) {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 2);
        expEl.value = future.toISOString().slice(0, 10);
    }

    calculateModalMargin();

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

// Open Edit Stock Modal
function openEditStockModal(id) {
    const item = allStockItems.find(s => String(s.id) === String(id));
    if (!item) {
        showToast('Medicine stock item not found.');
        return;
    }

    const modal = document.getElementById('stock-crud-modal');
    const backdrop = document.getElementById('stock-crud-backdrop');
    const titleEl = document.getElementById('stockCrudModalTitle');
    const saveBtnText = document.getElementById('saveStockBtnText');

    if (titleEl) titleEl.textContent = `Edit Medicine Stock: ${item.medicine_name}`;
    if (saveBtnText) saveBtnText.textContent = 'Update Stock Item';

    // Populate form fields
    const idEl = document.getElementById('stockCrudItemId');
    const nameEl = document.getElementById('stockMedicineName');
    const genericEl = document.getElementById('stockGenericName');
    const categoryEl = document.getElementById('stockCategory');
    const mfrEl = document.getElementById('stockManufacturer');
    const batchEl = document.getElementById('stockBatchNumber');
    const expiryEl = document.getElementById('stockExpiryDate');
    const qtyEl = document.getElementById('stockQuantity');
    const minEl = document.getElementById('stockMinLevel');
    const unitEl = document.getElementById('stockUnit');
    const rackEl = document.getElementById('stockRackLocation');
    const purchaseEl = document.getElementById('stockPurchasePrice');
    const mrpEl = document.getElementById('stockMrp');
    const sellingEl = document.getElementById('stockSellingPrice');
    const rxEl = document.getElementById('stockRxRequired');
    const notesEl = document.getElementById('stockNotes');

    if (idEl) idEl.value = item.id;
    if (nameEl) nameEl.value = item.medicine_name || '';
    if (genericEl) genericEl.value = item.generic_name || '';
    if (categoryEl) categoryEl.value = item.category || 'Tablet';
    if (mfrEl) mfrEl.value = item.manufacturer || '';
    if (batchEl) batchEl.value = item.batch_number || '';
    if (expiryEl) expiryEl.value = item.expiry_date || '';
    if (qtyEl) qtyEl.value = item.quantity !== undefined ? item.quantity : 0;
    if (minEl) minEl.value = item.min_stock_level !== undefined ? item.min_stock_level : 10;
    if (unitEl) unitEl.value = item.unit || 'Strips';
    if (rackEl) rackEl.value = item.rack_location || '';
    if (purchaseEl) purchaseEl.value = item.purchase_price !== undefined ? item.purchase_price : 0;
    if (mrpEl) mrpEl.value = item.mrp !== undefined ? item.mrp : 0;
    if (sellingEl) sellingEl.value = item.selling_price !== undefined ? item.selling_price : 0;
    if (rxEl) rxEl.checked = Boolean(item.prescription_required);
    if (notesEl) notesEl.value = item.notes || '';

    calculateModalMargin();

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

// Close Add/Edit Stock Modal
function closeStockModal() {
    const modal = document.getElementById('stock-crud-modal');
    const backdrop = document.getElementById('stock-crud-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

// Handle Add/Edit Stock Form Submit
async function handleStockFormSubmit(event) {
    if (event) event.preventDefault();

    const idEl = document.getElementById('stockCrudItemId');
    const isEdit = idEl && idEl.value.trim().length > 0;
    const itemId = isEdit ? idEl.value.trim() : null;

    const medicineName = (document.getElementById('stockMedicineName')?.value || '').trim();
    const genericName = (document.getElementById('stockGenericName')?.value || '').trim();
    const category = (document.getElementById('stockCategory')?.value || 'Tablet').trim();
    const manufacturer = (document.getElementById('stockManufacturer')?.value || '').trim();
    const batchNumber = (document.getElementById('stockBatchNumber')?.value || '').trim().toUpperCase();
    const expiryDate = (document.getElementById('stockExpiryDate')?.value || '').trim();
    const quantity = parseInt(document.getElementById('stockQuantity')?.value, 10) || 0;
    const minLevel = parseInt(document.getElementById('stockMinLevel')?.value, 10) || 10;
    const unit = (document.getElementById('stockUnit')?.value || 'Strips').trim();
    const rackLocation = (document.getElementById('stockRackLocation')?.value || 'Rack A-1').trim();
    const purchasePrice = parseFloat(document.getElementById('stockPurchasePrice')?.value) || 0;
    const mrp = parseFloat(document.getElementById('stockMrp')?.value) || 0;
    const sellingPrice = parseFloat(document.getElementById('stockSellingPrice')?.value) || 0;
    const rxRequired = Boolean(document.getElementById('stockRxRequired')?.checked);
    const notes = (document.getElementById('stockNotes')?.value || '').trim();

    if (!medicineName) {
        showToast('Please enter the Medicine / Brand Name.');
        return;
    }
    if (!batchNumber) {
        showToast('Please enter a Batch Number.');
        return;
    }
    if (!expiryDate) {
        showToast('Please specify the Expiry Date.');
        return;
    }

    const payload = {
        medicine_name: medicineName,
        generic_name: genericName,
        category,
        manufacturer,
        batch_number: batchNumber,
        expiry_date: expiryDate,
        quantity,
        min_stock_level: minLevel,
        unit,
        rack_location: rackLocation,
        purchase_price: purchasePrice,
        mrp,
        selling_price: sellingPrice,
        prescription_required: rxRequired,
        notes
    };

    const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const saveBtn = document.getElementById('saveStockBtn');
    if (saveBtn) saveBtn.disabled = true;

    try {
        if (isEdit) {
            // Update existing stock item
            await fetch(`/api/stock/${itemId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            }).catch(() => null);

            const index = allStockItems.findIndex(s => String(s.id) === String(itemId));
            if (index !== -1) {
                allStockItems[index] = { ...allStockItems[index], ...payload, updated_at: new Date().toISOString() };
            }
            showToast(`Medicine '${medicineName}' updated in stock.`);
        } else {
            // Add new stock item
            let res = await fetch('/api/stock', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            }).catch(() => null);

            let createdItem = null;
            if (res && res.ok) {
                const data = await res.json();
                if (data && data.item) createdItem = data.item;
            }

            if (!createdItem) {
                const maxId = allStockItems.reduce((max, s) => Math.max(max, typeof s.id === 'number' ? s.id : parseInt(s.id, 10) || 0), 0);
                createdItem = {
                    ...payload,
                    id: maxId + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            }

            allStockItems.unshift(createdItem);
            showToast(`Medicine '${medicineName}' added to stock inventory.`);
        }

        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}

        closeStockModal();
        renderStockTable();
        updateStockKpiStats();
    } catch (err) {
        console.error('Error saving stock record:', err);
        showToast('Error saving medicine stock record.');
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

// Quick Preset: Fill Manufacturer
function quickFillStockManufacturer(name) {
    const input = document.getElementById('stockManufacturer');
    if (input) input.value = name;
}

// 1-Click Fast Fill Preset Popular Medicines
function quickFillPresetMedicine(presetKey) {
    const preset = POPULAR_MEDICINE_PRESETS[presetKey];
    if (!preset) return;

    const nameEl = document.getElementById('stockMedicineName');
    const genericEl = document.getElementById('stockGenericName');
    const catEl = document.getElementById('stockCategory');
    const mfrEl = document.getElementById('stockManufacturer');
    const unitEl = document.getElementById('stockUnit');
    const rackEl = document.getElementById('stockRackLocation');
    const purchaseEl = document.getElementById('stockPurchasePrice');
    const mrpEl = document.getElementById('stockMrp');
    const sellingEl = document.getElementById('stockSellingPrice');
    const qtyEl = document.getElementById('stockQuantity');
    const minEl = document.getElementById('stockMinLevel');
    const rxEl = document.getElementById('stockRxRequired');
    const notesEl = document.getElementById('stockNotes');
    const batchEl = document.getElementById('stockBatchNumber');
    const expEl = document.getElementById('stockExpiryDate');

    if (nameEl) nameEl.value = preset.medicine_name;
    if (genericEl) genericEl.value = preset.generic_name;
    if (catEl) catEl.value = preset.category;
    if (mfrEl) mfrEl.value = preset.manufacturer;
    if (unitEl) unitEl.value = preset.unit;
    if (rackEl) rackEl.value = preset.rack_location;
    if (purchaseEl) purchaseEl.value = preset.purchase_price;
    if (mrpEl) mrpEl.value = preset.mrp;
    if (sellingEl) sellingEl.value = preset.selling_price;
    if (qtyEl) qtyEl.value = preset.quantity;
    if (minEl) minEl.value = preset.min_stock_level;
    if (rxEl) rxEl.checked = Boolean(preset.prescription_required);
    if (notesEl) notesEl.value = preset.notes;

    // Generate random realistic batch number if empty or default
    if (batchEl) {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const prefix = preset.medicine_name.slice(0, 3).toUpperCase();
        batchEl.value = `${prefix}-${randNum}`;
    }

    // Default expiry 2 years from today
    if (expEl) {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 2);
        expEl.value = future.toISOString().slice(0, 10);
    }

    calculateModalMargin();
    showToast(`Loaded preset template for ${preset.medicine_name}`);
}

// 1-Click Fast Set Expiry (+1y, +2y, +3y)
function setQuickExpiry(years) {
    const expEl = document.getElementById('stockExpiryDate');
    if (!expEl) return;
    const future = new Date();
    future.setFullYear(future.getFullYear() + years);
    expEl.value = future.toISOString().slice(0, 10);
    showToast(`Expiry date set to +${years} year(s) from today`);
}

// Calculate Live Profit Margin in Add/Edit Modal
function calculateModalMargin() {
    const cost = parseFloat(document.getElementById('stockPurchasePrice')?.value) || 0;
    const sell = parseFloat(document.getElementById('stockSellingPrice')?.value) || 0;
    const mrp = parseFloat(document.getElementById('stockMrp')?.value) || 0;
    const textEl = document.getElementById('stockModalMarginText');
    if (!textEl) return;

    if (cost > 0 && sell > 0) {
        const profit = sell - cost;
        const marginPct = ((profit / cost) * 100).toFixed(1);
        const discountText = mrp > sell ? ` • ₹${(mrp - sell).toFixed(2)} under MRP` : '';
        textEl.innerHTML = `Profit: <strong>₹${profit.toFixed(2)}</strong> per unit (${marginPct}% markup)${discountText}`;
        textEl.style.color = profit >= 0 ? '#059669' : '#dc2626';
    } else {
        textEl.textContent = 'Counter Profit Margin: Enter Cost & Selling Price to calculate';
        textEl.style.color = '#0284c7';
    }
}

// 1-Click Adjustment Delta Setter (+10, +20, +50, -1, -5, -10)
function setAdjustDelta(delta) {
    const deltaEl = document.getElementById('adjustDelta');
    if (deltaEl) {
        deltaEl.value = delta;
        updateAdjustPreview();
    }
}

// 1-Click Quick Filter from KPI Cards
function quickFilterKpi(status) {
    filterStockByStatus(status);
}

// Quick Stock Adjustment (+ / -) Modal
function openStockAdjustModal(id) {
    const item = allStockItems.find(s => String(s.id) === String(id));
    if (!item) {
        showToast('Medicine stock record not found.');
        return;
    }

    const modal = document.getElementById('stock-adjust-modal');
    const backdrop = document.getElementById('stock-adjust-backdrop');

    const idEl = document.getElementById('adjustStockId');
    const nameEl = document.getElementById('adjustMedName');
    const batchEl = document.getElementById('adjustMedBatch');
    const curQtyEl = document.getElementById('adjustMedCurrentQty');
    const unitEl = document.getElementById('adjustMedUnit');
    const deltaEl = document.getElementById('adjustDelta');
    const reasonEl = document.getElementById('adjustReason');
    const notesEl = document.getElementById('adjustNotes');

    if (idEl) idEl.value = item.id;
    if (nameEl) nameEl.textContent = item.medicine_name || 'Medicine';
    if (batchEl) batchEl.textContent = item.batch_number || '-';
    if (curQtyEl) curQtyEl.textContent = item.quantity || 0;
    if (unitEl) unitEl.textContent = item.unit || 'Units';
    if (deltaEl) deltaEl.value = '10';
    if (reasonEl) reasonEl.value = 'Fresh Inward Supply';
    if (notesEl) notesEl.value = '';

    updateAdjustPreview();

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeStockAdjustModal() {
    const modal = document.getElementById('stock-adjust-modal');
    const backdrop = document.getElementById('stock-adjust-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

function handleAdjustReasonChange() {
    const reasonEl = document.getElementById('adjustReason');
    const deltaEl = document.getElementById('adjustDelta');
    if (!reasonEl || !deltaEl) return;

    const reason = reasonEl.value;
    if (reason === 'Fresh Inward Supply') {
        deltaEl.value = '10';
    } else if (reason === 'Counter Dispensed / Patient Sale') {
        deltaEl.value = '-1';
    } else if (reason === 'Damaged / Broken in Transit') {
        deltaEl.value = '-1';
    } else if (reason === 'Batch Expiry Return') {
        deltaEl.value = '-10';
    } else if (reason === 'Physical Inventory Audit Correction') {
        deltaEl.value = '0';
    }
    updateAdjustPreview();
}

function updateAdjustPreview() {
    const idEl = document.getElementById('adjustStockId');
    const deltaEl = document.getElementById('adjustDelta');
    const displayEl = document.getElementById('adjustResultingDisplay');
    if (!idEl || !deltaEl || !displayEl) return;

    const item = allStockItems.find(s => String(s.id) === String(idEl.value));
    const curQty = item ? Number(item.quantity) || 0 : 0;
    const delta = parseInt(deltaEl.value, 10) || 0;
    const resulting = Math.max(0, curQty + delta);
    const unit = item ? item.unit || 'Units' : 'Units';

    displayEl.textContent = `${resulting} ${unit}`;
    if (resulting === 0) {
        displayEl.style.color = '#dc2626';
        displayEl.style.borderColor = '#fca5a5';
        displayEl.style.background = '#fef2f2';
    } else if (resulting < (item?.min_stock_level || 10)) {
        displayEl.style.color = '#d97706';
        displayEl.style.borderColor = '#fde68a';
        displayEl.style.background = '#fffbeb';
    } else {
        displayEl.style.color = '#059669';
        displayEl.style.borderColor = '#a7f3d0';
        displayEl.style.background = '#ecfdf5';
    }
}

async function handleStockAdjustSubmit(event) {
    if (event) event.preventDefault();

    const idEl = document.getElementById('adjustStockId');
    const deltaEl = document.getElementById('adjustDelta');
    const reasonEl = document.getElementById('adjustReason');
    const notesEl = document.getElementById('adjustNotes');

    if (!idEl || !idEl.value) return;

    const itemId = idEl.value;
    const delta = parseInt(deltaEl?.value, 10) || 0;
    const reason = (reasonEl?.value || 'Stock Adjustment').trim();
    const notes = (notesEl?.value || '').trim();

    const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const saveBtn = document.getElementById('saveAdjustBtn');
    if (saveBtn) saveBtn.disabled = true;

    try {
        await fetch(`/api/stock/${itemId}/adjust`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ delta, reason, notes })
        }).catch(() => null);

        const index = allStockItems.findIndex(s => String(s.id) === String(itemId));
        if (index !== -1) {
            const oldQty = Number(allStockItems[index].quantity) || 0;
            const newQty = Math.max(0, oldQty + delta);
            const actionLabel = delta >= 0 ? `+${delta}` : `${delta}`;
            const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const logNote = `Stock adjusted ${actionLabel} on ${dateStr} [${reason}]${notes ? ': ' + notes : ''}`;

            allStockItems[index].quantity = newQty;
            allStockItems[index].notes = allStockItems[index].notes ? `${allStockItems[index].notes}\n• ${logNote}` : `• ${logNote}`;
            allStockItems[index].updated_at = new Date().toISOString();
        }

        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}

        closeStockAdjustModal();
        renderStockTable();
        updateStockKpiStats();
        showToast(`Stock updated: ${delta >= 0 ? '+' : ''}${delta} units applied.`);
    } catch (err) {
        console.error('Error adjusting stock:', err);
        showToast('Error applying stock adjustment.');
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

// Delete Medicine Stock Modal
function openDeleteStockModal(id) {
    const item = allStockItems.find(s => String(s.id) === String(id));
    if (!item) {
        showToast('Medicine stock item not found.');
        return;
    }

    pendingDeleteStockId = id;
    const modal = document.getElementById('stock-delete-modal');
    const backdrop = document.getElementById('stock-delete-backdrop');
    const previewBox = document.getElementById('stockDeleteTargetPreview');

    if (previewBox) {
        previewBox.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <h4 style="color: #991b1b; font-size: 1.05rem; font-weight: 700; margin: 0 0 4px 0;">${escapeHtml(item.medicine_name || 'Unnamed')}</h4>
                <div style="font-size: 0.82rem; color: #b91c1c; display: flex; gap: 14px; flex-wrap: wrap;">
                    <span><strong>Category:</strong> ${escapeHtml(item.category || 'Tablet')}</span>
                    <span><strong>Batch:</strong> ${escapeHtml(item.batch_number || '-')}</span>
                    <span><strong>Current Stock:</strong> ${item.quantity || 0} ${escapeHtml(item.unit || 'Units')}</span>
                    <span><strong>Shelf:</strong> ${escapeHtml(item.rack_location || '-')}</span>
                </div>
            </div>
        `;
    }

    if (modal) modal.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
}

function closeDeleteStockModal() {
    pendingDeleteStockId = null;
    const modal = document.getElementById('stock-delete-modal');
    const backdrop = document.getElementById('stock-delete-backdrop');
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

async function confirmDeleteStockItem() {
    if (!pendingDeleteStockId) return;

    const itemId = pendingDeleteStockId;
    const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const delBtn = document.getElementById('confirmStockDeleteBtn');
    if (delBtn) delBtn.disabled = true;

    try {
        await fetch(`/api/stock/${itemId}`, {
            method: 'DELETE',
            headers
        }).catch(() => null);

        const targetMed = allStockItems.find(s => String(s.id) === String(itemId));
        allStockItems = allStockItems.filter(s => String(s.id) !== String(itemId));

        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}

        closeDeleteStockModal();
        renderStockTable();
        updateStockKpiStats();
        showToast(`'${targetMed ? targetMed.medicine_name : 'Medicine'}' removed from stock inventory.`);
    } catch (err) {
        console.error('Error deleting stock item:', err);
        showToast('Error deleting medicine stock item.');
    } finally {
        if (delBtn) delBtn.disabled = false;
    }
}

// Search & Filter Handlers
function handleStockSearch() {
    const input = document.getElementById('stockSearchInput');
    const clearBtn = document.getElementById('stockSearchClearBtn');
    if (!input) return;

    stockSearchQuery = input.value;
    if (clearBtn) clearBtn.style.display = stockSearchQuery.length > 0 ? 'block' : 'none';
    renderStockTable();
}

function clearStockSearch() {
    const input = document.getElementById('stockSearchInput');
    const clearBtn = document.getElementById('stockSearchClearBtn');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    stockSearchQuery = '';
    renderStockTable();
}

function filterStockByStatus(status) {
    currentStockStatusFilter = status;

    // Sync filter pills active state
    const container = document.getElementById('stockStatusFilterPills');
    if (container) {
        const pills = container.querySelectorAll('.filter-pill');
        pills.forEach(p => {
            p.classList.remove('active');
            if (p.getAttribute('onclick')?.includes(`'${status}'`)) {
                p.classList.add('active');
            }
        });
    }

    // Sync KPI cards active highlight
    const kpiMap = {
        'All': 'kpiCardAll',
        'in_stock': 'kpiCardAdequate',
        'low_stock': 'kpiCardLow',
        'out_of_stock': 'kpiCardOut',
        'expiring_soon': 'kpiCardExpiring'
    };
    Object.entries(kpiMap).forEach(([st, cardId]) => {
        const card = document.getElementById(cardId);
        if (card) {
            if (st === status) card.classList.add('active');
            else card.classList.remove('active');
        }
    });

    renderStockTable();
}

function filterStockByCategory(category) {
    currentStockCategoryFilter = category;
    renderStockTable();
}

// Export Medicine Stock to CSV
function exportStockCSV() {
    if (!allStockItems || allStockItems.length === 0) {
        showToast('No medicine stock records to export.');
        return;
    }

    const headers = [
        'Medicine Name',
        'Generic Salt Formula',
        'Dosage Category',
        'Manufacturer',
        'Batch Number',
        'Expiry Date',
        'Stock Quantity',
        'Packaging Unit',
        'Min Reorder Alert Level',
        'Purchase Cost (INR)',
        'Printed MRP (INR)',
        'Selling Counter Price (INR)',
        'Shelf Rack Location',
        'Schedule Rx Required',
        'Stock Health Status',
        'Inventory Notes'
    ];

    const rows = allStockItems.map(item => {
        const health = getStockHealthStatus(item);
        return [
            `"${(item.medicine_name || '').replace(/"/g, '""')}"`,
            `"${(item.generic_name || '').replace(/"/g, '""')}"`,
            `"${(item.category || '').replace(/"/g, '""')}"`,
            `"${(item.manufacturer || '').replace(/"/g, '""')}"`,
            `"${(item.batch_number || '').replace(/"/g, '""')}"`,
            `"${item.expiry_date || ''}"`,
            `"${item.quantity || 0}"`,
            `"${(item.unit || '').replace(/"/g, '""')}"`,
            `"${item.min_stock_level || 10}"`,
            `"${item.purchase_price || 0}"`,
            `"${item.mrp || 0}"`,
            `"${item.selling_price || 0}"`,
            `"${(item.rack_location || '').replace(/"/g, '""')}"`,
            `"${item.prescription_required ? 'Yes (Rx Required)' : 'No (OTC)'}"`,
            `"${health}"`,
            `"${(item.notes || '').replace(/"/g, '""')}"`
        ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jankalyan_medicine_stock_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Print Stock Report
function printStockReport() {
    window.print();
}

// Reset sample stock items
async function resetSampleStock() {
    try {
        const token = (typeof adminToken !== 'undefined' ? adminToken : '') || localStorage.getItem('jankalyan_admin_token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch('/api/stock/reset-samples', {
            method: 'POST',
            headers
        }).catch(() => null);

        allStockItems = JSON.parse(JSON.stringify(INITIAL_STOCK_SAMPLE_ITEMS));
        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(allStockItems));
        } catch (e) {}

        renderStockTable();
        updateStockKpiStats();
        showToast('Medicine stock inventory reset to authentic demo catalog.');
    } catch (e) {
        showToast('Reset sample medicine stock completed.');
    }
}

// Expose all stock and customer functions on window for inline HTML onclick/onchange/onsubmit handlers
if (typeof window !== 'undefined') {
    window.setCustomerViewMode = setCustomerViewMode;
    window.handleCustomerSort = handleCustomerSort;
    window.dismissCustomerAlert = dismissCustomerAlert;
    window.applyCustomerPreset = applyCustomerPreset;
    window.addCustomerMedFromStock = addCustomerMedFromStock;
    window.renderCustomerTable = renderCustomerTable;
    window.updateKpiStats = updateKpiStats;
    window.handleCustomerSearch = handleCustomerSearch;
    window.clearCustomerSearch = clearCustomerSearch;
    window.filterByStatus = filterByStatus;
    window.openAddCustomerModal = openAddCustomerModal;
    window.openEditCustomerModal = openEditCustomerModal;
    window.closeCustomerCrudModal = closeCustomerCrudModal;
    window.saveCustomerRecord = saveCustomerRecord;
    window.deleteCustomerRecord = deleteCustomerRecord;
    window.updateCustomerStatus = updateCustomerStatus;
    window.viewBookingDetails = viewBookingDetails;
    window.closeBookingDetailModal = closeBookingDetailModal;
    window.printSingleBookingSlip = printSingleBookingSlip;
    window.printCustomersReport = printCustomersReport;
    window.printCustomerRecords = printCustomersReport;
    window.exportCustomersCSV = exportCustomersCSV;
    window.exportCustomerCSV = exportCustomersCSV;
    window.addCrudMedicineRow = addCrudMedicineRow;
    window.removeCrudMedicineRow = removeCrudMedicineRow;
    window.handleCrudMedTypeChange = handleCrudMedTypeChange;
    window.addPublicMedicineRow = addPublicMedicineRow;
    window.removePublicMedicineRow = removePublicMedicineRow;
    window.handlePublicMedTypeChange = handlePublicMedTypeChange;
    window.loadCustomerRecords = loadCustomerRecords;

    window.loadStockRecords = loadStockRecords;
    window.renderStockUI = renderStockUI;
    window.renderStockTable = renderStockTable;
    window.updateStockKpiStats = updateStockKpiStats;
    window.switchStockViewMode = switchStockViewMode;
    window.setStockViewMode = setStockViewMode;
    window.handleStockSortChange = handleStockSortChange;
    window.handleStockSort = handleStockSort;
    window.quickStepStock = quickStepStock;
    window.renderStockSmartAlert = renderStockSmartAlert;
    window.dismissStockAlert = dismissStockAlert;
    window.filterStockToUrgent = filterStockToUrgent;
    window.quickFilterKpi = quickFilterKpi;
    window.openAddStockModal = openAddStockModal;
    window.openEditStockModal = openEditStockModal;
    window.closeStockModal = closeStockModal;
    window.handleStockFormSubmit = handleStockFormSubmit;
    window.quickFillStockManufacturer = quickFillStockManufacturer;
    window.quickFillPresetMedicine = quickFillPresetMedicine;
    window.setQuickExpiry = setQuickExpiry;
    window.calculateModalMargin = calculateModalMargin;
    window.setAdjustDelta = setAdjustDelta;
    window.openStockAdjustModal = openStockAdjustModal;
    window.closeStockAdjustModal = closeStockAdjustModal;
    window.handleAdjustReasonChange = handleAdjustReasonChange;
    window.updateAdjustPreview = updateAdjustPreview;
    window.handleStockAdjustSubmit = handleStockAdjustSubmit;
    window.openDeleteStockModal = openDeleteStockModal;
    window.closeDeleteStockModal = closeDeleteStockModal;
    window.confirmDeleteStockItem = confirmDeleteStockItem;
    window.handleStockSearch = handleStockSearch;
    window.clearStockSearch = clearStockSearch;
    window.filterStockByStatus = filterStockByStatus;
    window.filterStockByCategory = filterStockByCategory;
    window.exportStockCSV = exportStockCSV;
    window.printStockReport = printStockReport;
    window.resetSampleStock = resetSampleStock;
}

