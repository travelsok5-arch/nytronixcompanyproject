// Authentication and session management with PERSISTENT session control
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionToken = localStorage.getItem('session_token');
        this.sessionExpires = localStorage.getItem('session_expires');
        this.init();
    }

    init() {
        console.log('🔐 Auth Manager Initialized');
        this.setupAuthListeners();
        this.checkAuthState();
        this.setupSessionMaintenance();
    }

    setupSessionMaintenance() {
        // Maintain session on tab close/refresh - REMOVED auto logout
        window.addEventListener('beforeunload', () => {
            this.maintainSession();
        });

        // Handle page visibility changes - MAINTAIN session
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // User returned to tab - validate session
                this.validateCurrentSession();
            }
        });

        // Periodic session validation (every 5 minutes)
        setInterval(() => {
            this.validateCurrentSession();
        }, 5 * 60 * 1000);
    }

    async maintainSession() {
        // Only maintain session if we have a valid token
        if (this.sessionToken && this.currentUser) {
            console.log('💾 Maintaining session for next visit...');
            // Session will be maintained via localStorage
        }
    }

    async validateCurrentSession() {
        if (!this.sessionToken || !this.currentUser) return;
        
        try {
            const response = await fetch('/api/validate-session', {
                headers: this.getAuthHeaders()
            });
            
            const result = await response.json();
            
            if (!result.success || !result.valid) {
                console.log('❌ Session validation failed');
                this.handleSessionExpiry();
            } else {
                console.log('✅ Session validated successfully');
            }
        } catch (error) {
            console.log('⚠️ Session validation error (may be offline):', error);
            // Don't logout on network errors - maintain session
        }
    }

    handleSessionExpiry() {
        this.showNotification('Session expired. Please login again.', 'error');
        this.clearUser();
        this.showLoginScreen();
    }

    setupAuthListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('✅ Login form listener added');
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
            console.log('✅ Logout button listener added');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('🔐 Login process started...');
        
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log('Login attempt with:', email);

        // Basic validation
        if (!email || !password) {
            this.showNotification('Please enter both email and password', 'error');
            return;
        }

        try {
            const submitBtn = document.querySelector('#login-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';
                submitBtn.disabled = true;
            }

            // Hide previous errors
            const errorDiv = document.getElementById('login-error');
            if (errorDiv) {
                errorDiv.classList.add('hidden');
            }

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                'session-token': this.sessionToken || ''
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            console.log('Login API response:', result);

            if (result.success) {
                this.setUser(result.user, result.sessionToken, result.sessionExpires);
                this.showNotification('Login successful!', 'success');
                
                // Show admin dashboard and hide login
                this.showAdminPanel();
                
            } else {
                this.showNotification(result.message || 'Login failed', 'error');
                if (errorDiv) {
                    errorDiv.textContent = result.message || 'Invalid credentials';
                    errorDiv.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            const submitBtn = document.querySelector('#login-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = 'Login';
                submitBtn.disabled = false;
            }
        }
    }

    async handleLogout() {
        console.log('🔐 Logging out...');
        await this.forceLogout();
        this.showNotification('Logged out successfully.', 'success');
        this.showLoginScreen();
        this.clearLoginForm();
    }

    async forceLogout() {
        if (this.sessionToken) {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'session-token': this.sessionToken
                    }
                });
            } catch (error) {
                console.log('Logout API call failed (may be offline)');
            }
            
            // Always clear local storage
            this.clearUser();
        }
    }

    clearLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    setUser(user, sessionToken, sessionExpires) {
        this.currentUser = user;
        this.sessionToken = sessionToken;
        this.sessionExpires = sessionExpires;
        
        localStorage.setItem('session_token', sessionToken);
        localStorage.setItem('session_expires', sessionExpires);
        localStorage.setItem('user_data', JSON.stringify(user));
        
        console.log('✅ User set in auth:', user.email);
        console.log('✅ Session token stored:', sessionToken);
    }

    clearUser() {
        this.currentUser = null;
        this.sessionToken = null;
        this.sessionExpires = null;
        
        localStorage.removeItem('session_token');
        localStorage.removeItem('session_expires');
        localStorage.removeItem('user_data');
        
        console.log('✅ User cleared from auth');
    }

    async checkAuthState() {
        const storedToken = localStorage.getItem('session_token');
        const storedExpires = localStorage.getItem('session_expires');
        const storedUser = localStorage.getItem('user_data');
        
        if (storedToken && storedExpires && storedUser) {
            try {
                // Check if session is expired
                const now = new Date();
                const expires = new Date(storedExpires);
                
                if (now > expires) {
                    console.log('❌ Session expired');
                    this.clearUser();
                    this.showLoginScreen();
                    return;
                }

                // Validate session with server
                const response = await fetch('/api/validate-session', {
                    headers: {
                        'session-token': storedToken
                    }
                });

                const result = await response.json();
                
                if (result.success && result.valid) {
                    this.currentUser = JSON.parse(storedUser);
                    this.sessionToken = storedToken;
                    this.sessionExpires = storedExpires;
                    
                    console.log('✅ Valid session found for user:', this.currentUser.email);
                    this.showAdminPanel();
                } else {
                    console.log('❌ Invalid session');
                    this.clearUser();
                    this.showLoginScreen();
                }
            } catch (error) {
                console.error('Error validating session:', error);
                // On network error, try to use stored session
                if (storedUser) {
                    console.log('⚠️ Using stored session due to network error');
                    this.currentUser = JSON.parse(storedUser);
                    this.sessionToken = storedToken;
                    this.sessionExpires = storedExpires;
                    this.showAdminPanel();
                } else {
                    this.clearUser();
                    this.showLoginScreen();
                }
            }
        } else {
            console.log('ℹ️ No valid session found');
            this.showLoginScreen();
        }
    }

    showAdminPanel() {
        console.log('🖥️ Showing admin panel...');
        const loginScreen = document.getElementById('login-screen');
        const adminDashboard = document.getElementById('admin-dashboard');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (adminDashboard) adminDashboard.classList.remove('hidden');
        
        // Initialize admin panel if needed
        if (window.adminPanel && this.currentUser) {
            window.adminPanel.currentUser = this.currentUser;
            window.adminPanel.updateUserInterface();
            // Auto redirect to dashboard
            window.adminPanel.showTab('dashboard');
        }
    }

    showLoginScreen() {
        console.log('🔐 Showing login screen...');
        const loginScreen = document.getElementById('login-screen');
        const adminDashboard = document.getElementById('admin-dashboard');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (adminDashboard) adminDashboard.classList.add('hidden');
    }

    isAuthenticated() {
        return this.currentUser !== null && this.sessionToken !== null;
    }

    isAdmin() {
        return this.isAuthenticated() && this.currentUser.role === 'admin';
    }

    getAuthHeaders() {
        if (!this.sessionToken) {
            console.error('❌ No session token available');
            return {};
        }
        
        return {
            'session-token': this.sessionToken
        };
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 
            'bg-blue-600'
        } text-white`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Auth Manager...');
    window.auth = new AuthManager();
});