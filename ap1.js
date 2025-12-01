// ========== CONFIGURATION ==========
// Detect environment and set API URL accordingly
const isLocalFile = window.location.protocol === 'file:';
const API_BASE_URL = isLocalFile 
    ? 'http://localhost:3000/api'
    : `${window.location.protocol}//${window.location.host}/api`;

const TOKEN_KEY = 'chocoblitz_token';
const USER_KEY = 'chocoblitz_user';
const API_TIMEOUT = 15000; // 15 seconds

// ========== AUTHENTICATION FUNCTIONS ==========

/**
 * Switch authentication tabs (Login/Signup)
 */
function switchAuthTab(tab) {
    const loginForm = document.getElementById('authLoginForm');
    const signupForm = document.getElementById('authSignupForm');
    const tabBtns = document.querySelectorAll('.auth-tab-btn');

    // Remove active class from all
    tabBtns.forEach(btn => btn.classList.remove('active'));
    loginForm.classList.remove('active-auth-tab');
    signupForm.classList.remove('active-auth-tab');

    // Add active class to selected tab
    if (tab === 'login') {
        tabBtns[0].classList.add('active');
        loginForm.classList.add('active-auth-tab');
        document.getElementById('loginError').style.display = 'none';
    } else {
        tabBtns[1].classList.add('active');
        signupForm.classList.add('active-auth-tab');
        document.getElementById('signupError').style.display = 'none';
    }
}

/**
 * Handle login form submission
 */
async function handleAuthLogin(event) {
    event.preventDefault();

    const email = document.getElementById('authLoginEmail').value.trim();
    const password = document.getElementById('authLoginPassword').value;
    const rememberMe = document.getElementById('authRememberMe').checked;

    const errorDiv = document.getElementById('loginError');
    const loadingDiv = document.getElementById('loginLoading');

    // Validate input
    if (!email || !password) {
        showError(errorDiv, 'Please fill in all fields');
        return;
    }

    // Show loading state
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user data
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }

        // Show success and load main content
        loadingDiv.style.display = 'none';
        showMainContent();

    } catch (error) {
        loadingDiv.style.display = 'none';
        showError(errorDiv, error.message);
    }
}

/**
 * Handle signup form submission
 */
async function handleAuthSignup(event) {
    event.preventDefault();

    const name = document.getElementById('authSignupName').value.trim();
    const email = document.getElementById('authSignupEmail').value.trim();
    const password = document.getElementById('authSignupPassword').value;
    const confirmPassword = document.getElementById('authSignupConfirm').value;
    const agreeTerms = document.getElementById('authAgreeTerms').checked;

    const errorDiv = document.getElementById('signupError');
    const loadingDiv = document.getElementById('signupLoading');

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
        showError(errorDiv, 'Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        showError(errorDiv, 'Passwords do not match');
        return;
    }

    if (password.length < 8) {
        showError(errorDiv, 'Password must be at least 8 characters');
        return;
    }

    if (!agreeTerms) {
        showError(errorDiv, 'Please agree to Terms & Conditions');
        return;
    }

    // Show loading state
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, confirmPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Store token and user data
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        localStorage.setItem('rememberMe', 'true');

        // Show success and load main content
        loadingDiv.style.display = 'none';
        showMainContent();

    } catch (error) {
        loadingDiv.style.display = 'none';
        showError(errorDiv, error.message);
    }
}

/**
 * Show error message
 */
function showError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return localStorage.getItem(TOKEN_KEY) !== null;
}

/**
 * Get auth token
 */
function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get current user data
 */
function getCurrentUser() {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Show main content and hide auth overlay
 */
function showMainContent() {
    const authOverlay = document.getElementById('authOverlay');
    const mainContent = document.getElementById('mainContent');

    authOverlay.classList.add('hidden');
    mainContent.style.display = 'block';

    // Initialize main content
    setTimeout(() => {
        generateBackground();
        renderGallery();
        updateCartUI();
        checkExistingLogin();
    }, 100);
}

/**
 * Hide main content and show auth overlay (logout)
 */
function hideMainContent() {
    const authOverlay = document.getElementById('authOverlay');
    const mainContent = document.getElementById('mainContent');

    authOverlay.classList.remove('hidden');
    mainContent.style.display = 'none';

    // Clear forms
    document.getElementById('authLoginForm').reset();
    document.getElementById('authSignupForm').reset();
    switchAuthTab('login');
}

/**
 * Logout function
 */
function handleAuthLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');

    hideMainContent();
}

/**
 * Check for existing login on page load
 */
function checkInitialLoginStatus() {
    if (isLoggedIn()) {
        showMainContent();
    }
}

// ========== MAIN CONTENT FUNCTIONS ==========

// Chocolate data
const chocolates = [
    { id: 1, name: 'Dark Elegance', type: 'dark', price: 24.99, image: 'images/dark-elegance.jpg', emoji: '<img src="dark-elegance.jpg" alt="Dark Elegance" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'Rich 85% dark chocolate with hints of cherry' },
    { id: 2, name: 'Milk Dream', type: 'milk', price: 19.99, image: 'images/milk-dream.jpg', emoji: '<img src="milk-dream.jpg" alt="Milk Dream" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'Creamy Belgian milk chocolate perfection' },
    { id: 3, name: 'White Silk', type: 'white', price: 22.99, image: 'images/white-silk.jpg', emoji: '<img src="white-silk.jpg" alt="White Silk" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'Smooth white chocolate with vanilla notes' },
    { id: 4, name: 'Truffle Bliss', type: 'special', price: 34.99, image: 'images/truffle-bliss.jpg', emoji: '<img src="truffle-bliss.jpg" alt="Truffle Bliss" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'Luxurious truffle collection with gold flakes' },
    { id: 5, name: 'Dark Noir', type: 'dark', price: 26.99, image: 'images/dark-noir.jpg', emoji: '<img src="dark-noir.jpg" alt="Dark Noir" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'Intense 90% cacao with sea salt' },
    { id: 6, name: 'Caramel Swirl', type: 'milk', price: 21.99, image: 'images/caramel-swirl.jpg', emoji: '<img src="caramel-swirl.jpg" alt="Caramel Swirl" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'Milk chocolate with caramel ribbons' },
    
    { id: 7, name: 'Noire Elite', type: 'special', price: 89.99, image: 'images/noire elite.jpg', emoji: '<img src="noir elite.jpg" alt="Noir Elite" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'A distinguished chocolate crafted for connoisseurs who crave depth, mystery, and impeccable refinement.' },    
    { id: 8, name: 'Obsidian Bliss', type: 'dark', price: 102.99, image: 'images/obsidian bliss.jpg', emoji: '<img src="obsidian bliss.jpg" alt="Obsidian Bliss" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'An honest, pure expression of fine cacao—uncompromised, authentic, and crafted with artisanal pride.' },
    { id: 9, name: 'Aurum Cocoa', type: 'special', price: 57.99, image: 'images/aurum cocoa.jpg', emoji: '<img src="aurum cocoa.jpg" alt="Aurum Cocoa" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'A dark, velvety indulgence that melts with the richness and allure of polished black stone' },
    { id: 10, name: 'Cocoa Verite', type: 'white', price: 92.99, image: 'images/cocoa verite.jpg', emoji: '<img src="cacao verite.jpg" alt="Cacao Verite" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'A golden-tier experience where rare cacao meets regal elegance in every luxurious bite' },
    { id: 11, name: 'Veloure', type: 'milk', price: 107.99, image: 'images/veloure.jpg', emoji: '<img src="veloure.jpg" alt="Veloure" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'A silk-smooth masterpiece that drapes the palate with soft, indulgent richness.' },
     { id: 11, name: 'Eclipse Royale', type: 'white', price: 79.99, image: 'images/eclipse royale.jpg', emoji: '<img src="eclipse royale.jpg" alt="Eclipse Royale" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'A celestial fusion of rare cacao and majestic elegance, crafted to leave a lingering aura of luxury.' },
     { id: 11, name: 'Marquis d Or', type: 'milk', price: 110.99, image: 'images/marquis d or.jpg', emoji: '<img src="marquis d or.jpg" alt="Marquis d Or" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'A noble chocolate experience inspired by aristocratic refinement, offering a golden touch of decadence in every bite.' },
    { id: 12, name: 'Raspberry White', type: 'white', price: 23.99, image: 'images/raspberry-white.jpg', emoji: '<img src="raspberry-white.jpg" alt="Raspberry White" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'White chocolate infused with raspberry' },
    { id: 13, name: 'Gold Collection', type: 'special', price: 49.99, image: 'images/gold-collection.jpg', emoji: '<img src="gold-collection.jpg" alt="Gold Collection" class="choco-img-el" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />', desc: 'Premium assortment with edible gold' },
];

// Shopping Cart
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Generate chocolate background particles
function generateBackground() {
    const bg = document.getElementById('chocolateBg');
    
    // Create waves
    for (let i = 0; i < 3; i++) {
        const wave = document.createElement('div');
        wave.className = 'choco-wave';
        wave.style.top = `${i * 30}%`;
        wave.style.animationDelay = `${i * 2}s`;
        bg.appendChild(wave);
    }

    // Create particles
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'choco-particle';
        const size = Math.random() * 80 + 20;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        bg.appendChild(particle);
    }
}

// Render gallery
function renderGallery(filter = 'all') {
     const grid = document.getElementById('galleryGrid');
    const filtered = filter === 'all' ? chocolates : chocolates.filter(c => c.type === filter);
    
    grid.innerHTML = filtered.map(choco => `
        <div class="gallery-item" data-type="${choco.type}" onclick="openLightbox(${choco.id})">
            <div class="choco-img">${choco.emoji}</div>
            <h3>${choco.name}</h3>
            <p>${choco.desc}</p>
            <div class="price">${choco.price}</div>
        </div>
    `).join('');
}

// Filter functionality
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderGallery(this.dataset.filter);
    });
});

// Lightbox
function openLightbox(id) {
    const choco = chocolates.find(c => c.id === id);
    const content = `
        <div class="choco-img">${choco.emoji}</div>
        <h2 style="color: #FFB347; margin: 20px 0;">${choco.name}</h2>
        <p style="color: #F4E1D2; font-size: 1.2em; margin-bottom: 20px;">${choco.desc}</p>
        <div class="price" style="font-size: 2em;">$${choco.price.toFixed(2)}</div>
        <button class="cta-button" style="margin-top: 30px;" onclick="addToCart(${choco.id}); closeLightbox();">Add to Cart</button>
    `;
    document.getElementById('lightboxContent').innerHTML = content;
    document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

// Shopping Cart Functions
function addToCart(id) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += 1;
    } else {
        const product = chocolates.find(c => c.id === id);
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            emoji: product.emoji,
            quantity: 1
        });
    }
    saveCart();
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;

    // Update cart items display
    const cartItemsDiv = document.getElementById('cartItems');
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
        document.getElementById('cartItems').innerHTML = '<div class="cart-empty">Your cart is empty</div>';
    } else {
        cartItemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div style="font-size: 2em; margin-right: 15px;">${item.emoji}</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function toggleCart() {
    document.getElementById('cartModal').classList.toggle('active');
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.1;
    alert(`Thank you for your order! Total: $${total.toFixed(2)}\n\nThis is a demo. In a real application, you would proceed to payment.`);
    clearCart();
    toggleCart();
}

// Smooth scroll
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Form submission
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! We\'ll get back to you soon.');
    this.reset();
});

// Review Form Submission
document.getElementById('reviewForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('reviewName').value;
    const location = document.getElementById('reviewLocation').value;
    const rating = document.querySelector('input[name="rating"]:checked').value;
    const text = document.getElementById('reviewText').value;
    
    // Create new review element
    const newReview = document.createElement('div');
    newReview.className = 'review-card';
    newReview.innerHTML = `
        <div class="review-header">
            <div class="reviewer-info">
                <h4>${name}</h4>
                <span class="review-location">${location}</span>
            </div>
            <div class="review-rating">
                ${'★'.repeat(rating)}<span style="color:#ddd;">${'☆'.repeat(5-rating)}</span>
            </div>
        </div>
        <p class="review-text">"${text}"</p>
        <span class="review-date">Posted just now</span>
    `;
    
    // Insert at the beginning of reviews container
    const reviewsContainer = document.querySelector('.reviews-container');
    reviewsContainer.insertBefore(newReview, reviewsContainer.firstChild);
    
    // Reset form
    this.reset();
});

// ========== COMPATIBILITY FUNCTIONS FOR OLD MODALS ==========

function toggleLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    if (!loginForm || !signupForm) return;

    tabBtns.forEach(btn => btn.classList.remove('active'));
    loginForm.classList.remove('active-tab');
    signupForm.classList.remove('active-tab');

    if (tab === 'login') {
        tabBtns[0]?.classList.add('active');
        loginForm.classList.add('active-tab');
    } else {
        tabBtns[1]?.classList.add('active');
        signupForm.classList.add('active-tab');
    }
}

function handleLogin(event) {
    if (event) event.preventDefault();
}

function handleSignup(event) {
    if (event) event.preventDefault();
}

function toggleUserDropdown() {
    // Old function for compatibility
}

function hideUserDropdown() {
    // Old function for compatibility
}

function checkExistingLogin() {
    // Handled by checkInitialLoginStatus now
}

// ========== INITIALIZATION ==========

// Check login status when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkInitialLoginStatus();
    
    // Prevent accessing main content without login
    const authOverlay = document.getElementById('authOverlay');
    const mainContent = document.getElementById('mainContent');
    
    if (mainContent && authOverlay && !isLoggedIn()) {
        mainContent.style.display = 'none';
        authOverlay.classList.remove('hidden');
    }
});