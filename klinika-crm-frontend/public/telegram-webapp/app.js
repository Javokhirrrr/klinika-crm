// Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();

// Expand to full height
tg.expand();

// Set theme
tg.setHeaderColor('#ffffff');
tg.setBackgroundColor('#f5f5f5');

// Global state
let currentPage = 'dashboard';
let patient = null;
let authToken = null;

// API Base URL
const API_URL = window.location.origin.replace(':5173', ':5000');

// Initialize app
async function init() {
    try {
        // Authenticate with backend
        await authenticate();

        // Load patient data
        await loadPatientData();

        // Setup navigation
        setupNavigation();

        // Load dashboard
        loadPage('dashboard');

        // Hide loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
    } catch (error) {
        console.error('Init error:', error);
        showError('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
}

// Authenticate with backend
async function authenticate() {
    const initData = tg.initData;

    if (!initData) {
        throw new Error('No init data');
    }

    const response = await fetch(`${API_URL}/api/telegram/webapp/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
    });

    if (!response.ok) {
        throw new Error('Authentication failed');
    }

    const data = await response.json();
    authToken = data.token;
    patient = data.patient;
}

// Load patient data
async function loadPatientData() {
    // Patient data already loaded in authenticate
    console.log('Patient:', patient);
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            loadPage(page);

            // Update active state
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        loadPage('dashboard');
    });
}

// Load page
function loadPage(page) {
    currentPage = page;
    const content = document.getElementById('content');
    const pageTitle = document.getElementById('pageTitle');
    const backBtn = document.getElementById('backBtn');

    // Show/hide back button
    backBtn.style.display = page === 'dashboard' ? 'none' : 'block';

    // Load page content
    switch (page) {
        case 'dashboard':
            pageTitle.textContent = 'Klinika CRM';
            content.innerHTML = renderDashboard();
            break;
        case 'queue':
            pageTitle.textContent = 'Navbatim';
            content.innerHTML = renderQueue();
            loadQueueData();
            break;
        case 'payments':
            pageTitle.textContent = 'To\'lovlar';
            content.innerHTML = renderPayments();
            loadPaymentsData();
            break;
        case 'history':
            pageTitle.textContent = 'Kasallik tarixi';
            content.innerHTML = renderHistory();
            loadHistoryData();
            break;
        case 'settings':
            pageTitle.textContent = 'Sozlamalar';
            content.innerHTML = renderSettings();
            break;
    }
}

// Render Dashboard
function renderDashboard() {
    return `
        <div class="card">
            <h2 style="margin-bottom: 8px;">Salom, ${patient.firstName}!</h2>
            <p style="color: var(--tg-theme-hint-color); font-size: 14px;">
                Klinika CRM'ga xush kelibsiz
            </p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="queueCount">-</div>
                <div class="stat-label">Navbatda</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <div class="stat-value" id="appointmentCount">-</div>
                <div class="stat-label">Qabullar</div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-title">Tezkor havolalar</div>
            <div class="list-item" onclick="loadPage('queue')">
                <span class="list-icon">🎫</span>
                <div class="list-content">
                    <div class="list-title">Navbatim</div>
                    <div class="list-subtitle">Navbat holatini ko'rish</div>
                </div>
                <span class="list-arrow">›</span>
            </div>
            <div class="list-item" onclick="loadPage('payments')">
                <span class="list-icon">💳</span>
                <div class="list-content">
                    <div class="list-title">To'lovlar</div>
                    <div class="list-subtitle">To'lovlar tarixi</div>
                </div>
                <span class="list-arrow">›</span>
            </div>
            <div class="list-item" onclick="loadPage('history')">
                <span class="list-icon">📋</span>
                <div class="list-content">
                    <div class="list-title">Kasallik tarixi</div>
                    <div class="list-subtitle">Tibbiy ma'lumotlar</div>
                </div>
                <span class="list-arrow">›</span>
            </div>
        </div>
    `;
}

// Render Queue
function renderQueue() {
    return `
        <div id="queueContent">
            <div class="loading">
                <div class="spinner"></div>
                <p>Yuklanmoqda...</p>
            </div>
        </div>
    `;
}

// Load Queue Data
async function loadQueueData() {
    try {
        const response = await fetch(`${API_URL}/api/queue/my-queue`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        const queueContent = document.getElementById('queueContent');

        if (data.queue) {
            queueContent.innerHTML = `
                <div class="queue-status">
                    <div class="queue-number">№${data.queue.queueNumber}</div>
                    <div class="queue-info">Sizning navbatingiz</div>
                    <div class="queue-info" style="margin-top: 12px;">
                        👨‍⚕️ ${data.doctor.name}<br>
                        ⏰ Taxminiy: ${data.estimatedTime}<br>
                        ⏳ Kutish: ~${data.waitTime} daqiqa
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Ma'lumot</div>
                    <p style="font-size: 14px; color: var(--tg-theme-hint-color);">
                        Navbatingiz yaqinlashganda sizga xabar beramiz.
                    </p>
                </div>
            `;
        } else {
            queueContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎫</div>
                    <div class="empty-title">Navbatda yo'qsiz</div>
                    <div class="empty-text">
                        Qabul uchun klinikaga murojaat qiling
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load queue error:', error);
        document.getElementById('queueContent').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <div class="empty-title">Xatolik</div>
                <div class="empty-text">Ma'lumotlarni yuklashda xatolik</div>
            </div>
        `;
    }
}

// Render Payments
function renderPayments() {
    return `
        <div id="paymentsContent">
            <div class="loading">
                <div class="spinner"></div>
                <p>Yuklanmoqda...</p>
            </div>
        </div>
    `;
}

// Load Payments Data
async function loadPaymentsData() {
    try {
        const response = await fetch(`${API_URL}/api/payments/my-payments`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        const paymentsContent = document.getElementById('paymentsContent');

        if (data.payments && data.payments.length > 0) {
            const paymentsHTML = data.payments.map(payment => `
                <div class="list-item">
                    <span class="list-icon">💳</span>
                    <div class="list-content">
                        <div class="list-title">${payment.amount.toLocaleString()} so'm</div>
                        <div class="list-subtitle">
                            ${new Date(payment.date).toLocaleDateString('uz-UZ')} • ${payment.service}
                        </div>
                    </div>
                    <span class="badge badge-success">To'landi</span>
                </div>
            `).join('');

            paymentsContent.innerHTML = `
                <div class="card">
                    <div class="card-title">To'lovlar tarixi</div>
                    ${paymentsHTML}
                </div>
            `;
        } else {
            paymentsContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💳</div>
                    <div class="empty-title">To'lovlar yo'q</div>
                    <div class="empty-text">Hali to'lovlar amalga oshirilmagan</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load payments error:', error);
        document.getElementById('paymentsContent').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <div class="empty-title">Xatolik</div>
            </div>
        `;
    }
}

// Render History
function renderHistory() {
    return `
        <div id="historyContent">
            <div class="loading">
                <div class="spinner"></div>
                <p>Yuklanmoqda...</p>
            </div>
        </div>
    `;
}

// Load History Data
async function loadHistoryData() {
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div class="empty-title">Kasallik tarixi</div>
            <div class="empty-text">Tez orada mavjud bo'ladi</div>
        </div>
    `;
}

// Render Settings
function renderSettings() {
    return `
        <div class="card">
            <div class="card-title">Shaxsiy ma'lumotlar</div>
            <div class="list-item">
                <span class="list-icon">👤</span>
                <div class="list-content">
                    <div class="list-title">${patient.firstName} ${patient.lastName || ''}</div>
                    <div class="list-subtitle">Ism</div>
                </div>
            </div>
            <div class="list-item">
                <span class="list-icon">📱</span>
                <div class="list-content">
                    <div class="list-title">${patient.phone}</div>
                    <div class="list-subtitle">Telefon</div>
                </div>
            </div>
            ${patient.email ? `
                <div class="list-item">
                    <span class="list-icon">📧</span>
                    <div class="list-content">
                        <div class="list-title">${patient.email}</div>
                        <div class="list-subtitle">Email</div>
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="card">
            <div class="card-title">Ilova haqida</div>
            <p style="font-size: 14px; color: var(--tg-theme-hint-color);">
                Klinika CRM - Telegram Web App<br>
                Versiya: 1.0.0
            </p>
        </div>
    `;
}

// Show error
function showError(message) {
    tg.showAlert(message);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
