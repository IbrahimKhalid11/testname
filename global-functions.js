// Global functions for grouped reports and history modal
console.log('🔧 Loading global functions...');

// Make updateHistoryPreview globally available
window.updateHistoryPreview = updateHistoryPreview;

// Add debug function for troubleshooting report history modal
window.debugReportHistoryModal = function() {
  console.log('🔍 Debugging report history modal...');
  
  // Check if modal exists
  const modal = document.getElementById('report-history-modal');
  console.log('Modal element:', modal ? 'Found' : 'Not found');
  
  // Check if preview content exists
  const previewContent = document.getElementById('history-preview-content');
  console.log('Preview content element:', previewContent ? 'Found' : 'Not found');
  
  // Check if history table exists
  const historyTable = document.getElementById('report-history-table');
  console.log('History table element:', historyTable ? 'Found' : 'Not found');
  
  // Check current history reports
  console.log('Current history reports:', window.currentHistoryReports);
  console.log('Current history index:', window.currentHistoryIndex);
  
  // Check if updateHistoryPreview function exists
  console.log('updateHistoryPreview function:', typeof updateHistoryPreview);
  
  // If there are current reports, try to preview the first one
  if (window.currentHistoryReports && window.currentHistoryReports.length > 0) {
    console.log('🔍 Attempting to preview first report...');
    const firstReport = window.currentHistoryReports[0];
    console.log('First report:', firstReport);
    updateHistoryPreview(firstReport);
  }
};

// Make renderReportsTable globally available
window.renderReportsTable = function() {
  console.log('🔧 Rendering grouped reports table...');
  const reportsContainer = document.getElementById('reports-container');
  if (!reportsContainer) {
    console.error('❌ Reports container not found');
    return;
  }
  
  reportsContainer.innerHTML = '';
  
  // Get data from localStorage (Supabase sync)
  const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
  const reports = localData.reports || [];
  const departments = localData.departments || [];
  const reportTypes = localData.reportTypes || [];
  
  // Get current user and their allowed departments
  let currentUser = null;
  
  // Try to get user from Supabase auth service first
  if (typeof supabaseAuth !== 'undefined' && supabaseAuth.getUserData) {
    currentUser = supabaseAuth.getUserData();
  }
  
  // Fallback to localStorage user data
  if (!currentUser) {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        currentUser = JSON.parse(userData);
      } catch (e) {
        console.warn('Failed to parse user data from localStorage:', e);
      }
    }
  }
  
  // Fallback to window.DB if available
  if (!currentUser && window.DB && window.DB.getCurrentUser) {
    currentUser = window.DB.getCurrentUser();
  }
  let allowedDepartments = [];
  
  if (currentUser) {
    console.log('🔒 Current user:', currentUser.name, 'Role:', currentUser.role);
    
    // Admin users can see all departments
    if (currentUser.role === 'Admin') {
      allowedDepartments = departments.map(dept => dept.name);
      console.log('🔒 Admin user - showing all departments:', allowedDepartments);
    } else {
      // Get user's allowed departments from the departments array
      if (currentUser.departments && Array.isArray(currentUser.departments)) {
        allowedDepartments = currentUser.departments;
        // Also include their primary department if not already in the list
        if (currentUser.department && !allowedDepartments.includes(currentUser.department)) {
          allowedDepartments.push(currentUser.department);
        }
      } else {
        // Fallback to just their primary department
        allowedDepartments = currentUser.department ? [currentUser.department] : [];
      }
      console.log('🔒 User allowed departments:', allowedDepartments);
    }
  } else {
    console.warn('⚠️ No current user found - showing all reports');
    console.log('🔍 Available auth services:', {
      supabaseAuth: typeof supabaseAuth !== 'undefined',
      userData: localStorage.getItem('user_data') ? 'exists' : 'not found',
      windowDB: window.DB ? 'available' : 'not available'
    });
    allowedDepartments = departments.map(dept => dept.name);
  }
  
  // Filter report types to only show those where the department is allowed for the user
  const allowedReportTypes = reportTypes.filter(reportType => {
    return allowedDepartments.includes(reportType.department);
  });
  
  console.log('🔒 Filtered report types:', allowedReportTypes.length, 'of', reportTypes.length);
  
  // Filter reports to only show those where the department is available to the user
  let filteredReports = reports;
  if (allowedDepartments.length > 0) {
    filteredReports = reports.filter(report => {
      let reportDepartmentName = report.department;
      if (report.department_id && !report.department) {
        const department = departments.find(dept => dept.id == report.department_id);
        if (department) {
          reportDepartmentName = department.name;
        }
      }
      return allowedDepartments.includes(reportDepartmentName);
    });
  }
  
  // Group reports by report type (only allowed report types)
  const reportsByType = {};
  
  filteredReports.forEach(report => {
    let departmentName = 'N/A';
    if (report.department) {
      const departmentById = departments.find(dept => dept.id == report.department);
      if (departmentById) {
        departmentName = departmentById.name;
      } else {
        const departmentByName = departments.find(dept => dept.name === report.department);
        if (departmentByName) {
          departmentName = departmentByName.name;
        } else {
          departmentName = report.department;
        }
      }
    }
    
    let reportTypeName = 'N/A';
    if (report.report_type_id) {
      const reportType = reportTypes.find(type => type.id == report.report_type_id);
      if (reportType) {
        reportTypeName = reportType.name;
      } else {
        reportTypeName = report.report_type_id;
      }
    }
    
    // Only include reports for allowed report types
    if (allowedReportTypes.some(rt => rt.name === reportTypeName)) {
      if (!reportsByType[reportTypeName]) {
        reportsByType[reportTypeName] = [];
      }
      
      report.displayDepartment = departmentName;
      report.displayReportType = reportTypeName;
      reportsByType[reportTypeName].push(report);
    }
  });
  
  // Create table structure for simplified display
  const tableHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Report Type</th>
            <th>Department</th>
            <th>Latest Version</th>
            <th>Last Updated</th>
            <th>Status</th>
            <th>Versions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="reports-table-body">
        </tbody>
      </table>
    </div>
  `;
  
  reportsContainer.innerHTML = tableHTML;
  const tbody = document.getElementById('reports-table-body');
  
  // Render each report type as a single table row
  const latestReportsArray = [];
  Object.keys(reportsByType).forEach((reportTypeName, index) => {
    const reportsForType = reportsByType[reportTypeName];
    const latestReport = reportsForType.sort((a, b) => 
      new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
    )[0];
    latestReportsArray.push(latestReport);
    
    const tr = document.createElement('tr');
    tr.className = 'report-type-row';
    tr.setAttribute('data-report-type', reportTypeName);
    tr.setAttribute('data-latest-report-id', latestReport.id);
    tr.innerHTML = `
      <td><strong>${reportTypeName}</strong></td>
      <td>${latestReport.displayDepartment}</td>
      <td>${latestReport.name}</td>
      <td>${latestReport.created_at ? new Date(latestReport.created_at).toLocaleDateString() : (latestReport.date || 'N/A')}</td>
      <td>${latestReport.status || 'N/A'}</td>
      <td>${reportsForType.length} version${reportsForType.length > 1 ? 's' : ''}</td>
      <td>
        <div class="action-buttons" style="display: flex; gap: 5px; align-items: center;">
          <button class="action-button primary small" onclick="openReportHistoryModal('${reportTypeName}', ${JSON.stringify(reportsForType).replace(/\"/g, '&quot;')})">
            <i class="fas fa-history"></i> History
          </button>
          <button class="action-icon view" data-id="${latestReport.id}" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-icon download" data-id="${latestReport.id}" title="Download">
            <i class="fas fa-download"></i>
          </button>
          <button class="action-icon delete" data-id="${latestReport.id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    // Add click event listener for row selection
    tr.addEventListener('click', function(e) {
      // Don't trigger if clicking on action buttons
      if (e.target.closest('.action-buttons')) {
        return;
      }
      // Remove selection from other rows
      document.querySelectorAll('.report-type-row').forEach(row => {
        row.classList.remove('selected-row');
      });
      // Add selection to this row
      this.classList.add('selected-row');
      
      // Find the correct index in the latestReportsArray
      const rowIndex = Array.from(tbody.children).indexOf(this);
      console.log('🔎 Row clicked, row index:', rowIndex, 'latestReportsArray length:', latestReportsArray.length);
      
      // Update previewer with the latest report for this type
      if (window.previewState && Array.isArray(window.previewState.filteredReports)) {
        window.previewState.currentIndex = rowIndex;
        const selectedReport = window.previewState.filteredReports[rowIndex];
        console.log('🔎 Row clicked, updating preview to index:', rowIndex, selectedReport);
        
        // Check if selectedReport exists before accessing its properties
        if (selectedReport && selectedReport.name) {
          console.log('🔍 Selected report file extension:', getFileExtension(selectedReport.name));
          console.log('🔍 Preview state after update:', window.previewState);
          if (typeof window.updatePreviewDisplay === 'function') {
            window.updatePreviewDisplay();
          } else {
            console.warn('⚠️ updatePreviewDisplay function not available');
          }
        } else {
          console.error('❌ Selected report is undefined or missing name property:', selectedReport);
          console.log('🔍 Available reports in preview state:', window.previewState.filteredReports);
          console.log('🔍 Requested index:', rowIndex, 'Array length:', window.previewState.filteredReports.length);
          
          // Try to find the report by ID as fallback
          const reportId = this.getAttribute('data-latest-report-id');
          const fallbackReport = window.previewState.filteredReports.find(r => r.id == reportId);
          if (fallbackReport) {
            console.log('🔧 Found report by ID fallback:', fallbackReport);
            const fallbackIndex = window.previewState.filteredReports.indexOf(fallbackReport);
            window.previewState.currentIndex = fallbackIndex;
            if (typeof window.updatePreviewDisplay === 'function') {
              window.updatePreviewDisplay();
            }
          }
        }
      } else {
        console.warn('⚠️ Preview state not available or filteredReports not an array');
        console.log('🔍 Preview state:', window.previewState);
      }
    });
    tbody.appendChild(tr);
  });
  // Set preview state to latest reports
  if (!window.previewState) {
    window.previewState = {};
  }
  
  // Set preview state to latest reports without auto-selection
  window.previewState.filteredReports = latestReportsArray;
  
  // Ensure the preview state is properly initialized
  console.log('🔧 Setting up preview state with', latestReportsArray.length, 'reports');
  console.log('🔧 Latest reports array:', latestReportsArray.map(r => ({ name: r.name, department: r.displayDepartment })));
  
  console.log('🔧 Updated preview state with', latestReportsArray.length, 'reports');
  
  console.log('🔧 Preview state:', window.previewState);
  
  if (typeof window.updatePreviewDisplay === 'function') {
    window.updatePreviewDisplay();
    console.log('🔧 updatePreviewDisplay called after table render');
  } else {
    console.warn('⚠️ updatePreviewDisplay function not available');
  }
  
  if (Object.keys(reportsByType).length === 0) {
    reportsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999; font-style: italic;">
        No reports found for your allowed departments.
      </div>
    `;
  }
  
  // Set up action button listeners after rendering
  setupActionButtonListeners();
  
  // Setup pagination buttons after table is rendered
  if (typeof window.setupPaginationButtons === 'function') {
    window.setupPaginationButtons();
    console.log('🔧 Pagination buttons setup called after table render');
  } else {
    console.warn('⚠️ setupPaginationButtons function not available');
  }
};

// Make openReportHistoryModal globally available
window.openReportHistoryModal = function(reportTypeName, reports) {
  console.log('🔧 Opening report history modal for:', reportTypeName);
  console.log('📊 Reports data:', reports);
  
  // Validate input
  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    console.error('❌ Invalid reports data provided to openReportHistoryModal');
    showNotification('No report data available', 'error');
    return;
  }
  
  // Debug: Log the first report structure
  console.log('🔍 First report structure:', reports[0]);
  console.log('🔍 First report keys:', Object.keys(reports[0]));
  
  const modalTitle = document.getElementById('report-history-title');
  const modalSubtitle = document.getElementById('report-history-subtitle');
  if (modalTitle) modalTitle.textContent = `Report History - ${reportTypeName}`;
  if (modalSubtitle) modalSubtitle.textContent = `${reportTypeName} - ${reports.length} versions`;
  
  // Sort reports by date (newest first)
  const sortedReports = reports.sort((a, b) => 
    new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
  );
  
  console.log('📅 Sorted reports:', sortedReports.map(r => ({
    name: r.name,
    date: r.created_at || r.date,
    hasUrl: !!(r.report_url || r.fileURL || r.file_url)
  })));
  
  const historyTable = document.getElementById('report-history-table');
  if (historyTable && historyTable.querySelector('tbody')) {
    const tbody = historyTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    sortedReports.forEach((report, index) => {
      const tr = document.createElement('tr');
      tr.className = 'history-row';
      tr.setAttribute('data-index', index);
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td>${report.name || 'Unknown'}</td>
        <td>${report.created_at ? new Date(report.created_at).toLocaleDateString() : (report.date || 'N/A')}</td>
        <td>${report.submitter || 'Unknown'}</td>
        <td>${report.notes || 'No notes'}</td>
        <td>
          <button class="action-icon view-history" data-index="${index}" data-report-id="${report.id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-icon download-history" data-index="${index}" data-report-id="${report.id}">
            <i class="fas fa-download"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    console.error('❌ Report history table not found');
  }
  
  // Store the sorted reports globally for access by other functions
  window.currentHistoryReports = sortedReports;
  window.currentHistoryIndex = 0;
  
  // Set up history modal functionality
  setupHistoryModalFunctionality();
  
  const modal = document.getElementById('report-history-modal');
  if (modal) {
    modal.style.display = 'block';
    console.log('✅ Report history modal opened successfully');
    // Set up action button listeners for the history modal
    setTimeout(() => setupActionButtonListeners(), 100);
  } else {
    console.error('❌ Report history modal element not found');
  }
};

// Add event listeners for action buttons after rendering
function setupActionButtonListeners() {
  console.log('🔧 Setting up action button listeners...');
  
  // View button listeners (main page)
  document.querySelectorAll('.action-icon.view').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const reportId = this.getAttribute('data-id');
      console.log('👁️ View report (main page):', reportId);
      viewReport(reportId);
    });
  });
  
  // View button listeners (history modal)
  document.querySelectorAll('.action-icon.view-history').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const index = parseInt(this.getAttribute('data-index'));
      const reportId = this.getAttribute('data-report-id');
      console.log('👁️ View report (history modal):', reportId, 'at index:', index);
      selectHistoryReport(index);
    });
  });
  
  // Download button listeners (main page)
  document.querySelectorAll('.action-icon.download').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const reportId = this.getAttribute('data-id');
      console.log('⬇️ Download report (main page):', reportId);
      downloadReport(reportId);
    });
  });
  
  // Download button listeners (history modal)
  document.querySelectorAll('.action-icon.download-history').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const index = parseInt(this.getAttribute('data-index'));
      const reportId = this.getAttribute('data-report-id');
      console.log('⬇️ Download report (history modal):', reportId, 'at index:', index);
      downloadHistoryReport(reportId, index);
    });
  });
  
  // Delete button listeners
  document.querySelectorAll('.action-icon.delete').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const reportId = this.getAttribute('data-id');
      console.log('🗑️ Delete report:', reportId);
      deleteReport(reportId);
    });
  });
  
  // History view button listeners
  document.querySelectorAll('.action-icon.view-history').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const reportId = this.getAttribute('data-report-id');
      const index = this.getAttribute('data-index');
      console.log('👁️ View history report:', reportId, 'at index:', index);
      viewHistoryReport(reportId, index);
    });
  });
  
  // History download button listeners
  document.querySelectorAll('.action-icon.download-history').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const reportId = this.getAttribute('data-report-id');
      const index = this.getAttribute('data-index');
      console.log('⬇️ Download history report:', reportId, 'at index:', index);
      downloadHistoryReport(reportId, index);
    });
  });
}

// Report action functions
function viewReport(reportId) {
  try {
    const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
    const report = localData.reports.find(r => r.id == reportId);
    
    if (!report) {
      console.error('Report not found:', reportId);
      showNotification('Report not found', 'error');
      return;
    }
    
    console.log('Viewing report:', report);
    
    // Open report in new tab or show preview
    if (report.report_url) {
      window.open(report.report_url, '_blank');
    } else {
      showNotification('No file URL available for this report', 'warning');
    }
  } catch (error) {
    console.error('Error viewing report:', error);
    showNotification('Error viewing report', 'error');
  }
}

function downloadReport(reportId) {
  try {
    const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
    const report = localData.reports.find(r => r.id == reportId);
    
    if (!report) {
      console.error('Report not found:', reportId);
      showNotification('Report not found', 'error');
      return;
    }
    
    console.log('Downloading report:', report);
    
    if (report.report_url) {
      // Check if the URL is accessible first
      console.log('🔍 Checking file accessibility:', report.report_url);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = report.report_url;
      link.download = report.name || 'report';
      link.target = '_blank';
      
      // Add error handling for the download
      link.onerror = () => {
        console.error('❌ Download failed for:', report.report_url);
        showNotification('Download failed - file may not be accessible', 'error');
      };
      
      // Try to open in new tab first to check accessibility
      const testWindow = window.open(report.report_url, '_blank');
      
      // If the window opens successfully, close it and proceed with download
      if (testWindow) {
        setTimeout(() => {
          testWindow.close();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showNotification('Download started', 'success');
        }, 100);
      } else {
        // If window.open fails, try direct download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Download started', 'success');
      }
    } else {
      showNotification('No file URL available for this report', 'warning');
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    showNotification('Error downloading report', 'error');
  }
}

function deleteReport(reportId) {
  try {
    const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
    const report = localData.reports.find(r => r.id == reportId);
    
    if (!report) {
      console.error('Report not found:', reportId);
      showNotification('Report not found', 'error');
      return;
    }
    
    console.log('Deleting report:', report);
    
    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
      // Remove report from local storage
      localData.reports = localData.reports.filter(r => r.id != reportId);
      localStorage.setItem('reportrepo_db', JSON.stringify(localData));
      
      // Re-render the reports table
      if (typeof renderReportsTable === 'function') {
        renderReportsTable();
      }
      
      showNotification('Report deleted successfully', 'success');
    }
  } catch (error) {
    console.error('Error deleting report:', error);
    showNotification('Error deleting report', 'error');
  }
}

function viewHistoryReport(reportId, index) {
  try {
    // Get report from the current history reports
    const report = window.currentHistoryReports[index];
    
    if (!report) {
      console.error('History report not found at index:', index);
      showNotification('Report not found', 'error');
      return;
    }
    
    console.log('Viewing history report:', report);
    
    // Open report in new tab or show preview
    if (report.report_url) {
      window.open(report.report_url, '_blank');
    } else {
      showNotification('No file URL available for this report', 'warning');
    }
  } catch (error) {
    console.error('Error viewing history report:', error);
    showNotification('Error viewing report', 'error');
  }
}

function downloadHistoryReport(reportId, index) {
  try {
    // Get report from the current history reports
    const report = window.currentHistoryReports[index];
    
    if (!report) {
      console.error('History report not found at index:', index);
      showNotification('Report not found', 'error');
      return;
    }
    
    console.log('Downloading history report:', report);
    
    if (report.report_url) {
      // Check if the URL is accessible first
      console.log('🔍 Checking file accessibility:', report.report_url);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = report.report_url;
      link.download = report.name || 'report';
      link.target = '_blank';
      
      // Add error handling for the download
      link.onerror = () => {
        console.error('❌ Download failed for:', report.report_url);
        showNotification('Download failed - file may not be accessible', 'error');
      };
      
      // Try to open in new tab first to check accessibility
      const testWindow = window.open(report.report_url, '_blank');
      
      // If the window opens successfully, close it and proceed with download
      if (testWindow) {
        setTimeout(() => {
          testWindow.close();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showNotification('Download started', 'success');
        }, 100);
      } else {
        // If window.open fails, try direct download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Download started', 'success');
      }
    } else {
      showNotification('No file URL available for this report', 'warning');
    }
  } catch (error) {
    console.error('Error downloading history report:', error);
    showNotification('Error downloading report', 'error');
  }
}

// Set up history modal functionality
function setupHistoryModalFunctionality() {
  console.log('🔧 Setting up history modal functionality...');
  
  // Add click listeners to history rows
  document.querySelectorAll('.history-row').forEach(row => {
    row.addEventListener('click', function(e) {
      // Don't trigger if clicking on action buttons
      if (e.target.closest('.action-icon')) {
        return;
      }
      
      const index = parseInt(this.getAttribute('data-index'));
      console.log('📋 Selected history report at index:', index);
      selectHistoryReport(index);
    });
  });
  
  // Set up preview navigation buttons
  const prevBtn = document.getElementById('history-prev-btn');
  const nextBtn = document.getElementById('history-next-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (window.currentHistoryIndex > 0) {
        selectHistoryReport(window.currentHistoryIndex - 1);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (window.currentHistoryIndex < window.currentHistoryReports.length - 1) {
        selectHistoryReport(window.currentHistoryIndex + 1);
      }
    });
  }
  
  // Set up modal close functionality
  const modalClose = document.querySelector('#report-history-modal .modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      document.getElementById('report-history-modal').style.display = 'none';
    });
  }
  
  // Select the first report by default
  if (window.currentHistoryReports.length > 0) {
    selectHistoryReport(0);
  }
}

// Select a history report for preview
function selectHistoryReport(index) {
  const reports = window.currentHistoryReports;
  if (!reports || index < 0 || index >= reports.length) {
    return;
  }
  
  const report = reports[index];
  window.currentHistoryIndex = index;
  
  console.log('📋 Selecting history report:', report);
  
  // Update row highlighting
  document.querySelectorAll('.history-row').forEach(row => {
    row.classList.remove('selected-row');
  });
  document.querySelector(`.history-row[data-index="${index}"]`).classList.add('selected-row');
  
  // Update preview content in HISTORY MODAL ONLY
  updateHistoryPreview(report);
  
  // Update navigation buttons
  updateHistoryNavigation();
  
  // Ensure main page preview is not affected
  const mainPreviewContainer = document.getElementById('preview-container');
  if (mainPreviewContainer && mainPreviewContainer.innerHTML.includes('Select a report to preview')) {
    console.log('✅ Main page preview remains unchanged');
  }
}

// Update history preview content
function updateHistoryPreview(report) {
  const previewContent = document.getElementById('history-preview-content');
  if (!previewContent) {
    console.error('❌ history-preview-content element not found');
    return;
  }
  
  // Ensure we're targeting the history modal preview, not the main page preview
  const modal = document.getElementById('report-history-modal');
  const isModalVisible = modal && modal.style.display === 'block';
  console.log('🔍 History modal visible:', isModalVisible);
  
  if (!isModalVisible) {
    console.warn('⚠️ History modal not visible, skipping preview update');
    return;
  }
  
  // Clear existing content
  previewContent.innerHTML = '';
  
  // Ensure preview container has proper positioning for loading indicators
  previewContent.style.position = 'relative';
  previewContent.style.minHeight = '400px';
  
  console.log('🔍 Previewing report in HISTORY MODAL:', report);
  console.log('🔍 Report object keys:', Object.keys(report));
  
  // Handle both report_url and fileURL field names for compatibility
  const fileUrl = report.report_url || report.fileURL || report.file_url;
  console.log('📁 File URL:', fileUrl);
  console.log('📄 File name:', report.name);
  
  if (!fileUrl) {
    console.warn('⚠️ No file URL found in report object');
    console.log('🔍 Available fields:', {
      report_url: report.report_url,
      fileURL: report.fileURL,
      file_url: report.file_url,
      name: report.name,
      id: report.id
    });
    
    previewContent.innerHTML = `
      <div style="text-align: center; color: #999; padding: 20px;">
        <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <p><strong>No file URL available for preview</strong></p>
        <p style="font-size: 0.9rem; margin-top: 10px;">Report: ${report.name || 'Unknown'}</p>
        <p style="font-size: 0.9rem;">ID: ${report.id || 'Unknown'}</p>
        <p style="font-size: 0.9rem;">Available fields: ${Object.keys(report).join(', ')}</p>
        <button onclick="console.log('Report object:', ${JSON.stringify(report)})" style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Debug Report Object
        </button>
      </div>
    `;
    return;
  }
  
  // Try to fix the file URL if needed
  let finalFileUrl = fileUrl;
  if (finalFileUrl.includes('reports-files') && finalFileUrl.includes('404')) {
    // URL is broken, try to fix it
    finalFileUrl = fixFileUrl(fileUrl);
  }
  
  console.log('🔧 Using file URL:', finalFileUrl);
  
  // Determine file type and create appropriate preview
  const fileName = report.name || 'Unknown file';
  
  // Use the corrected getFileExtension function
  let fileExtension = getFileExtension(fileName);
  
  // If no extension found in filename, try to extract from URL
  if (fileExtension === 'Unknown' && fileUrl.includes('/')) {
    const urlParts = fileUrl.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const urlExtensionMatch = lastPart.match(/\.([a-zA-Z0-9]+)$/);
    if (urlExtensionMatch) {
      fileExtension = urlExtensionMatch[1].toLowerCase();
      console.log('🔍 Extracted extension from URL:', fileExtension);
    }
  }
  
  console.log('🔍 Detected file extension:', fileExtension);
  console.log('🔍 File name:', fileName);
  
  // Check if it's an image
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
    console.log('🖼️ Loading image preview');
    const img = document.createElement('img');
    img.src = finalFileUrl;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    img.onload = () => console.log('✅ Image loaded successfully');
    img.onerror = () => {
      console.error('❌ Failed to load image');
      showFileNotAccessiblePreview(previewContent, fileName, finalFileUrl, 'image');
    };
    previewContent.appendChild(img);
  }
  // Check if it's a PDF
  else if (fileExtension === 'pdf') {
    console.log('📄 Loading PDF preview');
    
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #666;
      z-index: 10;
    `;
    loadingDiv.innerHTML = `
      <div style="margin-bottom: 10px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #007bff;"></i>
      </div>
      <p>Loading PDF preview...</p>
      <p style="font-size: 0.8rem; margin-top: 5px;">This may take a few moments</p>
    `;
    previewContent.appendChild(loadingDiv);
    
    // Try Google Docs Viewer first (handles Cloudflare issues better)
    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(finalFileUrl)}&embedded=true`;
    
    const iframe = document.createElement('iframe');
    iframe.src = googleDocsUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%'; // Fill the preview container
    iframe.style.border = 'none';
    iframe.style.backgroundColor = 'white';
    iframe.style.overflow = 'hidden';
    
    iframe.onload = () => {
      console.log('✅ PDF loaded successfully via Google Docs Viewer');
      // Remove loading indicator
      if (loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
      }
    };
    
    iframe.onerror = () => {
      console.error('❌ Failed to load PDF via Google Docs Viewer, trying direct URL');
      // Remove loading indicator
      if (loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
      }
      
      // Fallback to direct URL
      const directIframe = document.createElement('iframe');
      directIframe.src = finalFileUrl;
      directIframe.style.width = '100%';
      directIframe.style.height = '100%';
      directIframe.style.border = 'none';
      directIframe.style.backgroundColor = 'white';
      directIframe.style.overflow = 'hidden';
      
      directIframe.onload = () => console.log('✅ PDF loaded successfully via direct URL');
      directIframe.onerror = () => {
        console.error('❌ Failed to load PDF via direct URL');
        showFileNotAccessiblePreview(previewContent, fileName, finalFileUrl, 'pdf');
      };
      
      previewContent.innerHTML = '';
      previewContent.appendChild(directIframe);
    };
    
    // Add timeout for Google Docs Viewer
    setTimeout(() => {
      if (loadingDiv.parentNode) {
        console.warn('⚠️ Google Docs Viewer timeout, trying direct URL');
        loadingDiv.parentNode.removeChild(loadingDiv);
        
        // Try direct URL as fallback
        const directIframe = document.createElement('iframe');
        directIframe.src = finalFileUrl;
        directIframe.style.width = '100%';
        directIframe.style.height = '100%';
        directIframe.style.border = 'none';
        directIframe.style.backgroundColor = 'white';
        directIframe.style.overflow = 'hidden';
        
        directIframe.onload = () => console.log('✅ PDF loaded successfully via direct URL (timeout fallback)');
        directIframe.onerror = () => {
          console.error('❌ Failed to load PDF via direct URL (timeout fallback)');
          showFileNotAccessiblePreview(previewContent, fileName, finalFileUrl, 'pdf');
        };
        
        previewContent.innerHTML = '';
        previewContent.appendChild(directIframe);
      }
    }, 8000);
    
    previewContent.appendChild(iframe);
  }
  // Check if it's a video
  else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(fileExtension)) {
    console.log('🎥 Loading video preview');
    const video = document.createElement('video');
    video.src = finalFileUrl;
    video.controls = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '100%';
    video.style.width = 'auto';
    video.style.height = 'auto';
    video.style.objectFit = 'contain';
    video.onloadstart = () => console.log('✅ Video loading started');
    video.onerror = () => {
      console.error('❌ Failed to load video');
      showFileNotAccessiblePreview(previewContent, fileName, finalFileUrl, 'video');
    };
    previewContent.appendChild(video);
  }
  // Check if it's a document
  else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(fileExtension)) {
    console.log('📄 Loading document preview');
    
    // Try to use Microsoft Office Online viewer for Office documents
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)) {
      console.log('📄 Loading Office document via Microsoft Online Viewer');
      
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
      
      // Add loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #666;
        z-index: 10;
      `;
      loadingDiv.innerHTML = `
        <div style="margin-bottom: 10px;">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #007bff;"></i>
        </div>
        <p>Loading document preview...</p>
        <p style="font-size: 0.8rem; margin-top: 5px;">This may take a few moments</p>
      `;
      previewContent.appendChild(loadingDiv);
      
      iframe.onload = () => {
        console.log('✅ Office document loaded successfully via Microsoft Online Viewer');
        // Remove loading indicator
        if (loadingDiv.parentNode) {
          loadingDiv.parentNode.removeChild(loadingDiv);
        }
        
        // Check if iframe is actually showing content
        setTimeout(() => {
          try {
            if (iframe.contentDocument && iframe.contentDocument.body) {
              const bodyContent = iframe.contentDocument.body.innerHTML;
              if (bodyContent.includes('error') || bodyContent.includes('Error') || bodyContent.length < 100) {
                console.warn('⚠️ Office viewer returned error or empty content, showing fallback');
                showDocumentFallbackPreview(previewContent, fileName, finalFileUrl, fileExtension);
              } else {
                console.log('✅ Office viewer content verified successfully');
              }
            }
          } catch (e) {
            console.warn('⚠️ Cannot access iframe content due to CORS, but iframe loaded');
          }
        }, 3000);
      };
      
      iframe.onerror = () => {
        console.error('❌ Failed to load Office document via Microsoft Online Viewer');
        if (loadingDiv.parentNode) {
          loadingDiv.parentNode.removeChild(loadingDiv);
        }
        showDocumentFallbackPreview(previewContent, fileName, finalFileUrl, fileExtension);
      };
      
      // Add timeout to handle slow loading or Cloudflare issues
      setTimeout(() => {
        if (loadingDiv.parentNode) {
          console.warn('⚠️ Office viewer timeout, showing fallback');
          loadingDiv.parentNode.removeChild(loadingDiv);
          showDocumentFallbackPreview(previewContent, fileName, finalFileUrl, fileExtension);
        }
      }, 10000);
      
      previewContent.appendChild(iframe);
    } else {
      // For text files, show content directly
      showDocumentFallbackPreview(previewContent, fileName, finalFileUrl, fileExtension);
    }
  }
  // Default file preview
  else {
    console.log('📁 Showing generic file preview');
    previewContent.innerHTML = `
      <div style="text-align: center; color: #999;">
        <i class="fas fa-file" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <p><strong>${fileName}</strong></p>
        <p style="font-size: 0.8rem;">Preview not available for this file type</p>
        <p style="font-size: 0.8rem;">Click download to access the file</p>
        <p style="font-size: 0.8rem;">File type: ${fileExtension ? fileExtension.toUpperCase() : 'Unknown'}</p>
        <p style="font-size: 0.8rem;">URL: ${finalFileUrl}</p>
      </div>
    `;
  }
}

// Update history navigation buttons
function updateHistoryNavigation() {
  const reports = window.currentHistoryReports;
  const currentIndex = window.currentHistoryIndex;
  
  const prevBtn = document.getElementById('history-prev-btn');
  const nextBtn = document.getElementById('history-next-btn');
  const counter = document.getElementById('history-counter');
  
  if (prevBtn) prevBtn.disabled = currentIndex <= 0;
  if (nextBtn) nextBtn.disabled = currentIndex >= reports.length - 1;
  if (counter) counter.textContent = `${currentIndex + 1} of ${reports.length}`;
}

// Show report details
function showReportDetails(report) {
  const details = `
Report Details:
- Name: ${report.name}
- Department: ${report.department || 'N/A'}
- Submit Date: ${report.created_at ? new Date(report.created_at).toLocaleDateString() : (report.date || 'N/A')}
- Submitter: ${report.submitter || 'Unknown'}
- Status: ${report.status || 'N/A'}
- Notes: ${report.notes || 'No notes'}
- File URL: ${report.report_url || 'No URL available'}
- File Type: ${getFileExtension(report.name).toUpperCase()}
  `;
  
  alert(details);
}

// Helper function to get file extension
function getFileExtension(fileName) {
  if (!fileName) return 'Unknown';
  
  // Use regex to find the actual file extension at the end of the filename
  const extensionMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
  if (extensionMatch) {
    return extensionMatch[1].toLowerCase();
  }
  
  // If no extension found in filename, try to extract from URL if available
  if (fileName.includes('http') || fileName.includes('/')) {
    const urlParts = fileName.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const urlExtensionMatch = lastPart.match(/\.([a-zA-Z0-9]+)$/);
    if (urlExtensionMatch) {
      return urlExtensionMatch[1].toLowerCase();
    }
  }
  
  return 'Unknown';
}

// Test Supabase storage bucket accessibility
async function testStorageBucket() {
  console.log('🔍 Testing Supabase storage bucket accessibility...');
  
  // Get a sample report URL
  const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
  const sampleReport = localData.reports && localData.reports.length > 0 ? localData.reports[0] : null;
  
  if (!sampleReport || !sampleReport.report_url) {
    console.warn('⚠️ No sample report URL available for testing');
    return false;
  }
  
  try {
    console.log('🔍 Testing URL:', sampleReport.report_url);
    
    // Try to fetch the file to test accessibility
    const response = await fetch(sampleReport.report_url, { method: 'HEAD' });
    
    if (response.ok) {
      console.log('✅ Storage bucket is accessible');
      return true;
    } else {
      console.error('❌ Storage bucket not accessible:', response.status, response.statusText);
      
      // Try to list available buckets
      await listAvailableBuckets();
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing storage bucket:', error);
    await listAvailableBuckets();
    return false;
  }
}

// List available storage buckets
async function listAvailableBuckets() {
  console.log('🔍 Listing available storage buckets...');
  
  try {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      console.error('❌ Supabase client not available');
      return;
    }
    
    const { data: buckets, error } = await supabaseClient.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }
    
    console.log('📦 Available buckets:', buckets);
    
    if (buckets && buckets.length > 0) {
      console.log('✅ Found buckets:', buckets.map(b => b.name));
      
      // Check if reports-files bucket exists
      const reportsBucket = buckets.find(b => b.name === 'reports-files');
      if (!reportsBucket) {
        console.warn('⚠️ reports-files bucket not found. Available buckets:', buckets.map(b => b.name));
        
        // Try to create the bucket if it doesn't exist
        await createReportsBucket();
      } else {
        console.log('✅ reports-files bucket found');
      }
    } else {
      console.warn('⚠️ No buckets found in project');
    }
  } catch (error) {
    console.error('❌ Error listing buckets:', error);
  }
}

// Create reports-files bucket if it doesn't exist
async function createReportsBucket() {
  console.log('🔧 Attempting to create reports-files bucket...');
  
  try {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      console.error('❌ Supabase client not available');
      return false;
    }
    
    const { data, error } = await supabaseClient.storage.createBucket('reports-files', {
      public: true,
      allowedMimeTypes: ['*/*'],
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error);
      return false;
    }
    
    console.log('✅ reports-files bucket created successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Error creating bucket:', error);
    return false;
  }
}

// Fix file URLs to use correct bucket or provide fallback
function fixFileUrl(originalUrl) {
  if (!originalUrl) return null;
  
  console.log('🔧 Fixing file URL:', originalUrl);
  
  // Check if URL contains the correct bucket name
  if (originalUrl.includes('reports-files')) {
    // URL is already using the correct bucket
    return originalUrl;
  }
  
  // Try to extract filename from URL
  const urlParts = originalUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  
  if (fileName) {
    // Construct new URL with correct bucket
    const baseUrl = 'https://pvfmdczitmjtvbgewurc.supabase.co/storage/v1/object/public/reports-files/';
    const newUrl = baseUrl + fileName;
    console.log('🔧 Fixed URL:', newUrl);
    return newUrl;
  }
  
  return originalUrl;
}

// Show document fallback preview
function showDocumentFallbackPreview(previewContent, fileName, fileUrl, fileExtension) {
  const fileTypeIcons = {
    'xlsx': 'fas fa-file-excel',
    'xls': 'fas fa-file-excel',
    'docx': 'fas fa-file-word',
    'doc': 'fas fa-file-word',
    'pptx': 'fas fa-file-powerpoint',
    'ppt': 'fas fa-file-powerpoint',
    'txt': 'fas fa-file-alt',
    'default': 'fas fa-file-alt'
  };
  
  const icon = fileTypeIcons[fileExtension] || fileTypeIcons.default;
  
  previewContent.innerHTML = `
    <div style="text-align: center; color: #999; padding: 2rem;">
      <i class="${icon}" style="font-size: 4rem; margin-bottom: 1rem; color: #0078d4;"></i>
      <h3 style="margin-bottom: 1rem; color: #666;">${fileName}</h3>
      <p style="font-size: 0.9rem; margin-bottom: 1rem;">Document preview not available in browser</p>
      <p style="font-size: 0.8rem; margin-bottom: 1rem;">Click download to access the file</p>
      <p style="font-size: 0.8rem; margin-bottom: 1rem;">File type: ${fileExtension.toUpperCase()}</p>
      
      <div style="margin-top: 1rem;">
        <button onclick="window.open('${fileUrl}', '_blank')" style="background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
          <i class="fas fa-download"></i> Download File
        </button>
      </div>
      
      <p style="font-size: 0.7rem; margin-top: 1rem; color: #999;">URL: ${fileUrl}</p>
    </div>
  `;
}

// Show file not accessible preview
function showFileNotAccessiblePreview(previewContent, fileName, fileUrl, fileType) {
  const fileTypeIcons = {
    'image': 'fas fa-image',
    'pdf': 'fas fa-file-pdf',
    'video': 'fas fa-video',
    'document': 'fas fa-file-alt',
    'default': 'fas fa-file'
  };
  
  const icon = fileTypeIcons[fileType] || fileTypeIcons.default;
  
  // Check if this might be a Cloudflare issue
  const isCloudflareIssue = fileUrl.includes('cloudflare') || 
                           fileUrl.includes('__cf_bm') || 
                           fileUrl.includes('cdn') ||
                           fileUrl.includes('supabase.co');
  
  previewContent.innerHTML = `
    <div style="text-align: center; color: #999; padding: 2rem;">
      <i class="${icon}" style="font-size: 4rem; margin-bottom: 1rem; color: #ccc;"></i>
      <h3 style="margin-bottom: 1rem; color: #666;">File Preview Not Available</h3>
      <p style="margin-bottom: 0.5rem;"><strong>${fileName}</strong></p>
      <p style="font-size: 0.9rem; margin-bottom: 1rem;">The file cannot be previewed in the browser.</p>
      
      ${isCloudflareIssue ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
          <p style="font-size: 0.8rem; margin-bottom: 0.5rem; color: #856404;"><strong>⚠️ Cloudflare/CDN Issue Detected:</strong></p>
          <p style="font-size: 0.8rem; margin-bottom: 0.5rem; color: #856404;">This appears to be a Cloudflare or CDN-related issue. The browser is blocking cookies or cross-origin requests.</p>
          <ul style="font-size: 0.8rem; margin: 0; padding-left: 1.5rem; color: #856404;">
            <li>Try downloading the file instead</li>
            <li>Check if the file URL is accessible in a new tab</li>
            <li>Contact administrator if issue persists</li>
          </ul>
        </div>
      ` : `
        <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
          <p style="font-size: 0.8rem; margin-bottom: 0.5rem;"><strong>Possible Issues:</strong></p>
          <ul style="font-size: 0.8rem; margin: 0; padding-left: 1.5rem;">
            <li>Storage bucket 'reports-files' doesn't exist</li>
            <li>File was not properly uploaded</li>
            <li>Storage permissions are not configured</li>
            <li>File URL is incorrect</li>
          </ul>
        </div>
      `}
      
      <div style="margin-top: 1rem;">
        <button onclick="window.open('${fileUrl}', '_blank')" style="background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-right: 0.5rem; cursor: pointer;">
          <i class="fas fa-external-link-alt"></i> Open in New Tab
        </button>
        <button onclick="downloadFileDirectly('${fileUrl}', '${fileName}')" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
          <i class="fas fa-download"></i> Download File
        </button>
      </div>
      
      <p style="font-size: 0.7rem; margin-top: 1rem; color: #999;">URL: ${fileUrl}</p>
    </div>
  `;
}

// Helper function to download file directly
function downloadFileDirectly(fileUrl, fileName) {
  console.log('⬇️ Attempting direct download:', fileUrl);
  
  try {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Download started', 'success');
  } catch (error) {
    console.error('❌ Download failed:', error);
    showNotification('Download failed. Try opening in new tab.', 'error');
  }
}

// Helper function to check if iframe is displaying content properly
function checkIframeVisibility(iframe, previewContent, fileName, fileUrl, fileType) {
  setTimeout(() => {
    try {
      // Check if iframe has any content
      if (iframe.contentDocument && iframe.contentDocument.body) {
        const bodyContent = iframe.contentDocument.body.innerHTML;
        const bodyText = iframe.contentDocument.body.textContent || '';
        
        // If content is very short or contains error messages, show fallback
        if (bodyContent.length < 200 || 
            bodyText.includes('error') || 
            bodyText.includes('Error') ||
            bodyText.includes('not found') ||
            bodyText.includes('access denied')) {
          console.warn('⚠️ Iframe content appears to be an error page, showing fallback');
          showFileNotAccessiblePreview(previewContent, fileName, fileUrl, fileType);
        } else {
          console.log('✅ Iframe content verified as valid');
        }
      }
    } catch (e) {
      // CORS error - can't access iframe content, but iframe loaded
      console.log('ℹ️ Cannot access iframe content due to CORS, but iframe appears to have loaded');
    }
  }, 5000);
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  // Set background color based on type
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#2ecc71';
      break;
    case 'error':
      notification.style.backgroundColor = '#e74c3c';
      break;
    case 'warning':
      notification.style.backgroundColor = '#f39c12';
      break;
    default:
      notification.style.backgroundColor = '#3498db';
  }
  
  notification.textContent = message;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Make functions globally available
window.viewReport = viewReport;
window.downloadReport = downloadReport;
window.deleteReport = deleteReport;
window.viewHistoryReport = viewHistoryReport;
window.downloadHistoryReport = downloadHistoryReport;
window.setupHistoryModalFunctionality = setupHistoryModalFunctionality;
window.selectHistoryReport = selectHistoryReport;
window.updateHistoryPreview = updateHistoryPreview;
window.updateHistoryNavigation = updateHistoryNavigation;
window.showReportDetails = showReportDetails;
window.downloadFileDirectly = downloadFileDirectly;
window.debugReportHistoryModal = debugReportHistoryModal;
window.getFileExtension = getFileExtension;
window.testStorageBucket = testStorageBucket;
window.listAvailableBuckets = listAvailableBuckets;
window.createReportsBucket = createReportsBucket;
window.fixFileUrl = fixFileUrl;
window.showFileNotAccessiblePreview = showFileNotAccessiblePreview;
window.showDocumentFallbackPreview = showDocumentFallbackPreview;
window.showNotification = showNotification;

// Test storage bucket accessibility on page load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    testStorageBucket().then(isAccessible => {
      if (!isAccessible) {
        console.warn('⚠️ Supabase storage bucket is not accessible. Files may not be available for download or preview.');
        showNotification('Storage bucket not accessible - files may not be available', 'warning');
      }
    });
  }, 2000); // Wait 2 seconds for page to load
});

console.log('✅ Global functions loaded successfully');