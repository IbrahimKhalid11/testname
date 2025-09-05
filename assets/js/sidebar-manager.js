// Sidebar Manager - Global functionality for auto-hiding sidebar
class SidebarManager {
    constructor() {
        this.sidebarCollapsed = false;
        this.sidebarAutoHideTimer = null;
        this.autoHideDelay = 3000; // 3 seconds
        this.init();
    }
    
    init() {
        // Restore sidebar state from localStorage
        this.restoreSidebarState();
        
        // Add event listeners for auto-hide functionality
        this.addEventListeners();
        
        // Start auto-hide timer if sidebar is visible
        if (!this.sidebarCollapsed) {
            this.startAutoHideTimer();
        }
    }
    
    restoreSidebarState() {
        const savedSidebarState = localStorage.getItem('sidebarCollapsed');
        if (savedSidebarState === 'true') {
            this.sidebarCollapsed = true;
            this.applySidebarState();
        }
    }
    
    applySidebarState() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const toggleBtn = document.getElementById('sidebar-toggle');
        
        if (sidebar && mainContent && toggleBtn) {
            if (this.sidebarCollapsed) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
                toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
            } else {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded');
                toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
            }
        }
    }
    
    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.applySidebarState();
        
        // Save state to localStorage
        localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
        
        // Start or stop auto-hide timer
        if (this.sidebarCollapsed) {
            this.stopAutoHideTimer();
        } else {
            this.startAutoHideTimer();
        }
    }
    
    startAutoHideTimer() {
        this.stopAutoHideTimer();
        this.sidebarAutoHideTimer = setTimeout(() => {
            if (!this.sidebarCollapsed) {
                this.toggleSidebar();
            }
        }, this.autoHideDelay);
    }
    
    stopAutoHideTimer() {
        if (this.sidebarAutoHideTimer) {
            clearTimeout(this.sidebarAutoHideTimer);
            this.sidebarAutoHideTimer = null;
        }
    }
    
    resetAutoHideTimer() {
        if (!this.sidebarCollapsed) {
            this.startAutoHideTimer();
        }
    }
    
    addEventListeners() {
        // Reset timer on user activity
        document.addEventListener('mousemove', () => this.resetAutoHideTimer());
        document.addEventListener('click', () => this.resetAutoHideTimer());
        document.addEventListener('keydown', () => this.resetAutoHideTimer());
        document.addEventListener('scroll', () => this.resetAutoHideTimer());
        
        // Pause timer when hovering over sidebar
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.addEventListener('mouseenter', () => this.stopAutoHideTimer());
            sidebar.addEventListener('mouseleave', () => this.resetAutoHideTimer());
        }
    }
}

// Global function for onclick handlers
function toggleSidebar() {
    if (window.sidebarManager) {
        window.sidebarManager.toggleSidebar();
    }
}

// Initialize sidebar manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.sidebarManager = new SidebarManager();
}); 