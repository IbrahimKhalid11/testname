/**
 * Access Control Module
 * Centralized page access control based on user roles
 */

class AccessControl {
  constructor() {
    // Define page access permissions for each role
    this.pagePermissions = {
      // User role can access these pages
      'User': [
        'index.html',           // Dashboard
        'reports.html',         // Reports
        'kpi-data-entry.html',  // KPI Data Entry
        'system-reports.html',  // System Reports
        'calendar.html',        // Calendar
        'report-history.html',  // Report History
        'scorecard-designer.html' // Scorecard Designer (view only)
      ],
      
      // Manager role can access User pages + additional pages
      'Manager': [
        'index.html',           // Dashboard
        'reports.html',         // Reports
        'kpi-data-entry.html',  // KPI Data Entry
        'system-reports.html',  // System Reports
        'calendar.html',        // Calendar
        'report-history.html',  // Report History
        'scorecard-designer.html' // Scorecard Designer
      ],
      
      // Admin role can access all pages
      'Admin': [
        'index.html',           // Dashboard
        'reports.html',         // Reports
        'kpi-data-entry.html',  // KPI Data Entry
        'system-reports.html',  // System Reports
        'calendar.html',        // Calendar
        'report-history.html',  // Report History
        'scorecard-designer.html', // Scorecard Designer
        'settings.html',        // Settings
        'users.html',           // User Management
        'departments.html'      // Departments
      ]
    };

    // Define navigation menu items and their visibility
    this.navigationItems = {
      'Dashboard': { page: 'index.html', roles: ['User', 'Manager', 'Admin'] },
      'Reports': { page: 'reports.html', roles: ['User', 'Manager', 'Admin'] },
      'KPI Data Entry': { page: 'kpi-data-entry.html', roles: ['User', 'Manager', 'Admin'] },
      'Scorecard Designer': { page: 'scorecard-designer.html', roles: ['User', 'Manager', 'Admin'] },
      'System Reports': { page: 'system-reports.html', roles: ['User', 'Manager', 'Admin'] },
      'Calendar': { page: 'calendar.html', roles: ['User', 'Manager', 'Admin'] },
      'User Management': { page: 'users.html', roles: ['Admin'] },
      'Settings': { page: 'settings.html', roles: ['Admin'] }
    };
  }

  /**
   * Get current user data from available sources
   * @returns {Object|null} User data or null if not found
   */
  getCurrentUser() {
    // Try Supabase auth first
    if (typeof supabaseAuth !== 'undefined' && supabaseAuth.getUserData) {
      const userData = supabaseAuth.getUserData();
      if (userData) return userData;
    }

    // Try local DB
    if (typeof DB !== 'undefined' && DB.getCurrentUser) {
      const userData = DB.getCurrentUser();
      if (userData) return userData;
    }

    // Try localStorage
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        return JSON.parse(userDataStr);
      } catch (e) {
        console.warn('Failed to parse user data from localStorage:', e);
      }
    }

    return null;
  }

  /**
   * Check if user can access a specific page
   * @param {string} pageName - The page to check access for
   * @param {Object} userData - User data (optional, will get current user if not provided)
   * @returns {boolean} True if user can access the page
   */
  canAccessPage(pageName, userData = null) {
    if (!userData) {
      userData = this.getCurrentUser();
    }

    if (!userData) {
      console.warn('No user data found for page access check');
      return false;
    }

    const userRole = userData.role || 'User';
    const allowedPages = this.pagePermissions[userRole] || [];

    // Check if page is in allowed pages for user's role
    const hasAccess = allowedPages.includes(pageName);
    
    console.log(`Access check for ${pageName}: User ${userData.name} (${userRole}) - ${hasAccess ? 'ALLOWED' : 'DENIED'}`);
    
    return hasAccess;
  }

  /**
   * Check if user can access current page and redirect if not
   * @param {string} redirectPage - Page to redirect to if access denied (default: index.html)
   * @returns {boolean} True if user can access current page
   */
  checkCurrentPageAccess(redirectPage = 'index.html') {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const userData = this.getCurrentUser();

    // Allow access to login and signup pages without authentication
    if (currentPage === 'login.html' || currentPage === 'signup.html' || currentPage === 'login-with-supabase.html' || currentPage === 'login-supabase.html') {
      console.log(`Allowing access to ${currentPage} (authentication page)`);
      return true;
    }

    // Allow access to test pages
    if (currentPage.startsWith('test-')) {
      console.log(`Allowing access to ${currentPage} (test page)`);
      return true;
    }

    if (!userData) {
      console.warn('No user data found, redirecting to login');
      window.location.href = 'login.html';
      return false;
    }

    if (!this.canAccessPage(currentPage, userData)) {
      console.warn(`Access denied to ${currentPage} for user ${userData.name} (${userData.role})`);
      
      // Use showNotification if available, otherwise use alert
      if (typeof showNotification === 'function') {
        showNotification(`You don't have permission to access this page. Redirecting to ${redirectPage}`, 'warning');
      } else {
        alert(`You don't have permission to access this page. Redirecting to ${redirectPage}`);
      }
      
      window.location.href = redirectPage;
      return false;
    }

    return true;
  }

  /**
   * Update navigation menu visibility based on user role
   * @param {Object} userData - User data (optional, will get current user if not provided)
   */
  updateNavigationVisibility(userData = null) {
    if (!userData) {
      userData = this.getCurrentUser();
    }

    if (!userData) {
      console.warn('No user data found for navigation update');
      return;
    }

    const userRole = userData.role || 'User';
    console.log(`Updating navigation for user ${userData.name} (${userRole})`);

    // Use navigation template if available
    if (typeof navigationTemplate !== 'undefined') {
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      navigationTemplate.updatePageNavigation(currentPage, userData);
      return;
    }

    // Fallback to manual navigation update
    const navLinks = document.querySelectorAll('.sidebar-nav ul li a');
    
    navLinks.forEach(link => {
      const linkText = link.textContent.trim();
      const navItem = this.navigationItems[linkText];
      
      if (navItem) {
        const hasAccess = navItem.roles.includes(userRole);
        const listItem = link.closest('li');
        
        if (hasAccess) {
          listItem.style.display = '';
          listItem.classList.remove('hidden');
        } else {
          listItem.style.display = 'none';
          listItem.classList.add('hidden');
        }
      }
    });
  }

  /**
   * Get all pages that a user can access
   * @param {Object} userData - User data (optional, will get current user if not provided)
   * @returns {Array} Array of page names the user can access
   */
  getUserAccessiblePages(userData = null) {
    if (!userData) {
      userData = this.getCurrentUser();
    }

    if (!userData) {
      return [];
    }

    const userRole = userData.role || 'User';
    return this.pagePermissions[userRole] || [];
  }

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check for
   * @param {Object} userData - User data (optional, will get current user if not provided)
   * @returns {boolean} True if user has the specified role
   */
  hasRole(role, userData = null) {
    if (!userData) {
      userData = this.getCurrentUser();
    }

    if (!userData) {
      return false;
    }

    return userData.role === role;
  }

  /**
   * Check if user is admin
   * @param {Object} userData - User data (optional, will get current user if not provided)
   * @returns {boolean} True if user is admin
   */
  isAdmin(userData = null) {
    return this.hasRole('Admin', userData);
  }

  /**
   * Check if user is manager or admin
   * @param {Object} userData - User data (optional, will get current user if not provided)
   * @returns {boolean} True if user is manager or admin
   */
  isManagerOrAdmin(userData = null) {
    if (!userData) {
      userData = this.getCurrentUser();
    }

    if (!userData) {
      return false;
    }

    return userData.role === 'Manager' || userData.role === 'Admin';
  }

  /**
   * Check if user can perform actions (add/edit/delete) on scorecard designer
   * Only Admin role can perform actions
   * @param {Object} userData - User data (optional, will get current user if not provided)
   * @returns {boolean} True if user can perform actions
   */
  canPerformScorecardActions(userData = null) {
    return this.isAdmin(userData);
  }

  /**
   * Initialize access control for the current page
   * This should be called on every page load
   */
  init() {
    console.log('Initializing access control...');
    
    // Check current page access
    this.checkCurrentPageAccess();
    
    // Update navigation visibility
    this.updateNavigationVisibility();
    
    console.log('Access control initialized');
  }
}

// Create global instance
const accessControl = new AccessControl();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure auth systems are initialized
  setTimeout(() => {
    accessControl.init();
  }, 100);
}); 