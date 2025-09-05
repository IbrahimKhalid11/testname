/**
 * Navigation Template Module
 * Provides consistent navigation structure across all pages
 */

class NavigationTemplate {
  constructor() {
    // Standard navigation structure with role-based visibility
    this.navigationItems = [
      {
        id: 'dashboard',
        href: 'index.html',
        icon: 'fas fa-tachometer-alt',
        text: 'Dashboard',
        roles: ['User', 'Manager', 'Admin']
      },
      {
        id: 'reports',
        href: 'reports.html',
        icon: 'fas fa-file-alt',
        text: 'Reports',
        roles: ['User', 'Manager', 'Admin']
      },
      {
        id: 'kpi-data-entry',
        href: 'kpi-data-entry.html',
        icon: 'fas fa-chart-bar',
        text: 'KPI Data Entry',
        roles: ['User', 'Manager', 'Admin']
      },
      {
        id: 'scorecard-designer',
        href: 'scorecard-designer.html',
        icon: 'fas fa-edit',
        text: 'Scorecard Designer',
        roles: ['User', 'Manager', 'Admin'] // All users can access (view only for User role)
      },
      {
        id: 'system-reports',
        href: 'system-reports.html',
        icon: 'fas fa-chart-line',
        text: 'System Reports',
        roles: ['User', 'Manager', 'Admin']
      },
      {
        id: 'calendar',
        href: 'calendar.html',
        icon: 'fas fa-calendar-alt',
        text: 'Calendar',
        roles: ['User', 'Manager', 'Admin']
      },
      {
        id: 'users',
        href: 'users.html',
        icon: 'fas fa-users',
        text: 'User Management',
        roles: ['Admin'] // Only admins can access
      },
      {
        id: 'settings',
        href: 'settings.html',
        icon: 'fas fa-cog',
        text: 'Settings',
        roles: ['Admin'] // Only admins can access
      }
    ];
  }

  /**
   * Generate navigation HTML based on current user role
   * @param {string} currentPage - The current page to mark as active
   * @param {Object} userData - User data (optional, will get from access control)
   * @returns {string} Navigation HTML
   */
  generateNavigation(currentPage, userData = null) {
    if (!userData) {
      // Try to get user data from access control
      if (typeof accessControl !== 'undefined') {
        userData = accessControl.getCurrentUser();
      }
    }

    const userRole = userData ? userData.role : 'User';
    
    let navigationHTML = '<ul>';
    
    this.navigationItems.forEach(item => {
      // Check if user has access to this navigation item
      if (item.roles.includes(userRole)) {
        const isActive = currentPage === item.href;
        const activeClass = isActive ? ' class="active"' : '';
        
        navigationHTML += `
          <li${activeClass}>
            <a href="${item.href}">
              <i class="${item.icon}"></i> ${item.text}
            </a>
          </li>
        `;
      }
    });
    
    navigationHTML += '</ul>';
    return navigationHTML;
  }

  /**
   * Update existing navigation on a page
   * @param {string} currentPage - The current page to mark as active
   * @param {Object} userData - User data (optional)
   */
  updatePageNavigation(currentPage, userData = null) {
    const navElement = document.querySelector('.sidebar-nav');
    if (navElement) {
      const ulElement = navElement.querySelector('ul');
      if (ulElement) {
        ulElement.innerHTML = this.generateNavigation(currentPage, userData);
      }
    }
  }

  /**
   * Get the standard sidebar header HTML
   * @returns {string} Sidebar header HTML
   */
  getSidebarHeader() {
    return `
      <div class="sidebar-header">
        <i class="fas fa-file-alt"></i>
        <h2>IRAVIN REPORTS</h2>
      </div>
    `;
  }

  /**
   * Get the standard sidebar footer HTML
   * @returns {string} Sidebar footer HTML
   */
  getSidebarFooter() {
    return `
      <div class="sidebar-footer">
        <a href="login.html" class="logout-btn">
          <i class="fas fa-sign-out-alt"></i> Logout
        </a>
      </div>
    `;
  }

  /**
   * Get the complete sidebar HTML
   * @param {string} currentPage - The current page to mark as active
   * @param {Object} userData - User data (optional)
   * @returns {string} Complete sidebar HTML
   */
  getCompleteSidebar(currentPage, userData = null) {
    return `
      <aside class="sidebar">
        ${this.getSidebarHeader()}
        <nav class="sidebar-nav">
          ${this.generateNavigation(currentPage, userData)}
        </nav>
        ${this.getSidebarFooter()}
      </aside>
    `;
  }
}

// Create global instance
const navigationTemplate = new NavigationTemplate();

// Auto-update navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Small delay to ensure access control is initialized
  setTimeout(() => {
    if (typeof accessControl !== 'undefined') {
      const userData = accessControl.getCurrentUser();
      navigationTemplate.updatePageNavigation(currentPage, userData);
    }
  }, 200);
}); 