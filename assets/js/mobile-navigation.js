/**
 * Mobile Navigation Manager
 * Handles mobile navigation, sidebar toggling, and touch interactions
 */

class MobileNavigationManager {
    constructor() {
        this.isSidebarOpen = false;
        this.isTouchDevice = this.detectTouchDevice();
        this.init();
    }

    /**
     * Initialize mobile navigation
     */
    init() {
        console.log('📱 Initializing Mobile Navigation Manager...');
        
        // Check if we're on a mobile device or small screen
        const isMobile = window.innerWidth < 768;
        console.log('📱 Screen width:', window.innerWidth, 'Mobile:', isMobile);
        
        this.createMobileNavToggle();
        this.bindEvents();
        this.setupTouchInteractions();
        this.handleResize();
        
        console.log('📱 Mobile Navigation Manager initialized');
    }

    /**
     * Detect if device supports touch
     */
    detectTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * Create mobile navigation toggle button
     */
    createMobileNavToggle() {
        // Check if toggle already exists
        if (document.querySelector('.mobile-nav-toggle')) {
            console.log('📱 Mobile nav toggle already exists');
            return;
        }

        // Check if sidebar exists
        const sidebar = document.querySelector('.sidebar, aside');
        console.log('📱 Looking for sidebar:', sidebar);
        
        if (!sidebar) {
            console.warn('⚠️ No sidebar found for mobile navigation');
            return;
        }

        const toggle = document.createElement('button');
        toggle.className = 'mobile-nav-toggle';
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        toggle.setAttribute('aria-label', 'Toggle navigation menu');
        toggle.setAttribute('aria-expanded', 'false');
        
        document.body.appendChild(toggle);
        console.log('✅ Mobile nav toggle created and added to DOM');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Mobile nav toggle
        const toggle = document.querySelector('.mobile-nav-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isSidebarOpen && 
                !e.target.closest('.sidebar, aside') && 
                !e.target.closest('.mobile-nav-toggle')) {
                this.closeSidebar();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSidebarOpen) {
                this.closeSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
    }

    /**
     * Setup touch-specific interactions
     */
    setupTouchInteractions() {
        if (!this.isTouchDevice) return;

        // Add touch feedback to buttons
        const buttons = document.querySelectorAll('.action-button, .mobile-nav-toggle');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
            });
        });

        // Add swipe to close sidebar
        this.setupSwipeToClose();
        
        console.log('👆 Touch interactions configured');
    }

    /**
     * Setup swipe to close sidebar
     */
    setupSwipeToClose() {
        const sidebar = document.querySelector('.sidebar, aside');
        if (!sidebar) return;

        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        sidebar.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });

        sidebar.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const diff = startX - currentX;
            
            // Only allow swipe to close if swiping left
            if (diff > 50) {
                sidebar.style.transform = `translateX(-${Math.min(diff, 100)}px)`;
            }
        });

        sidebar.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            const diff = startX - currentX;
            
            if (diff > 100) {
                this.closeSidebar();
            } else {
                sidebar.style.transform = '';
            }
            
            isDragging = false;
        });
    }

    /**
     * Toggle sidebar open/close
     */
    toggleSidebar() {
        if (this.isSidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    /**
     * Open sidebar
     */
    openSidebar() {
        const sidebar = document.querySelector('.sidebar, aside');
        const toggle = document.querySelector('.mobile-nav-toggle');
        
        if (sidebar && toggle) {
            sidebar.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.innerHTML = '<i class="fas fa-times"></i>';
            this.isSidebarOpen = true;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            console.log('📱 Sidebar opened');
        }
    }

    /**
     * Close sidebar
     */
    closeSidebar() {
        const sidebar = document.querySelector('.sidebar, aside');
        const toggle = document.querySelector('.mobile-nav-toggle');
        
        if (sidebar && toggle) {
            sidebar.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '<i class="fas fa-bars"></i>';
            this.isSidebarOpen = false;
            
            // Reset sidebar transform
            sidebar.style.transform = '';
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            console.log('📱 Sidebar closed');
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const width = window.innerWidth;
        
        if (width >= 768) {
            // Desktop mode
            // Remove mobile toggle
            const toggle = document.querySelector('.mobile-nav-toggle');
            if (toggle) {
                toggle.remove();
            }
            
            // Ensure sidebar is visible on desktop
            const sidebar = document.querySelector('.sidebar, aside');
            if (sidebar) {
                sidebar.classList.remove('active');
                sidebar.style.left = '0';
                sidebar.style.transform = '';
                sidebar.style.position = 'fixed';
                sidebar.style.width = width >= 1200 ? '320px' : '280px';
                sidebar.style.zIndex = '1000';
            }
            
            // Ensure main content has proper margin
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.marginLeft = width >= 1200 ? '320px' : '280px';
                mainContent.style.marginTop = '0';
            }
            
            // Reset body overflow
            document.body.style.overflow = '';
        } else {
            // Mobile mode
            this.createMobileNavToggle();
            this.closeSidebar(); // Ensure sidebar is closed on mobile
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            isSidebarOpen: this.isSidebarOpen,
            isTouchDevice: this.isTouchDevice,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        };
    }
}

/**
 * Mobile Table Manager
 * Handles responsive table behavior on mobile devices
 */
class MobileTableManager {
    constructor() {
        this.init();
    }

    /**
     * Initialize mobile table functionality
     */
    init() {
        this.makeTablesResponsive();
        this.setupTableActions();
        console.log('📊 Mobile Table Manager initialized');
    }

    /**
     * Make tables responsive
     */
    makeTablesResponsive() {
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            // Check if table is already wrapped
            if (table.closest('.table-responsive')) {
                return; // Already wrapped
            }
            
            // Check if table is in a container
            const container = table.closest('.table-container');
            if (container) {
                // If table is directly in container, wrap it
                if (table.parentNode === container) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-responsive';
                    container.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                    console.log('📊 Wrapped table in responsive container');
                }
            } else {
                // If table is not in a container, create one
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
                console.log('📊 Wrapped standalone table in responsive container');
            }
        });
        
        // Also ensure all table containers have responsive wrappers
        const tableContainers = document.querySelectorAll('.table-container');
        tableContainers.forEach(container => {
            const table = container.querySelector('table');
            if (table && !container.querySelector('.table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                container.insertBefore(wrapper, table);
                wrapper.appendChild(table);
                console.log('📊 Added responsive wrapper to table container');
            }
        });
    }

    /**
     * Setup mobile-friendly table actions
     */
    setupTableActions() {
        const actionButtons = document.querySelectorAll('table .action-button');
        
        actionButtons.forEach(button => {
            // Ensure minimum touch target size
            if (button.offsetHeight < 44) {
                button.style.minHeight = '44px';
                button.style.padding = '12px 16px';
            }
        });
    }
}

/**
 * Mobile Modal Manager
 * Handles mobile-optimized modal behavior
 */
class MobileModalManager {
    constructor() {
        this.init();
    }

    /**
     * Initialize mobile modal functionality
     */
    init() {
        this.setupModalClose();
        this.optimizeModalForms();
        console.log('📱 Mobile Modal Manager initialized');
    }

    /**
     * Setup mobile-friendly modal close
     */
    setupModalClose() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            // Add swipe to close for modals
            this.addSwipeToClose(modal);
            
            // Ensure close button is touch-friendly
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.style.minWidth = '44px';
                closeBtn.style.minHeight = '44px';
            }
        });
    }

    /**
     * Add swipe to close functionality
     */
    addSwipeToClose(modal) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        modal.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        });

        modal.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            // Only allow swipe down to close
            if (diff > 50) {
                modal.style.transform = `translateY(${Math.min(diff, 100)}px)`;
            }
        });

        modal.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            const diff = currentY - startY;
            
            if (diff > 100) {
                this.closeModal(modal);
            } else {
                modal.style.transform = '';
            }
            
            isDragging = false;
        });
    }

    /**
     * Close modal
     */
    closeModal(modal) {
        modal.classList.remove('active');
        modal.style.transform = '';
    }

    /**
     * Optimize modal forms for mobile
     */
    optimizeModalForms() {
        const modalForms = document.querySelectorAll('.modal form');
        
        modalForms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Prevent zoom on iOS
                if (input.type !== 'file') {
                    input.style.fontSize = '16px';
                }
                
                // Ensure minimum touch target
                input.style.minHeight = '44px';
            });
        });
    }
}

/**
 * Mobile Form Manager
 * Handles mobile-optimized form behavior
 */
class MobileFormManager {
    constructor() {
        this.init();
    }

    /**
     * Initialize mobile form functionality
     */
    init() {
        this.optimizeFormInputs();
        this.setupFormValidation();
        console.log('📝 Mobile Form Manager initialized');
    }

    /**
     * Optimize form inputs for mobile
     */
    optimizeFormInputs() {
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Prevent zoom on iOS
            if (input.type !== 'file') {
                input.style.fontSize = '16px';
            }
            
            // Ensure minimum touch target
            input.style.minHeight = '44px';
            
            // Add focus styles for better UX
            input.addEventListener('focus', () => {
                input.style.boxShadow = '0 0 0 3px rgba(49, 130, 206, 0.1)';
            });
            
            input.addEventListener('blur', () => {
                input.style.boxShadow = '';
            });
        });
    }

    /**
     * Setup mobile-friendly form validation
     */
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const invalidInputs = form.querySelectorAll(':invalid');
                
                if (invalidInputs.length > 0) {
                    e.preventDefault();
                    
                    // Focus first invalid input
                    invalidInputs[0].focus();
                    
                    // Show mobile-friendly error message
                    this.showFormError('Please check the highlighted fields');
                }
            });
        });
    }

    /**
     * Show mobile-friendly error message
     */
    showFormError(message) {
        // Create or update error notification
        let errorDiv = document.querySelector('.mobile-form-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'mobile-form-error';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                background: #e53e3e;
                color: white;
                padding: 16px;
                border-radius: 8px;
                z-index: 9999;
                text-align: center;
                font-weight: 500;
            `;
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }
}

// Initialize mobile managers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile navigation
    window.mobileNav = new MobileNavigationManager();
    
    // Initialize mobile table manager
    window.mobileTable = new MobileTableManager();
    
    // Initialize mobile modal manager
    window.mobileModal = new MobileModalManager();
    
    // Initialize mobile form manager
    window.mobileForm = new MobileFormManager();
    
    console.log('📱 All mobile managers initialized');
});

// Reinitialize mobile navigation when page becomes visible (for SPA navigation)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.mobileNav) {
        console.log('📱 Page became visible, reinitializing mobile navigation');
        window.mobileNav.handleResize();
    }
});

// Reinitialize on window focus (for when user returns to tab)
window.addEventListener('focus', () => {
    if (window.mobileNav) {
        console.log('📱 Window focused, reinitializing mobile navigation');
        window.mobileNav.handleResize();
    }
});

// Export for use in other scripts
window.MobileManagers = {
    Navigation: MobileNavigationManager,
    Table: MobileTableManager,
    Modal: MobileModalManager,
    Form: MobileFormManager
}; 