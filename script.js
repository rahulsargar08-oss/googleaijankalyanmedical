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

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                history: chatConversationHistory.slice(-8) // Send up to last 8 turns
            })
        });

        const typingEl = document.getElementById(typingIndicatorId);
        if (typingEl) typingEl.remove();

        const data = await response.json();

        let botReply = '';
        if (data && data.reply) {
            botReply = data.reply;
        } else if (data && data.error) {
            botReply = data.error;
        } else {
            botReply = "Namaste! Jankalyan Medical is open 24x7 near Wadhegaon Naka, Sangola. For immediate assistance or home delivery, please call +91 86691 18742.";
        }

        // Store to memory history
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

    } catch (err) {
        console.error('Chat error:', err);
        const typingEl = document.getElementById(typingIndicatorId);
        if (typingEl) typingEl.remove();

        const errorHtml = `
            <div class="chat-msg bot">
                <div class="msg-avatar"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="msg-content">
                    <p><strong>Jankalyan Medical Assistant:</strong></p>
                    <p>For urgent medicine delivery or inquiry in Sangola, please contact <strong>Mr. Siddhu Hazare</strong> directly at <strong>+91 86691 18742</strong> (Open 24×7).</p>
                </div>
            </div>
        `;
        chatBody.insertAdjacentHTML('beforeend', errorHtml);
        chatBody.scrollTop = chatBody.scrollHeight;
    } finally {
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
