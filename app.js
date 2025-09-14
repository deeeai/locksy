// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCr6BRvqDuiXn4H25ge60fT0gnd4LRHxDg",
    authDomain: "vpsuptime1.firebaseapp.com",
    projectId: "vpsuptime1",
    storageBucket: "vpsuptime1.appspot.com",
    messagingSenderId: "598935646270",
    appId: "1:598935646270:web:506adb2ad012a6ae3e616f",
    measurementId: "G-LSSGG5BVG1",
    databaseURL: "https://vpsuptime1-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Admin credentials
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "1357ac09J@J";

// Global variables
let currentUser = null;
let passwords = [];
let editingPasswordId = null;
let viewingPasswordId = null;
let customFieldCounter = 0;
let totpInterval = null;
let viewTotpInterval = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkAuthState();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Password form
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
    
    // Search bar
    document.getElementById('searchBar').addEventListener('input', handleSearch);
    
    // Floating action button
    document.getElementById('fabButton').addEventListener('click', () => {
        editingPasswordId = null;
        openModal();
    });
    
    // Google Auth Key input listener for TOTP
    document.getElementById('googleAuthKey').addEventListener('input', handleAuthKeyInput);
}

// Check authentication state
function checkAuthState() {
    showLoading();
    auth.onAuthStateChanged((user) => {
        hideLoading();
        if (user) {
            currentUser = user;
            showDashboard();
            loadPasswords();
        } else {
            showLoginPage();
        }
    });
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    // Check if credentials match admin credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        errorDiv.textContent = 'Invalid email or password';
        errorDiv.classList.add('show');
        return;
    }
    
    showLoading();
    
    try {
        // Try to sign in with Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);
        errorDiv.classList.remove('show');
    } catch (error) {
        // If user doesn't exist, create it
        if (error.code === 'auth/user-not-found') {
            try {
                await auth.createUserWithEmailAndPassword(email, password);
                errorDiv.classList.remove('show');
            } catch (createError) {
                errorDiv.textContent = 'Authentication error: ' + createError.message;
                errorDiv.classList.add('show');
            }
        } else {
            errorDiv.textContent = 'Authentication error: ' + error.message;
            errorDiv.classList.add('show');
        }
    } finally {
        hideLoading();
    }
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');
}

// Show login page
function showLoginPage() {
    document.getElementById('dashboardPage').classList.remove('active');
    document.getElementById('loginPage').classList.add('active');
}

// Load passwords from Firebase
async function loadPasswords() {
    showLoading();
    
    try {
        const snapshot = await database.ref('passwords').once('value');
        const data = snapshot.val() || {};
        
        passwords = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
        
        renderPasswords(passwords);
    } catch (error) {
        console.error('Error loading passwords:', error);
    } finally {
        hideLoading();
    }
}

// Render password cards
function renderPasswords(passwordList) {
    const grid = document.getElementById('passwordGrid');
    
    if (passwordList.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <h3>No passwords yet</h3>
                <p>Click the + button to add your first password</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = passwordList.map(password => `
        <div class="password-card ${password.googleAuthKey ? 'has-2fa' : ''}" data-id="${password.id}">
            <div class="card-header">
                <div class="card-icon">
                    <i class="fas ${getIconForPassword(password)}"></i>
                </div>
                <div class="card-actions">
                    <button class="card-btn" onclick="viewPassword('${password.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="card-btn" onclick="editPassword('${password.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-btn delete" onclick="deletePassword('${password.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-title">${password.name || 'Untitled'}</div>
            <div class="card-subtitle">${password.websiteUrl || 'No website'}</div>
            <div class="card-info">
                ${password.userName ? `
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <span>${password.userName}</span>
                    </div>
                ` : ''}
                ${password.gmail ? `
                    <div class="info-item">
                        <i class="fas fa-envelope"></i>
                        <span>${password.gmail}</span>
                    </div>
                ` : ''}
                ${password.twoFALink ? `
                    <div class="info-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>2FA Enabled</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Get icon for password based on content
function getIconForPassword(password) {
    const name = (password.name || '').toLowerCase();
    const url = (password.websiteUrl || '').toLowerCase();
    
    if (name.includes('google') || url.includes('google')) return 'fa-google';
    if (name.includes('facebook') || url.includes('facebook')) return 'fa-facebook';
    if (name.includes('twitter') || url.includes('twitter')) return 'fa-twitter';
    if (name.includes('github') || url.includes('github')) return 'fa-github';
    if (name.includes('linkedin') || url.includes('linkedin')) return 'fa-linkedin';
    if (name.includes('instagram') || url.includes('instagram')) return 'fa-instagram';
    if (name.includes('email') || name.includes('mail')) return 'fa-envelope';
    if (name.includes('bank') || name.includes('finance')) return 'fa-university';
    if (name.includes('shopping') || name.includes('amazon')) return 'fa-shopping-cart';
    
    return 'fa-key';
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        renderPasswords(passwords);
        return;
    }
    
    const filtered = passwords.filter(password => {
        const searchableContent = [
            password.name,
            password.websiteUrl,
            password.userName,
            password.gmail,
            password.notes
        ].join(' ').toLowerCase();
        
        return searchableContent.includes(searchTerm);
    });
    
    renderPasswords(filtered);
}

// Open modal for adding/editing password
function openModal() {
    const modal = document.getElementById('passwordModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('passwordForm');
    
    // Reset form
    form.reset();
    document.getElementById('customFields').innerHTML = '';
    customFieldCounter = 0;
    
    // Clear TOTP display
    clearTotpDisplay();
    
    if (editingPasswordId) {
        modalTitle.textContent = 'Edit Password';
        const password = passwords.find(p => p.id === editingPasswordId);
        if (password) {
            populateForm(password);
        }
    } else {
        modalTitle.textContent = 'Add New Password';
    }
    
    modal.classList.add('show');
}

// Populate form with password data
function populateForm(password) {
    document.getElementById('entryName').value = password.name || '';
    document.getElementById('websiteUrl').value = password.websiteUrl || '';
    document.getElementById('userName').value = password.userName || '';
    document.getElementById('gmail').value = password.gmail || '';
    document.getElementById('entryPassword').value = password.password || '';
    document.getElementById('googleAuthKey').value = password.googleAuthKey || '';
    document.getElementById('recoveryEmail').value = password.recoveryEmail || '';
    document.getElementById('twoFALink').value = password.twoFALink || '';
    document.getElementById('notes').value = password.notes || '';
    
    // Start TOTP if auth key exists
    if (password.googleAuthKey) {
        startTotpGeneration(password.googleAuthKey);
    }
    
    // Add custom fields
    if (password.customFields) {
        password.customFields.forEach(field => {
            addCustomField(field.label, field.value);
        });
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('passwordModal');
    modal.classList.remove('show');
    editingPasswordId = null;
    clearTotpDisplay();
}

// Handle password form submission
async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const passwordData = {
        name: document.getElementById('entryName').value,
        websiteUrl: document.getElementById('websiteUrl').value,
        userName: document.getElementById('userName').value,
        gmail: document.getElementById('gmail').value,
        password: document.getElementById('entryPassword').value,
        googleAuthKey: document.getElementById('googleAuthKey').value,
        recoveryEmail: document.getElementById('recoveryEmail').value,
        twoFALink: document.getElementById('twoFALink').value,
        notes: document.getElementById('notes').value,
        customFields: getCustomFields(),
        updatedAt: Date.now()
    };
    
    showLoading();
    
    try {
        if (editingPasswordId) {
            // Update existing password
            await database.ref(`passwords/${editingPasswordId}`).update(passwordData);
        } else {
            // Add new password
            passwordData.createdAt = Date.now();
            await database.ref('passwords').push(passwordData);
        }
        
        await loadPasswords();
        closeModal();
    } catch (error) {
        console.error('Error saving password:', error);
        alert('Error saving password. Please try again.');
    } finally {
        hideLoading();
    }
}

// Get custom fields from form
function getCustomFields() {
    const customFields = [];
    const container = document.getElementById('customFields');
    const fieldElements = container.querySelectorAll('.custom-field');
    
    fieldElements.forEach(field => {
        const label = field.querySelector('.custom-label').value;
        const value = field.querySelector('.custom-value').value;
        if (label || value) {
            customFields.push({ label, value });
        }
    });
    
    return customFields;
}

// Add custom field
function addCustomField(label = '', value = '') {
    const container = document.getElementById('customFields');
    const fieldId = `custom-field-${customFieldCounter++}`;
    
    const fieldHtml = `
        <div class="custom-field" id="${fieldId}">
            <div class="form-group">
                <label>Field Name</label>
                <input type="text" class="custom-label" placeholder="Custom field name" value="${label}">
            </div>
            <div class="form-group">
                <label>Field Value</label>
                <input type="text" class="custom-value" placeholder="Custom field value" value="${value}">
            </div>
            <button type="button" class="remove-field-btn" onclick="removeCustomField('${fieldId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', fieldHtml);
}

// Remove custom field
function removeCustomField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.remove();
    }
}

// View password details
function viewPassword(passwordId) {
    const password = passwords.find(p => p.id === passwordId);
    if (!password) return;
    
    viewingPasswordId = passwordId;
    const modal = document.getElementById('viewModal');
    const content = document.getElementById('viewModalContent');
    
    content.innerHTML = `
        ${password.name ? `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-tag"></i>
                    Name
                </div>
                <div class="view-item-value">
                    ${password.name}
                </div>
            </div>
        ` : ''}
        
        ${password.websiteUrl ? `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-globe"></i>
                    Website
                </div>
                <div class="view-item-value">
                    <a href="${password.websiteUrl}" target="_blank">${password.websiteUrl}</a>
                </div>
            </div>
        ` : ''}
        
        ${password.userName ? `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-user"></i>
                    Username
                </div>
                <div class="view-item-value">
                    ${password.userName}
                    <button class="copy-btn" onclick="copyToClipboard('${password.userName}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            </div>
        ` : ''}
        
        ${password.gmail ? `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-envelope"></i>
                    Email
                </div>
                <div class="view-item-value">
                    ${password.gmail}
                    <button class="copy-btn" onclick="copyToClipboard('${password.gmail}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            </div>
        ` : ''}
        
        ${password.password ? `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-key"></i>
                    Password
                </div>
                <div class="view-item-value">
                    <span id="passwordDisplay">••••••••</span>
                    <button class="copy-btn" onclick="copyToClipboard('${password.password}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="copy-btn" onclick="togglePasswordView('${password.password}')">
                        <i class="fas fa-eye"></i> Show
                    </button>
                </div>
            </div>
        ` : ''}
        
        ${password.googleAuthKey ? `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-shield-alt"></i>
                    Google Auth Key
                </div>
                <div class="view-item-value">
                    <span style="font-family: monospace; font-size: 0.9rem;">${password.googleAuthKey.substring(0, 4)}...${password.googleAuthKey.substring(password.googleAuthKey.length - 4)}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${password.googleAuthKey}')">
                        <i class="fas fa-copy"></i> Copy Key
                    </button>
                </div>
            </div>
            <div class="totp-view-container" id="viewTotpContainer">
                <i class="fas fa-key" style="color: white; font-size: 1.2rem;"></i>
                <span id="viewTotpCode" class="totp-view-code">------</span>
                <button class="copy-btn" style="background: rgba(255,255,255,0.2); border: none; color: white;" onclick="copyToClipboard(document.getElementById('viewTotpCode').textContent)">
                    <i class="fas fa-copy"></i> Copy Code
                </button>
                <div class="totp-view-timer">
                    <svg width="30" height="30">
                        <circle cx="15" cy="15" r="12" stroke="rgba(255,255,255,0.3)" stroke-width="2" fill="none"></circle>
                        <circle id="viewTimerProgress" cx="15" cy="15" r="12" stroke="white" stroke-width="2" fill="none"
                                stroke-dasharray="75.4" stroke-dashoffset="75.4"
                                transform="rotate(-90 15 15)" style="transition: stroke-dashoffset 1s linear;"></circle>
                    </svg>
                </div>
            </div>
        ` : ''}
        
        ${password.recoveryEmail ? `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-life-ring"></i>
                    Recovery Email
                </div>
                <div class="view-item-value">
                    ${password.recoveryEmail}
                    <button class="copy-btn" onclick="copyToClipboard('${password.recoveryEmail}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            </div>
        ` : ''}
        
        ${password.twoFALink ? `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-link"></i>
                    2FA Link
                </div>
                <div class="view-item-value">
                    <a href="${password.twoFALink}" target="_blank">${password.twoFALink}</a>
                </div>
            </div>
        ` : ''}
        
        ${password.notes ? `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-sticky-note"></i>
                    Notes
                </div>
                <div class="view-item-value">
                    ${password.notes}
                </div>
            </div>
        ` : ''}
        
        ${password.customFields && password.customFields.length > 0 ? password.customFields.map(field => `
            <div class="view-item">
                <div class="view-item-label">
                    <i class="fas fa-tag"></i>
                    ${field.label}
                </div>
                <div class="view-item-value">
                    ${field.value}
                    <button class="copy-btn" onclick="copyToClipboard('${field.value}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            </div>
        `).join('') : ''}
    `;
    
    // Start TOTP generation for view modal if auth key exists
    if (password.googleAuthKey) {
        startViewTotpGeneration(password.googleAuthKey);
    }
    
    modal.classList.add('show');
}

// Close view modal
function closeViewModal() {
    const modal = document.getElementById('viewModal');
    modal.classList.remove('show');
    viewingPasswordId = null;
    clearViewTotpDisplay();
}

// Edit from view modal
function editFromView() {
    closeViewModal();
    editPassword(viewingPasswordId);
}

// Edit password
function editPassword(passwordId) {
    editingPasswordId = passwordId;
    openModal();
}

// Delete password
async function deletePassword(passwordId) {
    if (!confirm('Are you sure you want to delete this password?')) {
        return;
    }
    
    showLoading();
    
    try {
        await database.ref(`passwords/${passwordId}`).remove();
        await loadPasswords();
    } catch (error) {
        console.error('Error deleting password:', error);
        alert('Error deleting password. Please try again.');
    } finally {
        hideLoading();
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Toggle password view in modal
let passwordVisible = false;
function togglePasswordView(password) {
    const display = document.getElementById('passwordDisplay');
    const button = event.target.closest('button');
    const icon = button.querySelector('i');
    
    if (passwordVisible) {
        display.textContent = '••••••••';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        button.innerHTML = '<i class="fas fa-eye"></i> Show';
        passwordVisible = false;
    } else {
        display.textContent = password;
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        button.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
        passwordVisible = true;
    }
}

// Generate random password
function generatePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    document.getElementById('entryPassword').value = password;
    
    // Show password after generating
    const input = document.getElementById('entryPassword');
    input.type = 'text';
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Show feedback
        const button = event.target.closest('button');
        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.style.color = 'var(--success-color)';
        
        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.style.color = '';
        }, 2000);
    } catch (error) {
        console.error('Error copying to clipboard:', error);
    }
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

// Toggle filter (placeholder for future functionality)
function toggleFilter() {
    alert('Filter functionality coming soon!');
}

// Logout
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showLoading();
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error logging out:', error);
        } finally {
            hideLoading();
        }
    }
}

// Show loading spinner
function showLoading() {
    document.getElementById('loadingSpinner').classList.add('show');
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('show');
}

// TOTP Functions
function handleAuthKeyInput(e) {
    const authKey = e.target.value.trim();
    if (authKey && isValidBase32(authKey)) {
        startTotpGeneration(authKey);
    } else {
        clearTotpDisplay();
    }
}

function isValidBase32(str) {
    // Basic base32 validation
    const base32Regex = /^[A-Z2-7]+=*$/i;
    return base32Regex.test(str) && str.length >= 16;
}

function startTotpGeneration(secret) {
    clearTotpDisplay();
    
    try {
        // Create TOTP instance
        const totp = new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(secret.toUpperCase().replace(/\s/g, '')),
            algorithm: 'SHA1',
            digits: 6,
            period: 30
        });
        
        // Show TOTP display
        const display = document.getElementById('totpDisplay');
        if (display) {
            display.classList.add('active');
        }
        
        // Update TOTP immediately
        updateTotp(totp);
        
        // Update every second
        totpInterval = setInterval(() => updateTotp(totp), 1000);
    } catch (error) {
        console.error('Invalid TOTP secret:', error);
        clearTotpDisplay();
    }
}

function updateTotp(totp) {
    const code = totp.generate();
    const totpCode = document.getElementById('totpCode');
    if (totpCode) {
        totpCode.textContent = formatTotpCode(code);
    }
    
    // Update timer
    const secondsRemaining = 30 - (Math.floor(Date.now() / 1000) % 30);
    const progress = document.getElementById('timerProgress');
    if (progress) {
        const offset = (62.83 * (30 - secondsRemaining)) / 30;
        progress.style.strokeDashoffset = offset;
    }
}

function formatTotpCode(code) {
    // Format as XXX XXX
    return code.toString().padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1 $2');
}

function clearTotpDisplay() {
    if (totpInterval) {
        clearInterval(totpInterval);
        totpInterval = null;
    }
    
    const display = document.getElementById('totpDisplay');
    if (display) {
        display.classList.remove('active');
    }
    
    const totpCode = document.getElementById('totpCode');
    if (totpCode) {
        totpCode.textContent = '------';
    }
    
    const progress = document.getElementById('timerProgress');
    if (progress) {
        progress.style.strokeDashoffset = '62.83';
    }
}

function startViewTotpGeneration(secret) {
    clearViewTotpDisplay();
    
    try {
        // Create TOTP instance
        const totp = new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(secret.toUpperCase().replace(/\s/g, '')),
            algorithm: 'SHA1',
            digits: 6,
            period: 30
        });
        
        // Update TOTP immediately
        updateViewTotp(totp);
        
        // Update every second
        viewTotpInterval = setInterval(() => updateViewTotp(totp), 1000);
    } catch (error) {
        console.error('Invalid TOTP secret:', error);
    }
}

function updateViewTotp(totp) {
    const code = totp.generate();
    const viewTotpCode = document.getElementById('viewTotpCode');
    if (viewTotpCode) {
        viewTotpCode.textContent = formatTotpCode(code);
    }
    
    // Update timer
    const secondsRemaining = 30 - (Math.floor(Date.now() / 1000) % 30);
    const progress = document.getElementById('viewTimerProgress');
    if (progress) {
        const offset = (75.4 * (30 - secondsRemaining)) / 30;
        progress.style.strokeDashoffset = offset;
    }
}

function clearViewTotpDisplay() {
    if (viewTotpInterval) {
        clearInterval(viewTotpInterval);
        viewTotpInterval = null;
    }
}

// Load theme on page load
loadTheme();
