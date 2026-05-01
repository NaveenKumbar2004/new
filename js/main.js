// Theme Toggle Logic
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else if (systemPrefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    }
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
};

const updateThemeIcon = (theme) => {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
};

// Password Toggle Logic
const initPasswordToggles = () => {
    const toggles = document.querySelectorAll('.password-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const input = e.target.closest('.form-group').querySelector('input');
            const icon = e.target;
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
};

// Toast Notifications
const showToast = (message, type = 'success') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const color = type === 'success' ? 'var(--success)' : 'var(--danger)';
    
    toast.style.borderLeftColor = color;
    toast.innerHTML = `
        <i class="fas ${iconClass}" style="color: ${color}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// --- Local Storage Database Simulation ---
const DB_KEYS = {
    SLOTS: 'parking_slots',
    FEE: 'parking_fee',
    BOOKINGS: 'parking_bookings'
};

const initDB = () => {
    // Init default fee if not present
    if (!localStorage.getItem(DB_KEYS.FEE)) {
        localStorage.setItem(DB_KEYS.FEE, '5.00');
    }
};

const getDB = (key) => JSON.parse(localStorage.getItem(key));
const setDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const getFee = () => parseFloat(localStorage.getItem(DB_KEYS.FEE)) || 5.0;
const setFee = (fee) => localStorage.setItem(DB_KEYS.FEE, fee.toString());

// --- Backend Sync Functions ---
const getAPI_BASE = () => {
    // If we're on localhost, use the local backend port 3000
    // If we're deployed, use the current origin
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:3000/api' : window.location.origin + '/api';
};

const fetchSettingsFromServer = async () => {
    const base = getAPI_BASE();
    try {
        const res = await fetch(`${base}/settings`);
        const result = await res.json();
        if (result.status === 'success' && result.data.parking_fee) {
            setFee(result.data.parking_fee);
            return result.data.parking_fee;
        }
    } catch (e) { console.error("Sync error:", e); }
    return getFee();
};

const updateFeeOnServer = async (fee) => {
    const base = getAPI_BASE();
    try {
        const res = await fetch(`${base}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parking_fee: fee })
        });
        const result = await res.json();
        if (result.status === 'success') {
            setFee(fee);
            return true;
        }
    } catch (e) { console.error("Update error:", e); }
    return false;
};



// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initPasswordToggles();
    initDB();
    
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
});

// Add slideOut animation to head
const style = document.createElement('style');
style.innerHTML = `
@keyframes slideOut {
    to { transform: translateX(120%); opacity: 0; }
}
`;
document.head.appendChild(style);
