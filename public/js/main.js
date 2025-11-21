// Main website JavaScript functionality

class CyberNytronixApp {
    constructor() {
        this.currentUser = null;
        this.services = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadServices();
        this.setupSecurity();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToPage(link.getAttribute('data-page'));
            });
        });

        // Mobile menu
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Service tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');
                this.filterServices(category);
                
                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('active-tab', 'text-white');
                    b.classList.add('text-gray-400');
                });
                
                btn.classList.add('active-tab', 'text-white');
                btn.classList.remove('text-gray-400');
            });
        });

        // Form submissions
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactForm(e));
        }

        const getInTouchForm = document.getElementById('get-in-touch-form');
        if (getInTouchForm) {
            getInTouchForm.addEventListener('submit', (e) => this.handleGetInTouchForm(e));
        }
    }

    setupSecurity() {
        // Disable right-click
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Disable developer tools
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') || 
                (e.ctrlKey && e.shiftKey && e.key === 'J') || 
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                return false;
            }
        });
    }

    navigateToPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.classList.add('fade-in');
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('text-white');
                link.classList.remove('text-gray-400');
            } else {
                link.classList.remove('text-white');
                link.classList.add('text-gray-400');
            }
        });

        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }

    async loadServices() {
        try {
            const response = await fetch('/api/services');
            const result = await response.json();
            
            if (result.success) {
                this.services = result.services;
                this.displayServices('all');
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.displayDefaultServices();
        }
    }

    displayServices(category = 'all') {
        const servicesContainer = document.getElementById('services-container');
        if (!servicesContainer) return;

        const filteredServices = category === 'all' 
            ? this.services 
            : this.services.filter(service => service.category === category);

        servicesContainer.innerHTML = '';

        if (filteredServices.length === 0) {
            servicesContainer.innerHTML = `
                <div class="col-span-3 text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-gray-400 text-lg">No services found in this category.</p>
                </div>
            `;
            return;
        }

        filteredServices.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'card-gradient rounded-xl p-8 service-card';
            serviceCard.innerHTML = `
                <div class="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mb-6">
                    <i class="${service.icon} text-white text-2xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-white mb-4">${service.name}</h3>
                <p class="text-gray-400 text-lg">${service.description}</p>
                <div class="mt-4">
                    <span class="inline-block bg-red-900 text-red-200 text-sm px-3 py-1 rounded-full">
                        ${service.category}
                    </span>
                </div>
            `;
            servicesContainer.appendChild(serviceCard);
        });
    }

    displayDefaultServices() {
        const defaultServices = [
            {
                name: "SOC Analysis",
                description: "24/7 Security Operations Center monitoring and analysis to detect and respond to threats in real-time.",
                category: "cybersecurity",
                icon: "fas fa-shield-alt"
            },
            {
                name: "Penetration Testing",
                description: "Comprehensive security testing to identify vulnerabilities in your systems, applications, and networks.",
                category: "cybersecurity",
                icon: "fas fa-bug"
            },
            {
                name: "Security Audit",
                description: "Thorough security assessment and compliance auditing for your organization's infrastructure and processes.",
                category: "cybersecurity",
                icon: "fas fa-clipboard-check"
            }
        ];

        this.services = defaultServices;
        this.displayServices('all');
    }

    filterServices(category) {
        this.displayServices(category);
    }

    async handleContactForm(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            company: formData.get('company'),
            service: formData.get('service'),
            message: formData.get('message')
        };

        // Basic validation
        if (!data.name || !data.email || !data.message) {
            this.showNotification('Please fill in all required fields.', 'error');
            return;
        }

        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
            submitBtn.disabled = true;

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Thank you for your message! We will get back to you soon.', 'success');
                form.reset();
            } else {
                this.showNotification(result.message || 'There was an error sending your message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('There was an error sending your message. Please try again.', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleGetInTouchForm(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            company: formData.get('company'),
            service: formData.get('service'),
            message: formData.get('message')
        };

        // Basic validation
        if (!data.name || !data.email || !data.message) {
            this.showNotification('Please fill in all required fields.', 'error');
            return;
        }

        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
            submitBtn.disabled = true;

            const response = await fetch('/api/get-in-touch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Thank you for reaching out! We will contact you shortly.', 'success');
                form.reset();
            } else {
                this.showNotification(result.message || 'There was an error sending your message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('There was an error sending your message. Please try again.', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 
            'bg-blue-600'
        } text-white transition-all duration-300 transform translate-x-full`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CyberNytronixApp();
});

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}