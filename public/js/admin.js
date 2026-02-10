// Admin panel functionality with PERSISTENT session management
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.stats = {};
        this.chatInterval = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        console.log('🖥️ Admin Panel Initialized');
        this.setupEventListeners();
        this.isInitialized = true;
    }

    setupEventListeners() {
        console.log('🔧 Setting up admin panel event listeners...');
        
        // Sidebar navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = btn.getAttribute('data-tab');
                this.showTab(tabId);
            });
        });

        // Form submissions
        this.setupFormHandlers();
        
        // Quick action buttons
        document.querySelectorAll('[data-tab]').forEach(btn => {
            if (btn.getAttribute('data-tab')) {
                btn.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'BUTTON') {
                        e.preventDefault();
                        this.showTab(btn.getAttribute('data-tab'));
                    }
                });
            }
        });

        // Modal close buttons
        this.setupModalListeners();

        console.log('✅ Admin panel event listeners setup complete');
    }

    setupModalListeners() {
        // Add user modal
        const addUserModal = document.getElementById('add-user-modal');
        if (addUserModal) {
            const closeBtn = addUserModal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', hideAddUserModal);
            }
        }

        // Edit user modal
        const editUserModal = document.getElementById('edit-user-modal');
        if (editUserModal) {
            const closeBtn = editUserModal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', hideEditUserModal);
            }
        }

        // Change password modal
        const changePasswordModal = document.getElementById('change-password-modal');
        if (changePasswordModal) {
            const closeBtn = changePasswordModal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', hideChangePasswordModal);
            }
        }

        // Edit service modal
        const editServiceModal = document.getElementById('edit-service-modal');
        if (editServiceModal) {
            const closeBtn = editServiceModal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', hideEditServiceModal);
            }
        }

        // Message view modal
        const messageViewModal = document.getElementById('message-view-modal');
        if (messageViewModal) {
            const closeBtn = messageViewModal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', hideMessageViewModal);
            }
        }
    }

    setupFormHandlers() {
        // Add user form
        const addUserForm = document.getElementById('add-user-form');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
        }

        // Edit user form
        const editUserForm = document.getElementById('edit-user-form');
        if (editUserForm) {
            editUserForm.addEventListener('submit', (e) => this.handleEditUser(e));
        }

        // Change password form
        const changePasswordForm = document.getElementById('change-password-form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }

        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Add service form
        const addServiceForm = document.getElementById('add-service-form');
        if (addServiceForm) {
            addServiceForm.addEventListener('submit', (e) => this.handleAddService(e));
        }

        // Edit service form
        const editServiceForm = document.getElementById('edit-service-form');
        if (editServiceForm) {
            editServiceForm.addEventListener('submit', (e) => this.handleEditService(e));
        }

        // Backup button
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.handleBackup());
        }

        // Restore form
        const restoreForm = document.getElementById('restore-form');
        if (restoreForm) {
            restoreForm.addEventListener('submit', (e) => this.handleRestore(e));
        }

        // Profile picture upload
        const changeProfilePic = document.getElementById('change-profile-pic');
        if (changeProfilePic) {
            changeProfilePic.addEventListener('click', () => {
                document.getElementById('profile-pic-upload').click();
            });
        }

        const profilePicUpload = document.getElementById('profile-pic-upload');
        if (profilePicUpload) {
            profilePicUpload.addEventListener('change', (e) => {
                this.uploadProfilePicture(e.target.files[0], this.currentUser.id);
            });
        }

        // Team chat form
        const chatForm = document.getElementById('team-chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleChatMessage(e));
        }

        // Activity limit change
        const activityLimit = document.getElementById('activity-limit');
        if (activityLimit) {
            activityLimit.addEventListener('change', () => {
                this.loadActivityLogs();
            });
        }
    }

    updateUserInterface() {
        if (!this.currentUser) {
            console.log('❌ No current user available for UI update');
            return;
        }

        console.log('👤 Updating UI for user:', this.currentUser.email);

        // Update user info
        const elements = {
            'admin-username': this.currentUser.name,
            'profile-name': this.currentUser.name,
            'profile-role': this.currentUser.role,
            'profile-email': this.currentUser.email,
            'edit-name': this.currentUser.name,
            'edit-email': this.currentUser.email,
            'edit-phone': this.currentUser.phone || '',
            'edit-position': this.currentUser.position || ''
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'text' || element.type === 'email') {
                    element.value = value;
                } else {
                    element.textContent = value;
                }
            }
        });

        // Update profile pictures
        const profilePic = document.getElementById('profile-picture');
        const navProfilePic = document.getElementById('nav-profile-pic');
        
        if (profilePic) {
            if (this.currentUser.profile_pic) {
                profilePic.style.backgroundImage = `url(${this.currentUser.profile_pic})`;
                profilePic.style.backgroundSize = 'cover';
                profilePic.style.backgroundPosition = 'center';
                profilePic.textContent = '';
                profilePic.classList.remove('bg-red-600');
            } else {
                profilePic.style.backgroundImage = 'none';
                profilePic.textContent = this.currentUser.name.charAt(0);
                profilePic.classList.add('bg-red-600');
            }
        }
        
        if (navProfilePic) {
            if (this.currentUser.profile_pic) {
                navProfilePic.style.backgroundImage = `url(${this.currentUser.profile_pic})`;
                navProfilePic.style.backgroundSize = 'cover';
                navProfilePic.style.backgroundPosition = 'center';
                navProfilePic.textContent = '';
                navProfilePic.classList.remove('bg-red-600');
            } else {
                navProfilePic.style.backgroundImage = 'none';
                navProfilePic.textContent = this.currentUser.name.charAt(0);
                navProfilePic.classList.add('bg-red-600');
            }
        }

        // Update permissions based on role
        this.updatePermissions();
        
        // Auto redirect to dashboard after login
        this.showTab('dashboard');
    }

    updatePermissions() {
        const isAdmin = this.currentUser.role === 'admin';
        
        // Show/hide admin-only features
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        adminOnlyElements.forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });

        // Disable user management for non-admins
        const userManagementTab = document.querySelector('[data-tab="users"]');
        if (userManagementTab) {
            userManagementTab.style.display = isAdmin ? 'block' : 'none';
        }

        // Disable backup/restore for non-admins
        const backupTab = document.querySelector('[data-tab="backup"]');
        if (backupTab) {
            backupTab.style.display = isAdmin ? 'block' : 'none';
        }
    }

    showTab(tabId) {
        console.log('📑 Showing tab:', tabId);
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Update active button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('bg-gray-800', 'text-white');
            btn.classList.add('text-gray-400');
        });

        document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(btn => {
            btn.classList.remove('text-gray-400');
            btn.classList.add('bg-gray-800', 'text-white');
        });

        // Stop chat interval if leaving chat tab
        if (tabId !== 'team-chat' && this.chatInterval) {
            clearInterval(this.chatInterval);
            this.chatInterval = null;
        }

        // Load tab data
        this.loadTabData(tabId);
    }

    async loadTabData(tabId) {
        console.log('📊 Loading data for tab:', tabId);
        
        // Check authentication before loading any data
        if (!window.auth || !window.auth.isAuthenticated()) {
            console.error('❌ Not authenticated, cannot load tab data');
            this.showNotification('Session expired. Please login again.', 'error');
            window.auth.showLoginScreen();
            return;
        }
        
        try {
            switch (tabId) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'users':
                    await this.loadUsers();
                    break;
                case 'services':
                    await this.loadServices();
                    break;
                case 'messages':
                    await this.loadMessages();
                    break;
                case 'team-chat':
                    await this.loadTeamChat();
                    this.startChatPolling();
                    break;
                case 'activity':
                    await this.loadActivityLogs();
                    break;
                case 'backup':
                    // No data to load for backup tab
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error(`Error loading tab ${tabId}:`, error);
            this.handleApiError(error);
        }
    }

    async loadDashboard() {
        try {
            console.log('📈 Loading dashboard stats...');
            const response = await fetch('/api/dashboard-stats', {
                headers: window.auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.stats = result.stats;
                this.updateDashboardStats();
                await this.loadRecentActivity();
            } else {
                console.error('Error loading dashboard stats:', result.message);
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.handleApiError(error);
        }
    }

    updateDashboardStats() {
        const statElements = {
            'totalUsers': 'total-users',
            'totalServices': 'active-services', 
            'newContactMessages': 'new-messages',
            'totalActivityLogs': 'total-logs'
        };

        Object.entries(statElements).forEach(([key, elementId]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = this.stats[key] || '0';
            }
        });
    }

    async loadRecentActivity() {
        try {
            const response = await fetch('/api/activity-logs?limit=5', {
                headers: window.auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.displayRecentActivity(result.logs);
            } else {
                console.error('Error loading recent activity:', result.message);
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    displayRecentActivity(logs) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        if (!logs || logs.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">No recent activity</p>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="flex items-start justify-between py-3 border-b border-gray-700">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-medium text-white">${log.user_name || 'System'}</span>
                        <span class="text-xs text-gray-400">${this.formatPakistanDate(log.created_at)}</span>
                    </div>
                    <p class="text-gray-300 text-sm">${log.action}</p>
                    ${log.details ? `<p class="text-gray-400 text-xs mt-1">${log.details}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users', {
                headers: window.auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.displayUsers(result.users);
            } else {
                console.error('Error loading users:', result.message);
                document.getElementById('users-table-body').innerHTML = 
                    '<tr><td colspan="6" class="text-center py-8 text-gray-400">' + result.message + '</td></tr>';
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.handleApiError(error);
        }
    }

    displayUsers(users) {
        const container = document.getElementById('users-table-body');
        if (!container) return;

        if (!users || users.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400">No users found</td></tr>';
            return;
        }

        container.innerHTML = users.map(user => `
            <tr class="border-b border-gray-700">
                <td class="py-3">
                    <div class="flex items-center gap-3">
                        ${user.profile_pic ? 
                            `<img src="${user.profile_pic}" alt="${user.name}" class="w-8 h-8 rounded-full">` :
                            `<div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                ${user.name.charAt(0)}
                            </div>`
                        }
                        <span class="text-white">${user.name}</span>
                    </div>
                </td>
                <td class="py-3 text-gray-300">${user.email}</td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
                    }">
                        ${user.role}
                    </span>
                </td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium ${
                        user.is_active === 1 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }">
                        ${user.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="py-3 text-gray-300">${user.last_login ? this.formatPakistanDate(user.last_login) : 'Never'}</td>
                <td class="py-3">
                    <div class="flex gap-2">
                        <button class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 edit-user" data-id="${user.id}">
                            <i class="fas fa-edit mr-1"></i> Edit
                        </button>
                        <button class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 change-password" data-id="${user.id}" data-name="${user.name}">
                            <i class="fas fa-key mr-1"></i> Password
                        </button>
                        ${user.id !== this.currentUser.id && this.currentUser.role === 'admin' ? `
                            <button class="px-3 py-1 ${user.is_active === 1 ? 'bg-yellow-600' : 'bg-green-600'} text-white rounded text-sm hover:opacity-90 toggle-status" data-id="${user.id}" data-status="${user.is_active}">
                                <i class="fas ${user.is_active === 1 ? 'fa-pause' : 'fa-play'} mr-1"></i> ${user.is_active === 1 ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 delete-user" data-id="${user.id}">
                                <i class="fas fa-trash mr-1"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners to buttons
        this.setupUserActionListeners();
    }

    setupUserActionListeners() {
        // Edit user buttons
        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('button').getAttribute('data-id');
                this.editUser(userId);
            });
        });

        // Change password buttons
        document.querySelectorAll('.change-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('button').getAttribute('data-id');
                const userName = e.target.closest('button').getAttribute('data-name');
                this.showChangePasswordModal(userId, userName);
            });
        });

        // Toggle status buttons
        document.querySelectorAll('.toggle-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('button').getAttribute('data-id');
                const currentStatus = parseInt(e.target.closest('button').getAttribute('data-status'));
                this.toggleUserStatus(userId, currentStatus);
            });
        });

        // Delete user buttons
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('button').getAttribute('data-id');
                this.deleteUser(userId);
            });
        });
    }

    async editUser(userId) {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                headers: window.auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showEditUserModal(result.user);
            } else {
                this.showNotification('Error loading user data', 'error');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            this.handleApiError(error);
        }
    }

    showEditUserModal(user) {
        const modal = document.getElementById('edit-user-modal');
        if (!modal) return;

        // Fill form with user data
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-user-name').value = user.name;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-phone').value = user.phone || '';
        document.getElementById('edit-user-position').value = user.position || '';
        
        // Set role if current user is admin
        const roleSelect = document.getElementById('edit-user-role');
        if (roleSelect && this.currentUser.role === 'admin') {
            roleSelect.value = user.role;
            roleSelect.disabled = false;
        } else if (roleSelect) {
            roleSelect.disabled = true;
        }

        modal.classList.remove('hidden');
    }

    showChangePasswordModal(userId, userName) {
        const modal = document.getElementById('change-password-modal');
        if (!modal) return;

        document.getElementById('change-password-user-id').value = userId;
        
        // Update modal title to show which user's password is being changed
        const title = modal.querySelector('h3');
        if (title) {
            title.textContent = `Change Password for ${userName}`;
        }

        // Clear the form
        document.getElementById('change-password-new').value = '';
        document.getElementById('change-password-confirm').value = '';

        modal.classList.remove('hidden');
    }

    // FIXED: Password change handler - DEEPLY DEBUGGED
    async handleChangePassword(e) {
        e.preventDefault();
        console.log('🔐 Starting password change process...');
        
        const userId = document.getElementById('change-password-user-id').value;
        
        // FIXED: Use unique IDs for password fields in the change password modal
        const newPassword = document.getElementById('change-password-new').value;
        const confirmPassword = document.getElementById('change-password-confirm').value;

        console.log('📝 Password fields:', {
            userId,
            newPasswordLength: newPassword.length,
            confirmPasswordLength: confirmPassword.length
        });

        // FIXED: Proper password matching check
        if (newPassword !== confirmPassword) {
            console.log('❌ Passwords do not match');
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            console.log('❌ Password too short');
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        console.log('✅ Password validation passed, sending request...');

        try {
            const response = await fetch(`/api/users/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.auth.getAuthHeaders()
                },
                body: JSON.stringify({ new_password: newPassword })
            });

            console.log('📨 API Response status:', response.status);

            const result = await response.json();
            console.log('📨 API Response data:', result);

            if (result.success) {
                console.log('✅ Password changed successfully');
                this.showNotification('Password changed successfully', 'success');
                hideChangePasswordModal();
                // Clear the form
                document.getElementById('change-password-new').value = '';
                document.getElementById('change-password-confirm').value = '';
            } else {
                console.log('❌ Password change failed:', result.message);
                this.showNotification(result.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('❌ Network error changing password:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    async toggleUserStatus(userId, currentStatus) {
        const newStatus = currentStatus === 1 ? 0 : 1;
        const action = newStatus === 1 ? 'activate' : 'deactivate';

        if (!confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.auth.getAuthHeaders()
                },
                body: JSON.stringify({ is_active: newStatus })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification(`User ${action}d successfully`, 'success');
                this.loadUsers();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            this.handleApiError(error);
        }
    }

    async handleEditUser(e) {
        e.preventDefault();
        
        const userId = document.getElementById('edit-user-id').value;
        const formData = {
            name: document.getElementById('edit-user-name').value,
            phone: document.getElementById('edit-user-phone').value,
            position: document.getElementById('edit-user-position').value
        };

        // Add role if admin
        if (this.currentUser.role === 'admin') {
            formData.role = document.getElementById('edit-user-role').value;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.auth.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification('User updated successfully', 'success');
                hideEditUserModal();
                await this.loadUsers();
                
                // Update current user data if editing own profile
                if (userId == this.currentUser.id) {
                    this.currentUser = { ...this.currentUser, ...formData };
                    window.auth.currentUser = this.currentUser;
                    this.updateUserInterface();
                }
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            this.handleApiError(error);
        }
    }

    async handleAddUser(e) {
        e.preventDefault();
        console.log('👤 Adding new user...');

        const formData = {
            name: document.getElementById('new-username').value,
            email: document.getElementById('new-email').value,
            password: document.getElementById('new-password').value,
            role: document.getElementById('new-role').value,
            phone: '',
            position: ''
        };

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.auth.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification('User created successfully', 'success');
                e.target.reset();
                hideAddUserModal();
                await this.loadUsers();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            this.handleApiError(error);
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        console.log('👤 Updating profile...');

        const formData = {
            name: document.getElementById('edit-name').value,
            phone: document.getElementById('edit-phone').value,
            position: document.getElementById('edit-position').value
        };

        try {
            const response = await fetch(`/api/users/${this.currentUser.id}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.auth.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification('Profile updated successfully', 'success');
                // Update current user data
                this.currentUser = { ...this.currentUser, ...formData };
                window.auth.currentUser = this.currentUser;
                this.updateUserInterface();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.handleApiError(error);
        }
    }

    // UPDATED: Admin can upload profile pictures for any user
    async uploadProfilePicture(file, userId) {
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_pic', file);
        formData.append('user_id', userId);

        try {
            const response = await fetch('/api/upload-profile-pic', {
                method: 'POST',
                headers: window.auth.getAuthHeaders(),
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification('Profile picture updated successfully', 'success');
                
                // Update current user's profile picture if it's their own
                if (userId == this.currentUser.id) {
                    this.currentUser.profile_pic = result.profile_pic;
                    window.auth.currentUser.profile_pic = result.profile_pic;
                    this.updateUserInterface();
                } else {
                    // Reload users to update the picture in the table
                    this.loadUsers();
                }
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            this.handleApiError(error);
        }
    }

    // NEW: Admin can upload profile picture for any user
    uploadUserProfilePicture(userId, userName) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadProfilePicture(file, userId);
            }
        };
        input.click();
    }

    async handleAddService(e) {
        e.preventDefault();
        console.log('🛠️ Adding new service...');

        const formData = {
            name: document.getElementById('service-name').value,
            description: document.getElementById('service-description').value,
            category: document.getElementById('service-category').value,
            icon: document.getElementById('service-icon').value
        };

        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.auth.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification('Service created successfully', 'success');
                e.target.reset();
                await this.loadServices();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating service:', error);
            this.handleApiError(error);
        }
    }

    async editService(serviceId) {
        try {
            const response = await fetch(`/api/services/${serviceId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showEditServiceModal(result.service);
            } else {
                this.showNotification('Error loading service data', 'error');
            }
        } catch (error) {
            console.error('Error fetching service:', error);
            this.handleApiError(error);
        }
    }

    showEditServiceModal(service) {
        const modal = document.getElementById('edit-service-modal');
        if (!modal) return;

        // Fill form with service data
        document.getElementById('edit-service-id').value = service.id;
        document.getElementById('edit-service-name').value = service.name;
        document.getElementById('edit-service-description').value = service.description;
        document.getElementById('edit-service-category').value = service.category;
        document.getElementById('edit-service-icon').value = service.icon;
        document.getElementById('edit-service-active').checked = service.is_active === 1;

        modal.classList.remove('hidden');
    }

    async handleEditService(e) {
        e.preventDefault();
        
        const serviceId = document.getElementById('edit-service-id').value;
        const formData = {
            name: document.getElementById('edit-service-name').value,
            description: document.getElementById('edit-service-description').value,
            category: document.getElementById('edit-service-category').value,
            icon: document.getElementById('edit-service-icon').value,
            is_active: document.getElementById('edit-service-active').checked ? 1 : 0
        };

        try {
            const response = await fetch(`/api/services/${serviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.auth.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification('Service updated successfully', 'success');
                hideEditServiceModal();
                await this.loadServices();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error updating service:', error);
            this.handleApiError(error);
        }
    }

    async loadServices() {
        try {
            const response = await fetch('/api/services');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.displayServices(result.services);
            } else {
                console.error('Error loading services:', result.message);
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.handleApiError(error);
        }
    }

    displayServices(services) {
        const container = document.getElementById('services-table-body');
        if (!container) return;

        if (!services || services.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">No services found</td></tr>';
            return;
        }

        container.innerHTML = services.map(service => `
            <tr class="border-b border-gray-700">
                <td class="py-3 text-white">${service.name}</td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-300">
                        ${service.category}
                    </span>
                </td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium ${
                        service.is_active === 1 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }">
                        ${service.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="py-3 text-gray-300">${this.formatPakistanDate(service.created_at)}</td>
                <td class="py-3">
                    <div class="flex gap-2">
                        <button class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 edit-service" data-id="${service.id}">
                            <i class="fas fa-edit mr-1"></i> Edit
                        </button>
                        ${this.currentUser.role === 'admin' ? `
                            <button class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 delete-service" data-id="${service.id}">
                                <i class="fas fa-trash mr-1"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners to service buttons
        this.setupServiceActionListeners();
    }

    setupServiceActionListeners() {
        // Edit service buttons
        document.querySelectorAll('.edit-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceId = e.target.closest('button').getAttribute('data-id');
                this.editService(serviceId);
            });
        });

        // Delete service buttons
        document.querySelectorAll('.delete-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceId = e.target.closest('button').getAttribute('data-id');
                this.deleteService(serviceId);
            });
        });
    }

    async loadMessages() {
        try {
            const [contactResponse, getInTouchResponse] = await Promise.all([
                fetch('/api/contact-submissions', { headers: window.auth.getAuthHeaders() }),
                fetch('/api/get-in-touch-submissions', { headers: window.auth.getAuthHeaders() })
            ]);

            if (!contactResponse.ok || !getInTouchResponse.ok) {
                throw new Error('Failed to load messages');
            }

            const contactResult = await contactResponse.json();
            const getInTouchResult = await getInTouchResponse.json();

            if (contactResult.success) {
                this.displayContactMessages(contactResult.submissions);
                this.updateMessageCount('contact-count', contactResult.submissions);
            } else {
                console.error('Error loading contact messages:', contactResult.message);
                document.getElementById('contact-messages-table-body').innerHTML = 
                    '<tr><td colspan="6" class="text-center py-8 text-gray-400">Error loading contact messages</td></tr>';
            }

            // FIXED: Properly handle get-in-touch response
            if (getInTouchResult.success) {
                this.displayGetInTouchMessages(getInTouchResult.submissions);
                this.updateMessageCount('get-in-touch-count', getInTouchResult.submissions);
            } else {
                console.error('Error loading get in touch messages:', getInTouchResult.message);
                document.getElementById('get-in-touch-table-body').innerHTML = 
                    '<tr><td colspan="6" class="text-center py-8 text-gray-400">Error loading get in touch messages</td></tr>';
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            this.handleApiError(error);
        }
    }

    updateMessageCount(elementId, messages) {
        const newCount = messages.filter(msg => msg.status === 'new').length;
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${newCount} new`;
        }
    }

    displayContactMessages(messages) {
        const container = document.getElementById('contact-messages-table-body');
        if (!container) return;

        if (!messages || messages.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400">No contact messages</td></tr>';
            return;
        }

        container.innerHTML = messages.map(msg => `
            <tr class="border-b border-gray-700">
                <td class="py-3 text-white">${msg.name}</td>
                <td class="py-3 text-gray-300">${msg.email}</td>
                <td class="py-3 text-gray-300">${msg.service || 'N/A'}</td>
                <td class="py-3 text-gray-300">${this.formatPakistanDate(msg.submitted_at)}</td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium ${
                        msg.status === 'new' ? 'bg-yellow-600 text-white' : 
                        msg.status === 'read' ? 'bg-blue-600 text-white' : 
                        'bg-green-600 text-white'
                    }">
                        ${msg.status}
                    </span>
                </td>
                <td class="py-3">
                    <div class="flex gap-2">
                        <button class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 view-message" data-id="${msg.id}" data-type="contact">
                            <i class="fas fa-eye mr-1"></i> View
                        </button>
                        <select class="px-2 py-1 bg-gray-600 text-white rounded text-sm status-select" data-id="${msg.id}" data-type="contact">
                            <option value="new" ${msg.status === 'new' ? 'selected' : ''}>New</option>
                            <option value="read" ${msg.status === 'read' ? 'selected' : ''}>Read</option>
                            <option value="replied" ${msg.status === 'replied' ? 'selected' : ''}>Replied</option>
                        </select>
                    </div>
                </td>
            </tr>
        `).join('');

        this.setupMessageActionListeners();
    }

    displayGetInTouchMessages(messages) {
        const container = document.getElementById('get-in-touch-table-body');
        if (!container) return;

        if (!messages || messages.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400">No get in touch messages</td></tr>';
            return;
        }

        container.innerHTML = messages.map(msg => `
            <tr class="border-b border-gray-700">
                <td class="py-3 text-white">${msg.name}</td>
                <td class="py-3 text-gray-300">${msg.email}</td>
                <td class="py-3 text-gray-300">${msg.company || 'N/A'}</td>
                <td class="py-3 text-gray-300">${this.formatPakistanDate(msg.submitted_at)}</td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium ${
                        msg.status === 'new' ? 'bg-yellow-600 text-white' : 
                        msg.status === 'read' ? 'bg-blue-600 text-white' : 
                        'bg-green-600 text-white'
                    }">
                        ${msg.status}
                    </span>
                </td>
                <td class="py-3">
                    <div class="flex gap-2">
                        <button class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 view-message" data-id="${msg.id}" data-type="get-in-touch">
                            <i class="fas fa-eye mr-1"></i> View
                        </button>
                        <select class="px-2 py-1 bg-gray-600 text-white rounded text-sm status-select" data-id="${msg.id}" data-type="get-in-touch">
                            <option value="new" ${msg.status === 'new' ? 'selected' : ''}>New</option>
                            <option value="read" ${msg.status === 'read' ? 'selected' : ''}>Read</option>
                            <option value="replied" ${msg.status === 'replied' ? 'selected' : ''}>Replied</option>
                        </select>
                    </div>
                </td>
            </tr>
        `).join('');

        this.setupMessageActionListeners();
    }

    setupMessageActionListeners() {
        // View message buttons
        document.querySelectorAll('.view-message').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const messageId = e.target.closest('button').getAttribute('data-id');
                const type = e.target.closest('button').getAttribute('data-type');
                this.viewMessage(messageId, type);
            });
        });

        // Status select changes
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const messageId = e.target.getAttribute('data-id');
                const type = e.target.getAttribute('data-type');
                const status = e.target.value;
                this.updateMessageStatus(messageId, type, status);
            });
        });
    }

    async viewMessage(messageId, type) {
        try {
            const endpoint = type === 'contact' 
                ? `/api/contact-submissions/${messageId}`
                : `/api/get-in-touch-submissions/${messageId}`;

            const response = await fetch(endpoint, {
                headers: window.auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showMessageModal(result.submission, type);
            } else {
                this.showNotification('Error loading message', 'error');
            }
        } catch (error) {
            console.error('Error viewing message:', error);
            this.handleApiError(error);
        }
    }

    showMessageModal(message, type) {
        const modal = document.getElementById('message-view-modal');
        const details = document.getElementById('message-details');

        if (!modal || !details) return;

        details.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="text-gray-400 text-sm">Name</label>
                    <p class="text-white">${message.name}</p>
                </div>
                <div>
                    <label class="text-gray-400 text-sm">Email</label>
                    <p class="text-white">${message.email}</p>
                </div>
                ${message.company ? `
                <div>
                    <label class="text-gray-400 text-sm">Company</label>
                    <p class="text-white">${message.company}</p>
                </div>
                ` : ''}
                ${message.service ? `
                <div>
                    <label class="text-gray-400 text-sm">Service</label>
                    <p class="text-white">${message.service}</p>
                </div>
                ` : ''}
                <div>
                    <label class="text-gray-400 text-sm">Message</label>
                    <p class="text-white bg-gray-800 p-3 rounded mt-1">${message.message}</p>
                </div>
                <div>
                    <label class="text-gray-400 text-sm">Submitted</label>
                    <p class="text-white">${this.formatPakistanDate(message.submitted_at)}</p>
                </div>
                <div>
                    <label class="text-gray-400 text-sm">Status</label>
                    <p class="text-white">${message.status}</p>
                </div>
                ${message.updated_by_name ? `
                <div>
                    <label class="text-gray-400 text-sm">Last Updated By</label>
                    <p class="text-white">${message.updated_by_name}</p>
                </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    }

    async updateMessageStatus(messageId, type, status) {
        try {
            const endpoint = type === 'contact' 
                ? `/api/contact-submissions/${messageId}/status`
                : `/api/get-in-touch-submissions/${messageId}/status`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.auth.getAuthHeaders()
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showNotification('Message status updated', 'success');
                this.loadMessages(); // Reload to update counts
            } else {
                this.showNotification('Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Error updating message status:', error);
            this.handleApiError(error);
        }
    }

    async loadActivityLogs() {
        try {
            const limit = document.getElementById('activity-limit')?.value || 100;
            const response = await fetch(`/api/activity-logs?limit=${limit}`, {
                headers: window.auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.displayActivityLogs(result.logs);
            } else {
                console.error('Error loading activity logs:', result.message);
            }
        } catch (error) {
            console.error('Error loading activity logs:', error);
            this.handleApiError(error);
        }
    }

    displayActivityLogs(logs) {
        const container = document.getElementById('activity-logs-table-body');
        if (!container) return;

        if (!logs || logs.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">No activity logs</td></tr>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <tr class="border-b border-gray-700">
                <td class="py-3 text-gray-300">${this.formatPakistanDate(log.created_at)}</td>
                <td class="py-3 text-white">${log.user_name || 'System'}</td>
                <td class="py-3 text-gray-300">${log.action}</td>
                <td class="py-3 text-gray-300">${log.details || '-'}</td>
                <td class="py-3 text-gray-300">${log.ip_address || '-'}</td>
            </tr>
        `).join('');
    }

    // Team Chat functionality
    async loadTeamChat() {
        try {
            const response = await fetch('/api/team-chat', {
                headers: window.auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.displayTeamChat(result.messages);
            } else {
                console.error('Error loading team chat:', result.message);
            }
        } catch (error) {
            console.error('Error loading team chat:', error);
        }
    }

    displayTeamChat(messages) {
        const container = document.getElementById('team-chat-messages');
        if (!container) return;

        if (!messages || messages.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-400">No messages yet</div>';
            return;
        }

        container.innerHTML = messages.map(msg => {
            const isCurrentUser = msg.user_id === this.currentUser.id;
            return `
                <div class="flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4">
                    <div class="max-w-xs lg:max-w-md ${isCurrentUser ? 'bg-red-600' : 'bg-gray-700'} rounded-lg p-3">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium text-white text-sm">${msg.user_name}</span>
                            <span class="text-xs ${isCurrentUser ? 'text-red-200' : 'text-gray-300'}">${msg.user_role}</span>
                        </div>
                        <p class="text-white text-sm">${msg.message}</p>
                        <div class="text-right mt-1">
                            <span class="text-xs ${isCurrentUser ? 'text-red-200' : 'text-gray-400'}">${this.formatPakistanTime(msg.created_at)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    startChatPolling() {
        // Clear existing interval
        if (this.chatInterval) {
            clearInterval(this.chatInterval);
        }

        // Poll for new messages every 3 seconds
        this.chatInterval = setInterval(() => {
            this.loadTeamChat();
        }, 3000);
    }

    async handleChatMessage(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('team-chat-message');
        const message = messageInput.value.trim();

        if (!message) {
            this.showNotification('Please enter a message', 'error');
            return;
        }

        const formData = {
            user_id: this.currentUser.id,
            user_name: this.currentUser.name,
            user_role: this.currentUser.role,
            message: message
        };

        try {
            const response = await fetch('/api/team-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.auth.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                messageInput.value = '';
                this.loadTeamChat(); // Reload messages
            } else {
                this.showNotification('Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Error sending chat message:', error);
            this.handleApiError(error);
        }
    }

    async handleBackup() {
        try {
            this.showNotification('Creating backup...', 'info');
            
            const response = await fetch('/api/backup', {
                headers: window.auth.getAuthHeaders()
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cyber_hexor_backup_${Date.now()}.db`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showNotification('Database backup downloaded successfully', 'success');
            } else {
                const result = await response.json();
                this.showNotification(result.message || 'Backup failed', 'error');
            }
        } catch (error) {
            console.error('Error creating backup:', error);
            this.handleApiError(error);
        }
    }

    async handleRestore(e) {
        e.preventDefault();
        const fileInput = document.getElementById('backup-file');
        const file = fileInput.files[0];

        if (!file) {
            this.showNotification('Please select a backup file', 'error');
            return;
        }

        if (!confirm('⚠️ This will replace the current database. Are you sure?')) {
            return;
        }

        const formData = new FormData();
        formData.append('backup_file', file);

        try {
            this.showNotification('Restoring database...', 'info');
            
            const response = await fetch('/api/restore', {
                method: 'POST',
                headers: window.auth.getAuthHeaders(),
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Database restored successfully! The page will reload in 3 seconds.', 'success');
                e.target.reset();
                
                // Update current user data if provided by server
                if (result.user) {
                    this.currentUser = result.user;
                    window.auth.currentUser = result.user;
                }
                
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error restoring database:', error);
            this.handleApiError(error);
        }
    }

    // Helper methods
    deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: window.auth.getAuthHeaders()
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                this.showNotification('User deleted successfully', 'success');
                this.loadUsers();
            } else {
                this.showNotification(result.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            this.showNotification('Error deleting user', 'error');
        });
    }

    deleteService(serviceId) {
        if (!confirm('Are you sure you want to delete this service?')) {
            return;
        }

        fetch(`/api/services/${serviceId}`, {
            method: 'DELETE',
            headers: window.auth.getAuthHeaders()
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                this.showNotification('Service deleted successfully', 'success');
                this.loadServices();
            } else {
                this.showNotification(result.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting service:', error);
            this.showNotification('Error deleting service', 'error');
        });
    }

    // Error handling for API calls
    handleApiError(error) {
        console.error('API Error:', error);
        
        if (error.message.includes('401') || error.message.includes('session')) {
            this.showNotification('Session expired. Please login again.', 'error');
            if (window.auth) {
                window.auth.showLoginScreen();
            }
        } else if (error.message.includes('403')) {
            this.showNotification('Access denied. Insufficient permissions.', 'error');
        } else if (error.message.includes('500')) {
            this.showNotification('Server error. Please try again later.', 'error');
        } else if (error.message.includes('Network')) {
            this.showNotification('Network error. Please check your connection.', 'error');
        } else {
            this.showNotification('An error occurred. Please try again.', 'error');
        }
    }

    // Pakistan Time Functions
    formatPakistanDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-PK', {
                timeZone: 'Asia/Karachi',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    formatPakistanTime(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-PK', {
                timeZone: 'Asia/Karachi',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Time';
        }
    }

    getCurrentPakistanTime() {
        return new Date().toLocaleString('en-PK', {
            timeZone: 'Asia/Karachi',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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

        // FIXED: Reduced notification timeout from 5000ms to 3000ms (3 seconds)
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Global functions
function showAddUserModal() {
    document.getElementById('add-user-modal').classList.remove('hidden');
}

function hideAddUserModal() {
    document.getElementById('add-user-modal').classList.add('hidden');
}

function hideEditUserModal() {
    document.getElementById('edit-user-modal').classList.add('hidden');
}

function hideChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('hidden');
}

function hideEditServiceModal() {
    document.getElementById('edit-service-modal').classList.add('hidden');
}

function hideMessageViewModal() {
    document.getElementById('message-view-modal').classList.remove('active');
}

function showAddServiceModal() {
    window.adminPanel.showTab('services');
}

function showTab(tabId) {
    if (window.adminPanel) {
        window.adminPanel.showTab(tabId);
    }
}

// Display Pakistan time in admin panel
function displayPakistanTime() {
    const timeElement = document.getElementById('pakistan-time');
    if (timeElement) {
        setInterval(() => {
            const now = new Date();
            const pakistanTime = now.toLocaleString('en-PK', {
                timeZone: 'Asia/Karachi',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                weekday: 'short'
            });
            timeElement.textContent = `Karachi Time: ${pakistanTime}`;
        }, 1000);
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Admin Panel...');
    window.adminPanel = new AdminPanel();
    
    // Wait for auth to be initialized before setting up admin panel
    if (window.auth && window.auth.currentUser) {
        window.adminPanel.currentUser = window.auth.currentUser;
        window.adminPanel.init();
        displayPakistanTime();
    } else {
        // If auth isn't ready yet, wait for it
        const checkAuth = setInterval(() => {
            if (window.auth && window.auth.currentUser) {
                window.adminPanel.currentUser = window.auth.currentUser;
                window.adminPanel.init();
                displayPakistanTime();
                clearInterval(checkAuth);
            }
        }, 100);
    }
});
