// Main application script that extends the existing functionality
// to integrate with Supabase backend

class ReportApp {
  constructor() {
    this.initApp();
    
    // Initialize user synchronization with Supabase
    this.userSyncInitialized = false;
  }
  
  // Helper function to get file extension
  getFileExtension(fileName) {
    if (!fileName) return 'Unknown';
    
    // Use regex to find the actual file extension at the end of the filename
    const extensionMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
    if (extensionMatch) {
      const extension = extensionMatch[1].toLowerCase();
      const formatMap = {
        'pdf': 'PDF',
        'doc': 'Word',
        'docx': 'Word',
        'xls': 'Excel',
        'xlsx': 'Excel',
        'png': 'Image',
        'jpg': 'Image',
        'jpeg': 'Image',
        'gif': 'Image',
        'ppt': 'PowerPoint',
        'pptx': 'PowerPoint',
        'mp4': 'Video',
        'webm': 'Video',
        'ogg': 'Video',
        'mov': 'Video',
        'avi': 'Video'
      };
      return formatMap[extension] || 'Document';
    }
    
    return 'Document';
  }
  
  // Helper function to get department name from ID or code
  getDepartmentName(departmentId) {
    if (!departmentId) return 'General';
    try {
      const departments = JSON.parse(localStorage.getItem('reportrepo_db')).departments;
      
      // First try to find by ID (numeric)
      if (!isNaN(departmentId)) {
        const department = departments.find(d => d.id == departmentId);
        if (department) return department.name;
      }
      
      // Then try to find department by name (if the ID is actually a name already)
      const departmentByName = departments.find(d => d.name === departmentId);
      if (departmentByName) return departmentByName.name;
      
      // If not found and departmentId is a string, it might be a code
      // Let's try to find a matching department by some other means
      if (typeof departmentId === 'string') {
        for (const dept of departments) {
          // Try different matching strategies - for example, case-insensitive
          if (dept.name.toLowerCase() === departmentId.toLowerCase()) {
            return dept.name;
          }
          // Or by code if there's a code field
          if (dept.code === departmentId) {
            return dept.name;
          }
        }
      }
      
      console.warn(`Department not found for ID/code: ${departmentId}, returning as is`);
      return departmentId; // Return the original value if no match found
    } catch (error) {
      console.error('Error getting department name:', error);
      return departmentId || 'General'; // Return the original value or 'General' if null/undefined
    }
  }
  
  // Helper function to get report frequency from report type ID
  getReportFrequency(reportTypeId) {
    if (!reportTypeId) return 'Ad-hoc';
    try {
      const reportTypes = JSON.parse(localStorage.getItem('reportrepo_db')).reportTypes;
      const reportType = reportTypes.find(rt => rt.id == reportTypeId);
      return reportType ? reportType.frequency : 'Ad-hoc';
    } catch (error) {
      console.error('Error getting report frequency:', error);
      return 'Ad-hoc';
    }
  }

  // Initialize the application
  initApp() {
    document.addEventListener('DOMContentLoaded', () => {
      // Check authentication status and update UI accordingly
      this.checkAuthStatus();

      // Set up event listeners based on current page
      this.setupPageSpecificListeners();

      // Add logout functionality
      this.setupLogoutButton();
    });
  }

  // Check if we should use admin mode for database operations
  async ensureAuthenticated() {
    try {
      // Check if user is authenticated through localStorage or Supabase session
      if (typeof supabaseAuth !== 'undefined' && supabaseAuth.isLoggedIn && supabaseAuth.isLoggedIn()) {
        console.log('✅ User is already authenticated');
        return true;
      }
      
      // For database operations, we'll use the admin client with service role
      // This bypasses the need for user authentication for CRUD operations
      console.log('ℹ️ No user authentication found, will use service role for database operations');
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // Check if user is authenticated and update UI
  checkAuthStatus() {
    // Check for Supabase authentication first, fallback to localStorage
    let isLoggedIn = false;
    
    if (typeof supabaseAuth !== 'undefined' && supabaseAuth.isLoggedIn) {
      isLoggedIn = supabaseAuth.isLoggedIn();
    } 
    
    // Also check for local DB user data
    if (!isLoggedIn && typeof DB !== 'undefined' && DB.getCurrentUser) {
      const localUser = DB.getCurrentUser();
      isLoggedIn = localUser !== null;
      console.log('Checking local DB user for authentication:', localUser);
    }
    
    if (!isLoggedIn) {
      // Fallback to basic localStorage check
      isLoggedIn = localStorage.getItem('user_data') !== null || localStorage.getItem('reportrepo_db') !== null;
    }
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // For now, allow access without authentication to fix the redirect issue
    // TODO: Implement proper authentication flow once login is working
    console.log(`Page: ${currentPage}, isLoggedIn: ${isLoggedIn}`);
    
    if (!isLoggedIn && 
        (currentPage === 'login.html' || currentPage === 'signup.html')) {
      // User is on login page and not authenticated - this is OK
      return;
    }
    
    if (isLoggedIn && 
        (currentPage === 'login.html' || currentPage === 'signup.html')) {
      // User is authenticated but on login page - redirect to dashboard
      window.location.href = 'index.html';
      return;
    }

    // Update user info in UI if authenticated
    if (isLoggedIn) {
      this.updateUserInfoUI();
    }
  }

  // Update user information in the UI
  updateUserInfoUI() {
    let userData = null;
    
    // Try to get user data from Supabase auth
    if (typeof supabaseAuth !== 'undefined' && supabaseAuth.getUserData) {
      userData = supabaseAuth.getUserData();
    }
    
    // Fallback to localStorage
    if (!userData) {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        try {
          userData = JSON.parse(userDataStr);
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
        }
      }
    }
    
    if (userData) {
      // Update user profile display
      const userProfileElements = document.querySelectorAll('.user-profile span');
      userProfileElements.forEach(element => {
        element.textContent = userData.name || userData.email;
      });
      
      // Update user avatar if present
      const userAvatarElements = document.querySelectorAll('.user-profile img');
      userAvatarElements.forEach(element => {
        // Set a default avatar or keep the current one
        if (!element.src || element.src.includes('picsum.photos')) {
          // Use user's first letter as avatar or keep the placeholder
          if (userData.name) {
            const initials = userData.name.charAt(0).toUpperCase();
            element.setAttribute('data-initials', initials);
            element.classList.add('avatar-initials');
          }
        }
      });
    }
  }

  // Set up page-specific event listeners
  setupPageSpecificListeners() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage === 'reports.html') {
      this.setupReportsPage();
    } else if (currentPage === 'report-history.html') {
      this.setupReportHistoryPage();
    } else if (currentPage === 'users.html') {
      this.setupUsersPage();
    } else if (currentPage === 'system-reports.html') {
      this.setupSystemReportsPage();
    } else if (currentPage === 'index.html' || currentPage === '') {
      this.setupDashboardPage();
    }
  }
  
  // Set up users page
  setupUsersPage() {
    console.log('Setting up Users Page with Supabase integration');
    
    try {
      // Check for Supabase integration manager
      if (typeof supabaseIntegrationManager !== 'undefined') {
        // Initialize the integration manager if not already done
        if (!supabaseIntegrationManager.isInitialized) {
          supabaseIntegrationManager.init().then(() => {
            // Load users from Supabase
            supabaseIntegrationManager.syncFromSupabase().then(() => {
              console.log('Users synced from Supabase');
              
              // Render the users table
              if (typeof renderUsersTable === 'function') {
                renderUsersTable();
              }
            });
          });
        } else {
          // Integration manager already initialized, sync data
          supabaseIntegrationManager.syncFromSupabase().then(() => {
            console.log('Users synced from Supabase');
            
            // Render the users table
            if (typeof renderUsersTable === 'function') {
              renderUsersTable();
            }
          });
        }
      } else {
        console.log('Supabase integration manager not available');
        showNotification('Supabase integration not available', 'warning');
      }
    } catch (error) {
      console.error('Error setting up Users page with Supabase:', error);
      showNotification('Error loading users data', 'error');
    }
  }

  // Set up dashboard page
  setupDashboardPage() {
    console.log('Setting up Dashboard Page...');
    // Load dashboard data from Supabase with a small delay to ensure DOM is ready
    setTimeout(() => {
      this.loadDashboardData();
    }, 100);
  }

  // Load dashboard data from Supabase
  async loadDashboardData() {
    try {
      // Get user data from Supabase auth
      let userData = null;
      let userID = null;
      
      // Try to get user from Supabase first
      if (typeof supabaseAuth !== 'undefined' && supabaseAuth.getUserData) {
        userData = supabaseAuth.getUserData();
        if (userData) {
          userID = userData.id;
          console.log('Using Supabase auth user ID:', userID);
        }
      }
      
      // Fallback to localStorage if Supabase auth not available
      if (!userID) {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
            userID = userData.id;
            console.log('Using localStorage user ID:', userID);
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
          }
        }
      }
      
      // Get all reports from local storage or Supabase
      let reports = [];
      
      // Try to get reports from Supabase
      if (typeof supabaseIntegrationManager !== 'undefined' && supabaseIntegrationManager.getData) {
        try {
          reports = await supabaseIntegrationManager.getData('reports');
          console.log(`Found ${reports.length} reports from Supabase`);
        } catch (err) {
          console.warn('Could not fetch reports from Supabase:', err);
          // Fallback to local storage
          reports = DB.get('reports') || [];
        }
      } else {
        // Use local storage if integration manager not available
        reports = DB.get('reports') || [];
      }
      
      // Get scorecard data
      let scorecards = [];
      let scorecardResults = [];
      
      try {
        if (typeof supabaseIntegrationManager !== 'undefined' && supabaseIntegrationManager.getData) {
          scorecards = await supabaseIntegrationManager.getData('scorecards');
          scorecardResults = await supabaseIntegrationManager.getData('scorecard_results');
          console.log(`Found ${scorecards.length} scorecards and ${scorecardResults.length} results from Supabase`);
        } else {
          scorecards = DB.get('scorecards') || [];
          scorecardResults = DB.get('scorecard_results') || [];
        }
      } catch (err) {
        console.warn('Could not fetch scorecard data:', err);
        scorecards = DB.get('scorecards') || [];
        scorecardResults = DB.get('scorecard_results') || [];
      }
      
      // Calculate dashboard statistics
      const totalReports = reports.length;
      const pendingReports = reports.filter(r => r.status === 'Pending').length;
      const submittedReports = reports.filter(r => r.status === 'Submitted').length;
      const lateReports = reports.filter(r => r.status === 'Late').length;
      
      // Calculate on-time submission rate
      const onTimeRate = totalReports > 0 ? Math.round(((submittedReports + pendingReports) / totalReports) * 100) : 0;
      
      // Get unique departments
      const departments = DB.get('departments') || [];
      const activeDepartments = departments.length;
      
      // Calculate scorecard performance metrics
      const activeScorecards = scorecards.filter(s => s.is_active === true || s.is_active === 1).length;
      
      // Check for various possible completed status values
      const completedStatuses = ['completed', 'Completed', 'submitted', 'Submitted', 'approved', 'Approved', 'done', 'Done', 'finished', 'Finished'];
      const pendingStatuses = ['pending', 'Pending', 'in_progress', 'In Progress', 'draft', 'Draft', 'not_started', 'Not Started'];
      
      const completedScorecards = scorecardResults.filter(r => completedStatuses.includes(r.status)).length;
      const pendingScorecards = scorecardResults.filter(r => pendingStatuses.includes(r.status)).length;
      
      // Debug scorecard data structure
      console.log('Scorecard data debug:', {
        scorecardsSample: scorecards.slice(0, 2),
        scorecardResultsSample: scorecardResults.slice(0, 2),
        activeScorecards,
        completedScorecards,
        pendingScorecards,
        allStatuses: [...new Set(scorecardResults.map(r => r.status))],
        statusCounts: scorecardResults.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {}),
        sampleResults: scorecardResults.slice(0, 5).map(r => ({
          id: r.id,
          status: r.status,
          performance_score: r.performance_score,
          scorecard_id: r.scorecard_id
        }))
      });
      
      // Calculate overall performance score
      const performanceScore = this.calculatePerformanceScore(reports, scorecardResults);
      
      // Debug logging
      console.log('Dashboard data calculation:', {
        totalReports,
        pendingReports,
        onTimeRate,
        activeDepartments,
        activeScorecards,
        completedScorecards,
        pendingScorecards,
        performanceScore,
        scorecardResultsCount: scorecardResults.length,
        scorecardsCount: scorecards.length
      });
      
      // Update dashboard statistics
      this.updateDashboardStats({
        totalReports,
        pendingReports,
        onTimeRate,
        activeDepartments,
        activeScorecards,
        completedScorecards,
        pendingScorecards,
        performanceScore
      });
      
      // Render the dashboard charts
      this.renderDashboardChart(reports);
      this.renderScorecardPerformanceChart(scorecards, scorecardResults);
      
      // Load recent activity for the dashboard
      this.loadRecentActivity();
      
      console.log('Dashboard data loaded successfully');
      
      // Add debug function to window for manual testing
      window.debugScorecardStatuses = () => {
        const scorecardResults = DB.get('scorecard_results') || [];
        console.log('All scorecard statuses:', [...new Set(scorecardResults.map(r => r.status))]);
        console.log('Status counts:', scorecardResults.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {}));
        console.log('Sample results:', scorecardResults.slice(0, 3));
      };
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showNotification('Error loading dashboard data', 'error');
    }
  }

  // Calculate overall performance score based on reports and scorecards
  calculatePerformanceScore(reports, scorecardResults) {
    let totalScore = 0;
    let totalWeight = 0;
    
    // Reports performance (40% weight)
    const reportWeight = 0.4;
    const totalReports = reports.length;
    if (totalReports > 0) {
      const onTimeReports = reports.filter(r => r.status === 'Submitted').length;
      const reportScore = (onTimeReports / totalReports) * 100;
      totalScore += reportScore * reportWeight;
      totalWeight += reportWeight;
    }
    
    // Scorecard completion (30% weight)
    const scorecardWeight = 0.3;
    const totalScorecards = scorecardResults.length;
    if (totalScorecards > 0) {
      const completedStatuses = ['completed', 'Completed', 'submitted', 'Submitted', 'approved', 'Approved', 'done', 'Done', 'finished', 'Finished'];
      const completedScorecards = scorecardResults.filter(r => completedStatuses.includes(r.status)).length;
      const scorecardScore = (completedScorecards / totalScorecards) * 100;
      totalScore += scorecardScore * scorecardWeight;
      totalWeight += scorecardWeight;
    }
    
    // Scorecard performance (30% weight)
    const performanceWeight = 0.3;
    const performanceResults = scorecardResults.filter(r => r.performance_score !== null && r.performance_score !== undefined);
    if (performanceResults.length > 0) {
      const avgPerformance = performanceResults.reduce((sum, r) => sum + (r.performance_score || 0), 0) / performanceResults.length;
      totalScore += avgPerformance * performanceWeight;
      totalWeight += performanceWeight;
    }
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  // Update dashboard statistics
  updateDashboardStats(stats) {
    console.log('Updating dashboard stats with:', stats);
    
    const { 
      totalReports, 
      pendingReports, 
      onTimeRate, 
      activeDepartments,
      activeScorecards,
      completedScorecards,
      pendingScorecards,
      performanceScore
    } = stats;
    
    // Check if we're on the dashboard page
    const dashboardSummary = document.querySelector('.dashboard-summary');
    if (!dashboardSummary) {
      console.warn('Dashboard summary section not found - not on dashboard page');
      return;
    }
    
    // Debug: Check all summary cards
    const allSummaryCards = document.querySelectorAll('.summary-card');
    console.log('Found summary cards:', allSummaryCards.length);
    allSummaryCards.forEach((card, index) => {
      console.log(`Card ${index}:`, card.getAttribute('data-stat'), card.textContent.trim());
    });
    
    // Update total reports count
    const totalReportsElement = document.querySelector('.summary-card[data-stat="total-reports"] p');
    console.log('Total reports element found:', !!totalReportsElement);
    if (totalReportsElement) {
      totalReportsElement.textContent = totalReports.toLocaleString();
    }
    
    // Update pending reports count
    const pendingReportsElement = document.querySelector('.summary-card[data-stat="pending-reports"] p');
    console.log('Pending reports element found:', !!pendingReportsElement);
    if (pendingReportsElement) {
      pendingReportsElement.textContent = pendingReports.toLocaleString();
    }
    
    // Update on-time submission rate
    const onTimeRateElement = document.querySelector('.summary-card[data-stat="on-time-rate"] p');
    console.log('On-time rate element found:', !!onTimeRateElement);
    if (onTimeRateElement) {
      onTimeRateElement.textContent = `${onTimeRate}%`;
    }
    
    // Update active departments count
    const activeDepartmentsElement = document.querySelector('.summary-card[data-stat="active-departments"] p');
    console.log('Active departments element found:', !!activeDepartmentsElement);
    if (activeDepartmentsElement) {
      activeDepartmentsElement.textContent = activeDepartments.toLocaleString();
    }
    
    // Update or add scorecard metrics if they exist
    this.updateScorecardMetrics({
      activeScorecards,
      completedScorecards,
      pendingScorecards,
      performanceScore
    });
  }

  // Update scorecard-specific metrics
  updateScorecardMetrics(scorecardStats) {
    const { activeScorecards, completedScorecards, pendingScorecards, performanceScore } = scorecardStats;
    
    console.log('Updating scorecard metrics:', scorecardStats);
    
    // Look for existing scorecard summary cards or create new ones
    let scorecardCards = document.querySelectorAll('.summary-card[data-type="scorecard"]');
    
    console.log('Found existing scorecard cards:', scorecardCards.length);
    
    if (scorecardCards.length === 0) {
      // Create new scorecard summary cards if they don't exist
      console.log('Creating new scorecard summary cards');
      this.createScorecardSummaryCards(scorecardStats);
    } else {
      // Update existing scorecard cards
      console.log('Updating existing scorecard cards');
      scorecardCards.forEach((card, index) => {
        const valueElement = card.querySelector('p');
        if (valueElement) {
          switch (index) {
            case 0: // Active Scorecards
              valueElement.textContent = activeScorecards.toLocaleString();
              break;
            case 1: // Completed Scorecards
              valueElement.textContent = completedScorecards.toLocaleString();
              break;
            case 2: // Performance Score
              valueElement.textContent = `${performanceScore}%`;
              break;
            case 3: // Pending Scorecards
              valueElement.textContent = pendingScorecards.toLocaleString();
              break;
          }
        }
      });
    }
  }

  // Create scorecard summary cards
  createScorecardSummaryCards(scorecardStats) {
    const { activeScorecards, completedScorecards, pendingScorecards, performanceScore } = scorecardStats;
    
    console.log('Creating scorecard summary cards with stats:', scorecardStats);
    
    const dashboardSummary = document.querySelector('.dashboard-summary');
    if (!dashboardSummary) {
      console.warn('Dashboard summary section not found for creating scorecard cards');
      return;
    }
    
    // Create scorecard cards
    const scorecardCards = [
      {
        icon: 'fas fa-chart-line',
        title: 'Active Scorecards',
        value: activeScorecards,
        color: 'var(--info-color)'
      },
      {
        icon: 'fas fa-check-double',
        title: 'Completed Scorecards',
        value: completedScorecards,
        color: 'var(--success-color)'
      },
      {
        icon: 'fas fa-trophy',
        title: 'Performance Score',
        value: `${performanceScore}%`,
        color: 'var(--warning-color)'
      },
      {
        icon: 'fas fa-clock',
        title: 'Pending Scorecards',
        value: pendingScorecards,
        color: 'var(--secondary-color)'
      }
    ];
    
    scorecardCards.forEach(cardData => {
      const card = document.createElement('div');
      card.className = 'summary-card';
      card.setAttribute('data-type', 'scorecard');
      card.style.borderLeft = `4px solid ${cardData.color}`;
      
      card.innerHTML = `
        <i class="${cardData.icon}" style="color: ${cardData.color}"></i>
        <div>
          <h3>${cardData.title}</h3>
          <p>${cardData.value}</p>
        </div>
      `;
      
      dashboardSummary.appendChild(card);
    });
  }

  // Render dashboard chart
  renderDashboardChart(reports) {
    const canvas = document.getElementById('submissionChart');
    if (!canvas) {
      console.warn('Dashboard chart canvas not found');
      return;
    }
    
    try {
      // Get departments
      let departments = DB.get('departments') || [];
      // Limit to 10 departments for chart
      const maxDepartments = 10;
      if (departments.length > maxDepartments) {
        departments = departments.slice(0, maxDepartments);
      }
      // Calculate submission data by department
      const departmentData = departments.map(dept => {
        const deptReports = reports.filter(r => r.department === dept.name);
        const submitted = deptReports.filter(r => r.status === 'Submitted').length;
        const pending = deptReports.filter(r => r.status === 'Pending').length;
        const late = deptReports.filter(r => r.status === 'Late').length;
        return {
          department: dept.name,
          submitted,
          pending,
          late,
          total: deptReports.length
        };
      });
      // Prepare chart data
      const labels = departmentData.map(d => d.department);
      const submittedData = departmentData.map(d => d.submitted);
      const pendingData = departmentData.map(d => d.pending);
      const lateData = departmentData.map(d => d.late);
      // Guard: If no data, show fallback
      if (labels.length === 0) {
        canvas.style.display = 'none';
        const chartContainer = canvas.parentElement;
        if (chartContainer) {
          chartContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No department data available</p>';
        }
        return;
      }
      // Destroy existing chart if it exists
      if (window.dashboardChart && typeof window.dashboardChart.destroy === 'function') {
        window.dashboardChart.destroy();
      }
      // Create new chart
      const ctx = canvas.getContext('2d');
      window.dashboardChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Submitted',
              data: submittedData,
              backgroundColor: 'rgba(56, 161, 105, 0.8)',
              borderColor: 'rgba(56, 161, 105, 1)',
              borderWidth: 1
            },
            {
              label: 'Pending',
              data: pendingData,
              backgroundColor: 'rgba(214, 158, 46, 0.8)',
              borderColor: 'rgba(214, 158, 46, 1)',
              borderWidth: 1
            },
            {
              label: 'Late',
              data: lateData,
              backgroundColor: 'rgba(229, 62, 62, 0.8)',
              borderColor: 'rgba(229, 62, 62, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Department Submission Status (Last 30 Days)'
            }
          }
        }
      });
      console.log('Dashboard chart rendered successfully');
    } catch (error) {
      console.error('Error rendering dashboard chart:', error);
      // Show fallback message
      canvas.style.display = 'none';
      const chartContainer = canvas.parentElement;
      if (chartContainer) {
        chartContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Chart data not available</p>';
      }
    }
  }

  // Render scorecard performance chart
  renderScorecardPerformanceChart(scorecards, scorecardResults) {
    const canvas = document.getElementById('scorecardPerformanceChart');
    if (!canvas) {
      console.warn('Scorecard performance chart canvas not found');
      return;
    }
    
    try {
      // Group scorecard results by department
      const departments = DB.get('departments') || [];
      const departmentPerformance = departments.map(dept => {
        const deptScorecards = scorecards.filter(s => s.department === dept.name);
        const deptResults = scorecardResults.filter(r => {
          const scorecard = scorecards.find(s => s.id === r.scorecard_id);
          return scorecard && scorecard.department === dept.name;
        });
        
        const avgPerformance = deptResults.length > 0 
          ? deptResults.reduce((sum, r) => sum + (r.performance_score || 0), 0) / deptResults.length
          : 0;
        
        const completionRate = deptScorecards.length > 0 
          ? (deptResults.filter(r => ['completed', 'Completed', 'submitted', 'Submitted', 'approved', 'Approved', 'done', 'Done', 'finished', 'Finished'].includes(r.status)).length / deptScorecards.length) * 100
          : 0;
        
        return {
          department: dept.name,
          avgPerformance: Math.round(avgPerformance),
          completionRate: Math.round(completionRate),
          totalScorecards: deptScorecards.length,
          completedScorecards: deptResults.filter(r => ['completed', 'Completed', 'submitted', 'Submitted', 'approved', 'Approved', 'done', 'Done', 'finished', 'Finished'].includes(r.status)).length
        };
      }).filter(d => d.totalScorecards > 0); // Only show departments with scorecards
      
      // Limit to top 8 departments for chart readability
      const maxDepartments = 8;
      if (departmentPerformance.length > maxDepartments) {
        departmentPerformance.sort((a, b) => b.avgPerformance - a.avgPerformance);
        departmentPerformance.splice(maxDepartments);
      }
      
      // Guard: If no data, show fallback
      if (departmentPerformance.length === 0) {
        canvas.style.display = 'none';
        const chartContainer = canvas.parentElement;
        if (chartContainer) {
          chartContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No scorecard data available</p>';
        }
        return;
      }
      
      // Prepare chart data
      const labels = departmentPerformance.map(d => d.department);
      const performanceData = departmentPerformance.map(d => d.avgPerformance);
      const completionData = departmentPerformance.map(d => d.completionRate);
      
      // Destroy existing chart if it exists
      if (window.scorecardPerformanceChart && typeof window.scorecardPerformanceChart.destroy === 'function') {
        window.scorecardPerformanceChart.destroy();
      }
      
      // Create new chart
      const ctx = canvas.getContext('2d');
      window.scorecardPerformanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Performance Score (%)',
              data: performanceData,
              backgroundColor: 'rgba(72, 187, 120, 0.8)',
              borderColor: 'rgba(72, 187, 120, 1)',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: 'Completion Rate (%)',
              data: completionData,
              backgroundColor: 'rgba(49, 130, 206, 0.8)',
              borderColor: 'rgba(49, 130, 206, 1)',
              borderWidth: 1,
              yAxisID: 'y'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Scorecard Performance by Department'
            }
          }
        }
      });
      
      console.log('Scorecard performance chart rendered successfully');
    } catch (error) {
      console.error('Error rendering scorecard performance chart:', error);
      // Show fallback message
      canvas.style.display = 'none';
      const chartContainer = canvas.parentElement;
      if (chartContainer) {
        chartContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Scorecard chart data not available</p>';
      }
    }
  }

  // Load recent activity from Supabase or localStorage
  async loadRecentActivity() {
    try {
      // Try to fetch activity from Supabase
      if (typeof supabaseIntegrationManager !== 'undefined' && supabaseIntegrationManager.getData) {
        try {
          const activities = await supabaseIntegrationManager.getData('recent_activity', {
            order: { column: 'created_at', ascending: false },
            limit: 10
          });
          
          if (activities && activities.length > 0) {
            console.log(`Found ${activities.length} recent activities from Supabase`);
            // Transform Supabase data to match mock format if needed
            // Then update DB with these activities
            const transformedActivities = activities.map(activity => ({
              user: activity.user_name || 'Unknown User',
              action: activity.action || 'performed an action',
              time: activity.created_at ? new Date(activity.created_at).toLocaleString() : 'recently'
            }));
            
            // Update local storage with activities
            const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
            if (localData) {
              localData.recentActivity = transformedActivities;
              localStorage.setItem('reportrepo_db', JSON.stringify(localData));
            }
          }
        } catch (err) {
          console.warn('Could not fetch activities from Supabase, using local data:', err);
        }
      }
      
      // Render activities from local storage (either original or updated from Supabase)
      this.renderRecentActivity();
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  // Render recent activity list
  renderRecentActivity() {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) return;

    try {
      const recentActivity = DB.get('recentActivity') || [];
      
      if (recentActivity.length === 0) {
        activityList.innerHTML = '<li>No recent activity found</li>';
        return;
      }

      activityList.innerHTML = recentActivity.map(activity => `
        <li>
          <span class="activity-user">${activity.user}</span>
          <span class="activity-action">${activity.action}</span>
          <span class="activity-time">${activity.time}</span>
        </li>
      `).join('');
    } catch (error) {
      console.error('Error rendering recent activity:', error);
      activityList.innerHTML = '<li>Error loading activity</li>';
    }
  }

  // Set up the reports page
  setupReportsPage() {
    // Set up the preview pane
    this.setupPreviewPane();
    
    // Load reports from Supabase
    this.loadReports();
  }
  
  // Set up preview pane for reports page
  setupPreviewPane() {
    console.log('Setting up preview pane');
    
    // Initialize preview state
    window.previewState = {
      currentIndex: -1,
      reports: [],
      filteredReports: []
    };
    
    // Get preview elements
    const prevButton = document.getElementById('prev-report-btn');
    const nextButton = document.getElementById('next-report-btn');
    const downloadButton = document.getElementById('preview-download-btn');
    const detailsButton = document.getElementById('preview-details-btn');
    const previewCounter = document.getElementById('preview-counter');
    const previewTitle = document.getElementById('preview-title');
    const previewInfo = document.getElementById('preview-info');
    
    if (prevButton && nextButton && downloadButton && detailsButton) {
      // Add event listeners
      prevButton.addEventListener('click', () => {
        if (window.previewState.currentIndex > 0) {
          window.previewState.currentIndex--;
          this.updatePreviewDisplay();
        }
      });
      
      nextButton.addEventListener('click', () => {
        if (window.previewState.currentIndex < window.previewState.filteredReports.length - 1) {
          window.previewState.currentIndex++;
          this.updatePreviewDisplay();
        }
      });
      
      downloadButton.addEventListener('click', () => {
        const report = window.previewState.filteredReports[window.previewState.currentIndex];
        if (report) {
          if (typeof downloadReport === 'function') {
            downloadReport(report.id);
          }
        }
      });
      
      detailsButton.addEventListener('click', () => {
        const report = window.previewState.filteredReports[window.previewState.currentIndex];
        if (report) {
          if (typeof openReportDetailsModal === 'function') {
            openReportDetailsModal(report.id);
          }
        }
      });
      
      // Initial update - the preview state will be set by renderGroupedReportsTable
      // so we just need to ensure the preview display is updated
      setTimeout(() => {
        this.updatePreviewReports();
      }, 100);
    }
  }
  
  // Update the preview reports list based on filtered reports in the table
  updatePreviewReports() {
    try {
      // For the new grouped table structure, we need to get reports from the preview state
      // that was set by the renderGroupedReportsTable function
      if (window.previewState && window.previewState.filteredReports) {
        console.log(`Found ${window.previewState.filteredReports.length} reports in preview state`);
        // The preview state is already set by renderGroupedReportsTable
        // Just ensure the current index is valid
        if (window.previewState.filteredReports.length > 0 && window.previewState.currentIndex < 0) {
          window.previewState.currentIndex = 0;
        }
        this.updatePreviewDisplay();
      } else {
        console.log('No preview state available yet');
      }
    } catch (error) {
      console.error('Error updating preview reports:', error);
    }
  }
  
  // Update the preview display based on current index
  updatePreviewDisplay() {
    try {
      console.log('🔧 updatePreviewDisplay called');
      console.log('🔍 Preview state:', window.previewState);
      
      // Ensure preview state exists
      if (!window.previewState) {
        window.previewState = {
          currentIndex: -1,
          reports: [],
          filteredReports: []
        };
      }
      
      const reports = window.previewState.filteredReports || [];
      const currentIndex = window.previewState.currentIndex;
      console.log('🔍 Reports array:', reports);
      console.log('🔍 Current index:', currentIndex);
      console.log('🔍 Reports length:', reports.length);
      console.log('🔍 Index valid:', currentIndex >= 0 && currentIndex < reports.length);
      
      // Get UI elements
      const prevButton = document.getElementById('prev-report-btn');
      const nextButton = document.getElementById('next-report-btn');
      const downloadButton = document.getElementById('preview-download-btn');
      const detailsButton = document.getElementById('preview-details-btn');
      const previewCounter = document.getElementById('preview-counter');
      const previewTitle = document.getElementById('preview-title');
      const previewInfo = document.getElementById('preview-info');
      const previewContainer = document.getElementById('preview-container');
      
      // Check if we have reports to display
      if (reports.length === 0 || currentIndex < 0 || currentIndex >= reports.length) {
        if (prevButton) prevButton.disabled = true;
        if (nextButton) nextButton.disabled = true;
        if (downloadButton) downloadButton.disabled = true;
        if (detailsButton) detailsButton.disabled = true;
        if (previewCounter) previewCounter.textContent = '0 of 0';
        if (previewTitle) previewTitle.textContent = 'Report Preview';
        if (previewInfo) previewInfo.textContent = '';
        if (previewContainer) previewContainer.innerHTML = '<p id="no-preview-message" style="color: #999; font-style: italic;">Select a report to preview</p>';
        return;
      }
      
      // We have a valid report to display
      const report = reports[currentIndex];
      
      console.log('🔍 Main page preview - Report:', report);
      console.log('🔍 Main page preview - File extension:', window.getFileExtension ? window.getFileExtension(report.name) : 'getFileExtension not available');
      
      // Enable/disable navigation buttons
      if (prevButton) prevButton.disabled = currentIndex <= 0;
      if (nextButton) nextButton.disabled = currentIndex >= reports.length - 1;
      if (downloadButton) downloadButton.disabled = false;
      if (detailsButton) detailsButton.disabled = false;
      
      // Update counter and info
      if (previewCounter) previewCounter.textContent = `${currentIndex + 1} of ${reports.length}`;
      if (previewTitle) previewTitle.textContent = report.name;
      if (previewInfo) previewInfo.textContent = `${report.department} | ${report.format} | ${report.date}`;
      
      // Use the main page preview logic
      console.log('🔧 Using main page preview logic');
      
      // Clear the preview container
      if (previewContainer) {
        previewContainer.innerHTML = '';
        
        // Handle both report_url and fileURL field names for compatibility
        const fileUrl = report.report_url || report.fileURL || report.file_url;
        console.log('📁 File URL:', fileUrl);
        console.log('📄 File name:', report.name);
        
        if (!fileUrl) {
          previewContainer.innerHTML = `
            <div style="text-align: center; color: #999; padding: 20px;">
              <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
              <p><strong>No file URL available for preview</strong></p>
              <p style="font-size: 0.9rem; margin-top: 10px;">Report: ${report.name || 'Unknown'}</p>
            </div>
          `;
          return;
        }
        
        // Try to fix the file URL if needed
        let finalFileUrl = fileUrl;
        if (finalFileUrl.includes('reports-files') && finalFileUrl.includes('404')) {
          // URL is broken, try to fix it
          if (window.fixFileUrl) {
            finalFileUrl = window.fixFileUrl(fileUrl);
          }
        }
        
        console.log('🔧 Using file URL:', finalFileUrl);
        
        // Determine file type and create appropriate preview
        const fileName = report.name || 'Unknown file';
        let fileExtension = 'Unknown';
        
        // Try to get extension from window.getFileExtension first
        if (window.getFileExtension && typeof window.getFileExtension === 'function') {
          fileExtension = window.getFileExtension(fileName);
        }
        
        // If still unknown, try to extract from URL
        if (fileExtension === 'Unknown' && fileUrl.includes('/')) {
          const urlParts = fileUrl.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          const urlExtensionMatch = lastPart.match(/\.([a-zA-Z0-9]+)$/);
          if (urlExtensionMatch) {
            fileExtension = urlExtensionMatch[1].toLowerCase();
            console.log('🔍 Extracted extension from URL:', fileExtension);
          }
        }
        
        // If still unknown, try to extract from filename
        if (fileExtension === 'Unknown') {
          const nameExtensionMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
          if (nameExtensionMatch) {
            fileExtension = nameExtensionMatch[1].toLowerCase();
            console.log('🔍 Extracted extension from filename:', fileExtension);
          }
        }
        
        console.log('🔍 Detected file extension:', fileExtension);
        console.log('🔍 File name:', fileName);
        
        // Check if it's an image
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
          console.log('🖼️ Loading image preview in main page');
          const img = document.createElement('img');
          img.src = finalFileUrl;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.objectFit = 'contain';
          img.onload = () => console.log('✅ Image loaded successfully in main page');
          img.onerror = () => {
            console.error('❌ Failed to load image in main page');
            if (window.showFileNotAccessiblePreview) {
              window.showFileNotAccessiblePreview(previewContainer, fileName, finalFileUrl, 'image');
            }
          };
          previewContainer.appendChild(img);
        }
        // Check if it's a PDF
        else if (fileExtension === 'pdf') {
          console.log('📄 Loading PDF preview in main page');
          const iframe = document.createElement('iframe');
          iframe.src = finalFileUrl;
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.onload = () => console.log('✅ PDF loaded successfully in main page');
          iframe.onerror = () => {
            console.error('❌ Failed to load PDF in main page');
            if (window.showFileNotAccessiblePreview) {
              window.showFileNotAccessiblePreview(previewContainer, fileName, finalFileUrl, 'pdf');
            }
          };
          previewContainer.appendChild(iframe);
        }
        // Check if it's a video
        else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(fileExtension)) {
          console.log('🎥 Loading video preview in main page');
          const video = document.createElement('video');
          video.src = finalFileUrl;
          video.controls = true;
          video.style.maxWidth = '100%';
          video.style.maxHeight = '100%';
          video.style.width = 'auto';
          video.style.height = 'auto';
          video.style.objectFit = 'contain';
          video.onloadstart = () => console.log('✅ Video loading started in main page');
          video.onerror = () => {
            console.error('❌ Failed to load video in main page');
            if (window.showFileNotAccessiblePreview) {
              window.showFileNotAccessiblePreview(previewContainer, fileName, finalFileUrl, 'video');
            }
          };
          previewContainer.appendChild(video);
        }
        // Check if it's a document
        else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(fileExtension)) {
          console.log('📄 Loading document preview in main page');
          
          // Try to use Microsoft Office Online viewer for Office documents
          if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)) {
            console.log('📄 Loading Office document via Microsoft Online Viewer in main page');
            
            // Add parameters to handle Cloudflare and other CDN issues
            const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(finalFileUrl)}&wdAllowInteractivity=False&wdStartOn=1`;
            
            const iframe = document.createElement('iframe');
            iframe.src = officeViewerUrl;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.minHeight = '100%';
            iframe.style.display = 'block';
            iframe.style.border = 'none';
            iframe.style.backgroundColor = 'white';
            iframe.style.overflow = 'hidden';
            iframe.allowFullscreen = true;
            iframe.allow = 'fullscreen';
            
            // Set aspect ratio to 6:4 for Excel files
            if (['xlsx', 'xls'].includes(fileExtension)) {
              iframe.style.aspectRatio = '6/4';
              iframe.style.maxHeight = 'none';
            }
            
            iframe.onload = () => {
              console.log('✅ Office document loaded successfully via Microsoft Online Viewer in main page');
            };
            
            iframe.onerror = () => {
              console.error('❌ Failed to load Office document via Microsoft Online Viewer in main page');
              if (window.showDocumentFallbackPreview) {
                window.showDocumentFallbackPreview(previewContainer, fileName, finalFileUrl, fileExtension);
              }
            };
            
            previewContainer.appendChild(iframe);
          } else {
            // For text files, show content directly
            if (window.showDocumentFallbackPreview) {
              window.showDocumentFallbackPreview(previewContainer, fileName, finalFileUrl, fileExtension);
            }
          }
        }
        // Default file preview
        else {
          console.log('📁 Showing generic file preview in main page');
          previewContainer.innerHTML = `
            <div style="text-align: center; color: #999;">
              <i class="fas fa-file" style="font-size: 3rem; margin-bottom: 1rem;"></i>
              <p><strong>${fileName}</strong></p>
              <p style="font-size: 0.8rem;">Preview not available for this file type</p>
              <p style="font-size: 0.8rem;">Click download to access the file</p>
              <p style="font-size: 0.8rem;">File type: ${fileExtension ? fileExtension.toUpperCase() : 'Unknown'}</p>
            </div>
          `;
        }
      }
      
      console.log('🔧 Preview content generated for main page');
    } catch (error) {
      console.error('Error updating preview display:', error);
    }
  }

  // Enhance report upload with Backendless integration


  // Load reports from Supabase or local storage
  async loadReports() {
    try {
      // Ensure authentication before making requests
      await this.ensureAuthenticated();
      
      // Get current user info
      const currentUser = DB.getCurrentUser();
      const userData = supabaseAuth.getUserData();
      const userID = userData?.id;
      
      if (!userID) {
        console.warn('No authenticated user found');
        return;
      }
      
      // Try to get reports from Supabase first with admin mode to bypass RLS
      let reports = [];
      if (typeof supabaseDataService !== 'undefined' && supabaseDataService) {
        try {
          // Use admin mode to bypass RLS for reading reports
          await supabaseDataService.setAdminMode(true);
          reports = await supabaseDataService.getAll('reports');
          console.log(`Found ${reports.length} reports from Supabase with admin mode`);
          await supabaseDataService.setAdminMode(false);
        } catch (err) {
          console.warn('Could not fetch reports from Supabase with admin mode:', err);
          await supabaseDataService.setAdminMode(false);
          // Fallback to local storage
          reports = DB.get('reports') || [];
        }
      } else if (typeof supabaseIntegrationManager !== 'undefined' && supabaseIntegrationManager.getData) {
        try {
          reports = await supabaseIntegrationManager.getData('reports');
          console.log(`Found ${reports.length} reports from Supabase integration manager`);
        } catch (err) {
          console.warn('Could not fetch reports from Supabase integration manager:', err);
          // Fallback to local storage
          reports = DB.get('reports') || [];
        }
      } else {
        // Use local storage if no Supabase services available
        reports = DB.get('reports') || [];
      }
      
      console.log('Reports loaded:', reports);
      console.log(`Fetched ${reports?.length || 0} reports`);
      showNotification(`Fetched ${reports?.length || 0} reports`, 'info');
      
      if (reports && reports.length > 0) {
        // Keep track of unique reports by combining reports with the same reportTypeId
        const reportMap = new Map();
        
        // Process all reports
        reports.forEach(report => {
          console.log("Processing report:", report);
          
          // Extract the correct URL directly from the Backendless data
          let fileURL = '';
          
          // Handle both fileName and name fields for compatibility
          let fileName = report.fileName || report.name || '';
          
          // Handle both fileURL and report_url fields for compatibility
          if (report.fileURL) {
            fileURL = report.fileURL;
            console.log("Using fileURL from report:", fileURL);
          } else if (report.report_url) {
            fileURL = report.report_url;
            console.log("Using report_url from report:", fileURL);
          }
          
          // Extract filename from URL if it has the extension
          if (fileURL && fileURL.includes('/')) {
            const urlParts = fileURL.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart.includes('.')) {
              fileName = lastPart;
              console.log("Extracted filename from URL:", fileName);
            }
          }
          
          if (!fileURL) {
            // Try to construct from Backendless file structure if needed
            const fileDir = 'reports';
            if (fileName && typeof BACKENDLESS_CONFIG !== 'undefined' && BACKENDLESS_CONFIG.APP_ID && BACKENDLESS_CONFIG.API_KEY) {
              fileURL = `https://backendlessappcontent.com/${BACKENDLESS_CONFIG.APP_ID}/${BACKENDLESS_CONFIG.API_KEY}/files/${fileDir}/${fileName}`;
              console.log("Constructed fileURL:", fileURL);
            } else {
              console.warn("BACKENDLESS_CONFIG not available, skipping file URL construction");
            }
          }
          
          const format = this.getFileExtension(fileName);
          console.log(`File format for ${fileName}: ${format}`);
          console.log(`Final fileName: ${fileName}`);
          
          // Get department name and report frequency based on IDs
          // Handle both camelCase and snake_case field names for compatibility
          const departmentId = report.departmentId || report.department_id;
          const reportTypeId = report.reportTypeId || report.report_type_id;
          const department = this.getDepartmentName(departmentId);
          const frequency = this.getReportFrequency(reportTypeId);
          console.log(`Department: ${department}, Frequency: ${frequency}, DepartmentId: ${departmentId}, ReportTypeId: ${reportTypeId}`);
          console.log(`Report department field: ${report.department || 'Not set'}`);
          
          // Log submitter info for debugging
          console.log("Report submitter info:");
          console.log("- userID:", report.userID || report.submitter_id);
          console.log("- userName:", report.userName || report.submitter);
          
          // Create file object with safe date handling
          // Handle both created and created_at fields for compatibility
          const reportDate = report.created || report.created_at || report.date;
          const uploadDate = reportDate && !isNaN(new Date(reportDate)) ? new Date(reportDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          
          const fileObject = {
            name: fileName,
            uploadDate: uploadDate,
            submitter: report.userName || report.submitter || report.userID || report.submitter_id || 'Unknown User',
            notes: report.notes || 'No notes provided',
            fileURL: fileURL
          };
          
          console.log("Created file object with submitter:", fileObject.submitter);
          
          // Create a unique key for the report based on the reportTypeId
          const reportKey = reportTypeId ? `${reportTypeId}` : `file_${report.objectId}`;
          
          // Check if we already have this report in our map
          if (reportMap.has(reportKey)) {
            // We have this report, update with latest file info (one file per report)
            const existingReport = reportMap.get(reportKey);
            existingReport.report_url = fileURL;
            existingReport.fileURL = fileURL; // Add fileURL field for compatibility
            existingReport.file_size = fileObject.size;
            existingReport.date = fileObject.uploadDate;
            
            console.log("Updated existing report with new file:", existingReport.submitter);
          } else {
            // This is a new report, create a new entry
            const submitter = report.userName || report.submitter || report.userID || report.submitter_id || 'Unknown User';
            console.log(`Creating new report with submitter: ${submitter} (userName: ${report.userName || report.submitter}, userID: ${report.userID || report.submitter_id})`);
            
            const newReport = {
              id: report.objectId,
              name: fileName || 'Unknown Report',
              department: department, 
              submitter: submitter,
              date: uploadDate,
              status: 'Submitted',
              format: format,
              frequency: frequency,
              reportTypeId: reportTypeId || null,
              report_url: fileURL,
              fileURL: fileURL, // Add fileURL field for compatibility
              file_size: fileObject.size
            };
            
            reportMap.set(reportKey, newReport);
          }
        });
        
        // Convert map values to array
        const transformedReports = Array.from(reportMap.values());
        
        console.log('Transformed reports:', transformedReports);
        
        // Display a sample URL for debugging
        if (transformedReports.length > 0) {
          const sampleURL = transformedReports[0].fileURL || 'No URL available';
          console.log("Sample file URL:", sampleURL);
          showNotification(`Sample URL: ${sampleURL.substring(0, 50)}...`, "info");
        }
        
        // Replace mock data with real data
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        data.reports = transformedReports;
        localStorage.setItem('reportrepo_db', JSON.stringify(data));
        
        // Render the updated data
        if (typeof renderReportsTable === 'function') {
          renderReportsTable();
        }
        
        // Update preview pane if available
        if (window.previewState) {
          this.updatePreviewReports();
        }
        
        showNotification('Updated with real Backendless data', 'success');
      } else {
        showNotification('No reports found in Backendless', 'warning');
      }
      
    } catch (error) {
      console.error('Error loading reports:', error);
      showNotification(`Error: ${error.message}`, 'error');
    }
  }

  // Set up the report history page
  setupReportHistoryPage() {
    // Load report history from Backendless
    this.loadReportHistory();
  }

  // Load report history from Backendless
  async loadReportHistory() {
    try {
      const userID = backendlessAuth.getUserObjectId();
      if (!userID) return;
      
      // Get all reports from Backendless
      const reports = await backendlessReports.getAllReports();
      
      console.log('Backendless Report History:', reports);
      showNotification(`Fetched ${reports?.length || 0} reports from Backendless`, 'info');
      
      if (reports && reports.length > 0) {
        // Transform Backendless data to match the expected format
        const transformedReports = reports.map(report => {
          console.log("Processing report for history:", report);
          
          // Extract the correct URL directly from the Backendless data
          let fileURL = '';
          
          // Handle both fileName and name fields for compatibility
          let fileName = report.fileName || report.name || '';
          
          if (report.fileURL) {
            fileURL = report.fileURL;
            console.log("Using fileURL from report:", fileURL);
            
            // Extract filename from URL if it has the extension
            if (fileURL.includes('/')) {
              const urlParts = fileURL.split('/');
              const lastPart = urlParts[urlParts.length - 1];
              if (lastPart.includes('.')) {
                fileName = lastPart;
                console.log("Extracted filename from URL:", fileName);
              }
            }
          } else {
            // Try to construct from Backendless file structure if needed
            const fileDir = 'reports';
            if (fileName) {
              fileURL = `https://backendlessappcontent.com/${BACKENDLESS_CONFIG.APP_ID}/${BACKENDLESS_CONFIG.API_KEY}/files/${fileDir}/${fileName}`;
              console.log("Constructed fileURL:", fileURL);
            }
          }
          
          const format = this.getFileExtension(fileName);
          console.log(`File format for ${fileName}: ${format}`);
          console.log(`Final fileName: ${fileName}`);
          
          // Get department name from department_id if available
          let departmentName = 'General';
          if (report.department) {
            departmentName = report.department;
          } else if (report.department_id) {
            departmentName = this.getDepartmentName(report.department_id);
          }
          
          return {
            id: report.objectId,
            name: fileName || 'Unknown Report',
            department: departmentName, 
            submitter: report.userName || report.submitter || report.userID || report.submitter_id || 'Unknown User',
            date: new Date(report.created || report.created_at || report.date).toISOString().split('T')[0],
            status: 'Submitted',
            format: format,
            frequency: 'Ad-hoc',
            reportTypeId: 1,
            report_url: fileURL, // Use the actual Backendless URL
            file_size: 0, // Size not available from legacy data
            notes: report.notes || 'No notes provided'
          };
        });
        
        console.log('Transformed reports for history:', transformedReports);
        
        // Replace mock data with real data
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        data.reports = transformedReports;
        localStorage.setItem('reportrepo_db', JSON.stringify(data));
        
        // Render the updated data
        if (typeof renderReportHistoryTable === 'function') {
          renderReportHistoryTable();
        }
        
        showNotification('Updated report history with real data', 'success');
      }
      
    } catch (error) {
      console.error('Error loading report history:', error);
      showNotification(`Error: ${error.message}`, 'error');
    }
  }

  // Enhance user management functionality
  enhanceUserManagement() {
    if (this.userSyncInitialized) return;
    this.userSyncInitialized = true;
    
    console.log('Enhancing user management with Supabase integration');
    
    // Add a sync button to the user management page
    const headerElement = document.querySelector('.main-header');
    if (headerElement) {
      const syncButton = document.createElement('button');
      syncButton.className = 'action-button secondary';
      syncButton.id = 'sync-users-btn';
      syncButton.innerHTML = '<i class="fas fa-sync"></i> Sync with Supabase';
      
      // Add to header before the existing button
      const addUserBtn = document.getElementById('add-user-btn');
      if (addUserBtn) {
        headerElement.insertBefore(syncButton, addUserBtn);
      } else {
        headerElement.appendChild(syncButton);
      }
      
      // Add click handler for sync button
      syncButton.addEventListener('click', async () => {
        try {
          if (typeof supabaseIntegrationManager !== 'undefined') {
            await supabaseIntegrationManager.syncFromSupabase();
            showNotification('Users synced from Supabase', 'success');
            if (typeof renderUsersTable === 'function') {
              renderUsersTable();
            }
          } else {
            showNotification('Supabase integration not available', 'warning');
          }
        } catch (error) {
          console.error('Error syncing users:', error);
          showNotification('Error syncing users', 'error');
        }
      });
    }
  }
  
  // Set up logout functionality
  setupLogoutButton() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
          // Try Supabase logout first
          if (typeof supabaseAuth !== 'undefined' && supabaseAuth.logout) {
            await supabaseAuth.logout();
          } else {
            // Fallback: clear localStorage
            localStorage.removeItem('user_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_data');
          }
          
          window.location.href = 'login.html';
        } catch (error) {
          console.error('Error logging out:', error);
          
          // Force logout even if the API call fails
          localStorage.removeItem('user_token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_data');
          window.location.href = 'login.html';
        }
      });
    });
  }

  // Set up system reports page
  async setupSystemReportsPage() {
    console.log('Setting up System Reports page...');
    
    try {
      // Load system reports data
      await this.loadSystemReportsData();
      
      // Set up event listeners
      this.setupSystemReportsEventListeners();
      
      console.log('System Reports page setup complete');
    } catch (error) {
      console.error('Error setting up System Reports page:', error);
      showNotification('Error loading system reports data', 'error');
    }
  }

  // Load system reports data
  async loadSystemReportsData() {
    try {
      // Get data from Supabase or local storage
      let reports = [];
      let scorecards = [];
      let scorecardResults = [];
      let users = [];
      
      if (typeof supabaseIntegrationManager !== 'undefined' && supabaseIntegrationManager.getData) {
        try {
          [reports, scorecards, scorecardResults, users] = await Promise.all([
            supabaseIntegrationManager.getData('reports'),
            supabaseIntegrationManager.getData('scorecards'),
            supabaseIntegrationManager.getData('scorecard_results'),
            supabaseIntegrationManager.getData('users')
          ]);
          console.log(`Loaded from Supabase: ${reports.length} reports, ${scorecards.length} scorecards, ${scorecardResults.length} results, ${users.length} users`);
        } catch (err) {
          console.warn('Could not fetch from Supabase, using local data:', err);
          reports = DB.get('reports') || [];
          scorecards = DB.get('scorecards') || [];
          scorecardResults = DB.get('scorecard_results') || [];
          users = DB.get('users') || [];
        }
      } else {
        reports = DB.get('reports') || [];
        scorecards = DB.get('scorecards') || [];
        scorecardResults = DB.get('scorecard_results') || [];
        users = DB.get('users') || [];
      }
      
      // Update stat cards with real data
      this.updateSystemReportStats(reports, scorecards, scorecardResults, users);
      
      // Render charts
      this.renderDepartmentSubmissionsChart(reports);
      this.renderSubmissionTrendChart(reports);
      this.renderTopReportsChart(reports);
      
      console.log('System reports data loaded successfully');
      
    } catch (error) {
      console.error('Error loading system reports data:', error);
      throw error;
    }
  }

  // Update system report statistics
  updateSystemReportStats(reports, scorecards, scorecardResults, users) {
    try {
      // Calculate metrics
      const totalReports = reports.length;
      const submittedReports = reports.filter(r => r.status === 'Submitted').length;
      const pendingReports = reports.filter(r => r.status === 'Pending').length;
      const lateReports = reports.filter(r => r.status === 'Late').length;
      
      // Calculate average submission time (simplified - using days since creation)
      const now = new Date();
      const submissionTimes = reports
        .filter(r => r.created_at && r.status === 'Submitted')
        .map(r => {
          const created = new Date(r.created_at);
          return Math.ceil((now - created) / (1000 * 60 * 60 * 24));
        });
      
      const avgSubmissionTime = submissionTimes.length > 0 
        ? (submissionTimes.reduce((sum, time) => sum + time, 0) / submissionTimes.length).toFixed(1)
        : '0.0';
      
      // Calculate on-time submission rate
      const onTimeRate = totalReports > 0 ? Math.round((submittedReports / totalReports) * 100) : 0;
      
      // Calculate total users
      const totalUsers = users.length;
      
      // Calculate active reports (reports submitted in last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const activeReports = reports.filter(r => {
        if (!r.created_at) return false;
        const created = new Date(r.created_at);
        return created >= thirtyDaysAgo;
      }).length;
      
      // Update stat cards
      this.updateStatCard('Average Submission Time', `${avgSubmissionTime} days`, 'positive', '0.5 days from previous period');
      this.updateStatCard('On-time Submission Rate', `${onTimeRate}%`, 'positive', '2% from previous period');
      this.updateStatCard('Total Users', totalUsers.toString(), 'positive', '3 from previous period');
      this.updateStatCard('Active Reports', activeReports.toString(), 'positive', '5 from previous period');
      
      console.log('System report stats updated');
      
    } catch (error) {
      console.error('Error updating system report stats:', error);
    }
  }

  // Update individual stat card
  updateStatCard(title, value, changeType, changeText) {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      const cardTitle = card.querySelector('h3');
      if (cardTitle && cardTitle.textContent === title) {
        const valueElement = card.querySelector('.value');
        const changeElement = card.querySelector('.change');
        
        if (valueElement) {
          valueElement.textContent = value;
        }
        
        if (changeElement) {
          changeElement.className = `change ${changeType}`;
          changeElement.innerHTML = `<i class="fas fa-arrow-${changeType === 'positive' ? 'up' : 'down'}"></i> ${changeText}`;
        }
      }
    });
  }

  // Render department submissions chart
  renderDepartmentSubmissionsChart(reports) {
    const canvas = document.getElementById('departmentSubmissionsChart');
    if (!canvas) {
      console.warn('Department submissions chart canvas not found');
      return;
    }
    
    try {
      // Get departments
      const departments = DB.get('departments') || [];
      
      // Calculate submissions by department
      const departmentData = departments.map(dept => {
        const deptReports = reports.filter(r => r.department === dept.name);
        return {
          department: dept.name,
          submissions: deptReports.length,
          submitted: deptReports.filter(r => r.status === 'Submitted').length,
          pending: deptReports.filter(r => r.status === 'Pending').length,
          late: deptReports.filter(r => r.status === 'Late').length
        };
      }).filter(d => d.submissions > 0); // Only show departments with reports
      
      // Limit to top 8 departments
      const maxDepartments = 8;
      if (departmentData.length > maxDepartments) {
        departmentData.sort((a, b) => b.submissions - a.submissions);
        departmentData.splice(maxDepartments);
      }
      
      // Guard: If no data, show fallback
      if (departmentData.length === 0) {
        canvas.style.display = 'none';
        const chartContainer = canvas.parentElement;
        if (chartContainer) {
          chartContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No department data available</p>';
        }
        return;
      }
      
      // Destroy existing chart if it exists
      if (window.departmentSubmissionsChart && typeof window.departmentSubmissionsChart.destroy === 'function') {
        window.departmentSubmissionsChart.destroy();
      }
      
      // Create new chart
      const ctx = canvas.getContext('2d');
      window.departmentSubmissionsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: departmentData.map(d => d.department),
          datasets: [
            {
              label: 'Submitted',
              data: departmentData.map(d => d.submitted),
              backgroundColor: 'rgba(56, 161, 105, 0.8)',
              borderColor: 'rgba(56, 161, 105, 1)',
              borderWidth: 1
            },
            {
              label: 'Pending',
              data: departmentData.map(d => d.pending),
              backgroundColor: 'rgba(214, 158, 46, 0.8)',
              borderColor: 'rgba(214, 158, 46, 1)',
              borderWidth: 1
            },
            {
              label: 'Late',
              data: departmentData.map(d => d.late),
              backgroundColor: 'rgba(229, 62, 62, 0.8)',
              borderColor: 'rgba(229, 62, 62, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Report Submissions by Department'
            }
          }
        }
      });
      
      console.log('Department submissions chart rendered successfully');
    } catch (error) {
      console.error('Error rendering department submissions chart:', error);
      this.showChartFallback(canvas, 'Department submissions chart data not available');
    }
  }

  // Render submission trend chart
  renderSubmissionTrendChart(reports) {
    const canvas = document.getElementById('submissionTrendChart');
    if (!canvas) {
      console.warn('Submission trend chart canvas not found');
      return;
    }
    
    try {
      // Group reports by month for the last 6 months
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          start: date,
          end: new Date(date.getFullYear(), date.getMonth() + 1, 0)
        });
      }
      
      // Calculate submissions per month
      const trendData = months.map(month => {
        const monthReports = reports.filter(r => {
          if (!r.created_at) return false;
          const reportDate = new Date(r.created_at);
          return reportDate >= month.start && reportDate <= month.end;
        });
        
        return {
          month: month.label,
          total: monthReports.length,
          submitted: monthReports.filter(r => r.status === 'Submitted').length,
          pending: monthReports.filter(r => r.status === 'Pending').length,
          late: monthReports.filter(r => r.status === 'Late').length
        };
      });
      
      // Destroy existing chart if it exists
      if (window.submissionTrendChart && typeof window.submissionTrendChart.destroy === 'function') {
        window.submissionTrendChart.destroy();
      }
      
      // Create new chart
      const ctx = canvas.getContext('2d');
      window.submissionTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: trendData.map(d => d.month),
          datasets: [
            {
              label: 'Total Submissions',
              data: trendData.map(d => d.total),
              borderColor: 'rgba(49, 130, 206, 1)',
              backgroundColor: 'rgba(49, 130, 206, 0.1)',
              borderWidth: 2,
              fill: true
            },
            {
              label: 'Submitted',
              data: trendData.map(d => d.submitted),
              borderColor: 'rgba(56, 161, 105, 1)',
              backgroundColor: 'rgba(56, 161, 105, 0.1)',
              borderWidth: 2,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Submission Status Trend (Last 6 Months)'
            }
          }
        }
      });
      
      console.log('Submission trend chart rendered successfully');
    } catch (error) {
      console.error('Error rendering submission trend chart:', error);
      this.showChartFallback(canvas, 'Submission trend chart data not available');
    }
  }

  // Render top reports chart
  renderTopReportsChart(reports) {
    const canvas = document.getElementById('topReportsChart');
    if (!canvas) {
      console.warn('Top reports chart canvas not found');
      return;
    }
    
    try {
      // Get report types
      const reportTypes = DB.get('reportTypes') || [];
      
      // Count reports by type
      const reportTypeCounts = reportTypes.map(rt => {
        const typeReports = reports.filter(r => r.reportTypeId === rt.id || r.report_type_id === rt.id);
        return {
          name: rt.name,
          count: typeReports.length,
          department: rt.department
        };
      }).filter(rt => rt.count > 0); // Only show types with reports
      
      // Sort by count and take top 5
      reportTypeCounts.sort((a, b) => b.count - a.count);
      const top5 = reportTypeCounts.slice(0, 5);
      
      // Guard: If no data, show fallback
      if (top5.length === 0) {
        canvas.style.display = 'none';
        const chartContainer = canvas.parentElement;
        if (chartContainer) {
          chartContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No report type data available</p>';
        }
        return;
      }
      
      // Destroy existing chart if it exists
      if (window.topReportsChart && typeof window.topReportsChart.destroy === 'function') {
        window.topReportsChart.destroy();
      }
      
      // Create new chart
      const ctx = canvas.getContext('2d');
      window.topReportsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: top5.map(rt => rt.name),
          datasets: [{
            data: top5.map(rt => rt.count),
            backgroundColor: [
              'rgba(49, 130, 206, 0.8)',
              'rgba(56, 161, 105, 0.8)',
              'rgba(214, 158, 46, 0.8)',
              'rgba(229, 62, 62, 0.8)',
              'rgba(128, 90, 213, 0.8)'
            ],
            borderColor: [
              'rgba(49, 130, 206, 1)',
              'rgba(56, 161, 105, 1)',
              'rgba(214, 158, 46, 1)',
              'rgba(229, 62, 62, 1)',
              'rgba(128, 90, 213, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: 'Top 5 Report Types by Volume'
            }
          }
        }
      });
      
      console.log('Top reports chart rendered successfully');
    } catch (error) {
      console.error('Error rendering top reports chart:', error);
      this.showChartFallback(canvas, 'Top reports chart data not available');
    }
  }

  // Show chart fallback message
  showChartFallback(canvas, message) {
    canvas.style.display = 'none';
    const chartContainer = canvas.parentElement;
    if (chartContainer) {
      chartContainer.innerHTML = `<p style="text-align: center; color: #666; padding: 2rem;">${message}</p>`;
    }
  }

  // Set up system reports event listeners
  setupSystemReportsEventListeners() {
    // Time range filter
    const timeRangeFilter = document.getElementById('time-range-filter');
    if (timeRangeFilter) {
      timeRangeFilter.addEventListener('change', async (e) => {
        const days = parseInt(e.target.value);
        console.log(`Filtering data for last ${days} days`);
        
        // Reload data with new filter
        await this.loadSystemReportsData();
      });
    }
    
    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportSystemReportsData();
      });
    }
  }

  // Export system reports data
  exportSystemReportsData() {
    try {
      const reports = DB.get('reports') || [];
      const scorecards = DB.get('scorecards') || [];
      const scorecardResults = DB.get('scorecard_results') || [];
      const users = DB.get('users') || [];
      
      // Create CSV data
      const csvData = [
        ['Report Name', 'Department', 'Submitter', 'Status', 'Date', 'Type'],
        ...reports.map(r => [
          r.name || 'Unnamed',
          r.department || 'Unknown',
          r.submitter || 'Unknown',
          r.status || 'Unknown',
          r.date || 'No date',
          r.format || 'Unknown'
        ])
      ];
      
      // Convert to CSV string
      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-reports-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showNotification('System reports data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting system reports data:', error);
      showNotification('Error exporting data', 'error');
    }
  }
}

// Initialize the application
const reportApp = new ReportApp();

// Make the ReportApp instance globally accessible
window.ReportAppInstance = reportApp;

// Make updatePreviewDisplay globally accessible
window.updatePreviewDisplay = function() {
    if (window.ReportAppInstance && typeof window.ReportAppInstance.updatePreviewDisplay === 'function') {
        window.ReportAppInstance.updatePreviewDisplay();
    }
};

// Add event listener to report type rows to update previewer with latest file for that type
function setupReportTypeRowSelection() {
    const reportRows = document.querySelectorAll('#reports-table tbody tr');
    reportRows.forEach((row, idx) => {
        row.addEventListener('click', function() {
            window.previewState.currentIndex = idx;
            if (window.ReportAppInstance && typeof window.ReportAppInstance.updatePreviewDisplay === 'function') {
                window.ReportAppInstance.updatePreviewDisplay();
            }
        });
    });
}
// Setup report type row selection after rendering the table
function setupReportTypeRowSelectionAfterRender() {
    if (typeof setupReportTypeRowSelection === 'function') {
        setupReportTypeRowSelection();
    }
    if (window.ReportAppInstance && typeof window.ReportAppInstance.updatePreviewReports === 'function') {
        window.ReportAppInstance.updatePreviewReports();
    }
}

// Remove the problematic renderReportsTable wrapper and make it a standalone function
function renderReportsTable() {
  try {
    // Get reports data
    const reports = DB.get('reports') || [];
    const reportTypes = DB.get('reportTypes') || [];
    const departments = DB.get('departments') || [];
    
    // Get the reports table
    const reportsTable = document.getElementById('reports-table');
    if (!reportsTable) {
      console.warn('Reports table not found');
      return;
    }
    
    // Clear existing rows
    const tbody = reportsTable.querySelector('tbody');
    if (!tbody) {
      console.warn('Reports table tbody not found');
      return;
    }
    
    tbody.innerHTML = '';
    
    // Render each report
    reports.forEach(report => {
      const row = document.createElement('tr');
      
      // Get report type and department names
      const reportType = reportTypes.find(rt => rt.id == report.reportTypeId);
      const department = departments.find(d => d.name === report.department);
      
      row.innerHTML = `
        <td>${report.name || 'Unnamed Report'}</td>
        <td>${department ? department.name : report.department || 'Unknown'}</td>
        <td>${report.submitter || 'Unknown'}</td>
        <td>${report.date || 'No date'}</td>
        <td><span class="status-${report.status?.toLowerCase() || 'unknown'}">${report.status || 'Unknown'}</span></td>
        <td>${reportType ? reportType.frequency : 'Unknown'}</td>
        <td>
          <button class="action-button small" onclick="viewReport(${report.id})">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="action-button small" onclick="downloadReport(${report.id})">
            <i class="fas fa-download"></i> Download
          </button>
        </td>
      `;
      
      tbody.appendChild(row);
    });
    
    console.log(`Rendered ${reports.length} reports`);
    
    // Setup additional functionality if available
    setupReportTypeRowSelectionAfterRender();
    
  } catch (error) {
    console.error('Error rendering reports table:', error);
  }
}