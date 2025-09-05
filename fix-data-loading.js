// Fix for Supabase data loading issues
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔧 Initializing data loading fix...');

  // Get current page
  const currentPage = window.location.pathname.split('/').pop();
  
  // Initialize Supabase data service if it doesn't exist
  if (typeof supabaseDataService === 'undefined') {
    console.log('Creating Supabase data service...');
    window.supabaseDataService = new SupabaseData();
    await window.supabaseDataService.init();
  }
  
  // Initialize integration manager if it doesn't exist
  if (typeof supabaseIntegrationManager === 'undefined') {
    console.log('Creating Supabase integration manager...');
    window.supabaseIntegrationManager = new SupabaseIntegrationManager();
    await window.supabaseIntegrationManager.init();
  }

  // Make sure we have a local DB object initialized
  if (typeof DB === 'undefined' || !DB) {
    console.log('Creating DB object...');
    window.DB = {
      data: {},
      get: function(collection) {
        const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
        return localData[collection] || [];
      },
      set: function(collection, data) {
        const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
        localData[collection] = data;
        localStorage.setItem('reportrepo_db', JSON.stringify(localData));
      },
      add: function(collection, item) {
        const items = this.get(collection) || [];
        items.push(item);
        this.set(collection, items);
      }
    };
  }

  // Load sample data if no data exists
  const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
  if (!localData.departments || localData.departments.length === 0) {
    console.log('Loading sample data...');
    const sampleData = {
      departments: [
        { id: '1', name: 'Finance', manager: 'John Smith' },
        { id: '2', name: 'Operations', manager: 'Jane Doe' },
        { id: '3', name: 'Marketing', manager: 'Robert Johnson' }
      ],
      users: [
        { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin', department: 'All' },
        { id: '2', name: 'John Smith', email: 'john@example.com', role: 'Manager', department: 'Finance' },
        { id: '3', name: 'Jane Doe', email: 'jane@example.com', role: 'Manager', department: 'Operations' }
      ],
      reportTypes: [
        { id: '1', name: 'Monthly Financial Report', department: 'Finance', frequency: 'Monthly', format: 'PDF' },
        { id: '2', name: 'Weekly Operations Summary', department: 'Operations', frequency: 'Weekly', format: 'Excel' },
        { id: '3', name: 'Quarterly Marketing Analysis', department: 'Marketing', frequency: 'Quarterly', format: 'PowerPoint' }
      ],
      frequencies: [
        { id: '1', name: 'Daily', description: 'Every business day' },
        { id: '2', name: 'Weekly', description: 'Once per week' },
        { id: '3', name: 'Monthly', description: 'Once per month' },
        { id: '4', name: 'Quarterly', description: 'Once per quarter' }
      ],
      formats: [
        { id: '1', name: 'PDF', description: 'Adobe PDF Document' },
        { id: '2', name: 'Excel', description: 'Microsoft Excel Spreadsheet' },
        { id: '3', name: 'Word', description: 'Microsoft Word Document' },
        { id: '4', name: 'PowerPoint', description: 'Microsoft PowerPoint Presentation' }
      ],
      reports: [
        { 
          id: '1', 
          name: 'May 2025 Financial Report', 
          department: 'Finance',
          reportType: 'Monthly Financial Report',
          submitter: 'John Smith',
          submissionDate: '2025-05-15',
          status: 'Submitted',
          format: 'PDF',
          fileUrl: 'assets/images/pdf-preview.png'
        },
        { 
          id: '2', 
          name: 'Operations Summary Week 20', 
          department: 'Operations',
          reportType: 'Weekly Operations Summary',
          submitter: 'Jane Doe',
          submissionDate: '2025-05-17',
          status: 'Submitted',
          format: 'Excel',
          fileUrl: 'assets/images/excel-preview.png'
        }
      ]
    };
    localStorage.setItem('reportrepo_db', JSON.stringify(sampleData));
  }

  // Page-specific initializations
  if (currentPage === 'settings.html') {
    console.log('Initializing settings page...');
    
    // Initialize tab switching
    document.querySelectorAll('.tab-link').forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = e.target.getAttribute('data-tab');
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Remove active class from buttons
        document.querySelectorAll('.tab-link').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabId).classList.add('active');
        e.target.classList.add('active');
      });
    });
    
    // Render departments table
    const departmentsData = DB.get('departments') || [];
    const departmentsTable = document.getElementById('departments-settings-table');
    if (departmentsTable && departmentsTable.querySelector('tbody')) {
      const tbody = departmentsTable.querySelector('tbody');
      tbody.innerHTML = '';
      
      departmentsData.forEach(dept => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${dept.name}</td>
          <td>${dept.manager || 'Not Assigned'}</td>
          <td>0</td>
          <td>N/A</td>
          <td>
            <button class="action-icon edit" data-id="${dept.id}"><i class="fas fa-edit"></i></button>
            <button class="action-icon delete" data-id="${dept.id}"><i class="fas fa-trash"></i></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    
    // Render report types table
    const reportTypesData = DB.get('reportTypes') || [];
    const reportsTable = document.getElementById('reports-settings-table');
    if (reportsTable && reportsTable.querySelector('tbody')) {
      const tbody = reportsTable.querySelector('tbody');
      tbody.innerHTML = '';
      
      reportTypesData.forEach(report => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${report.name}</td>
          <td>${report.department}</td>
          <td>${report.frequency}</td>
          <td>${report.format}</td>
          <td>${report.description || ''}</td>
          <td>
            <button class="action-icon edit" data-id="${report.id}"><i class="fas fa-edit"></i></button>
            <button class="action-icon delete" data-id="${report.id}"><i class="fas fa-trash"></i></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    
    // Render frequencies table
    const frequenciesData = DB.get('frequencies') || [];
    const frequenciesTable = document.getElementById('frequencies-settings-table');
    if (frequenciesTable && frequenciesTable.querySelector('tbody')) {
      const tbody = frequenciesTable.querySelector('tbody');
      tbody.innerHTML = '';
      
      frequenciesData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.name}</td>
          <td>${item.description || ''}</td>
          <td>
            <button class="action-icon edit" data-id="${item.id}"><i class="fas fa-edit"></i></button>
            <button class="action-icon delete" data-id="${item.id}"><i class="fas fa-trash"></i></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    
    // Render formats table
    const formatsData = DB.get('formats') || [];
    const formatsTable = document.getElementById('formats-settings-table');
    if (formatsTable && formatsTable.querySelector('tbody')) {
      const tbody = formatsTable.querySelector('tbody');
      tbody.innerHTML = '';
      
      formatsData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.name}</td>
          <td>${item.description || ''}</td>
          <td>
            <button class="action-icon edit" data-id="${item.id}"><i class="fas fa-edit"></i></button>
            <button class="action-icon delete" data-id="${item.id}"><i class="fas fa-trash"></i></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    
    // ADD BUTTON HANDLERS FOR SETTINGS PAGE
    // ====================================
    
    // Department modal handling
    const departmentModal = document.getElementById('department-modal');
    const departmentForm = document.getElementById('department-form');
    const departmentIdField = document.getElementById('department-id');
    const departmentNameField = document.getElementById('department-name');
    const departmentManagerField = document.getElementById('department-manager');
    
    // Add Department button
    const addDepartmentBtn = document.getElementById('add-department-btn');
    if (addDepartmentBtn) {
      addDepartmentBtn.addEventListener('click', function() {
        console.log('Add Department button clicked');
        // Reset form
        departmentIdField.value = '';
        departmentNameField.value = '';
        departmentManagerField.selectedIndex = 0;
        
        // Update modal title
        document.getElementById('department-modal-title').textContent = 'Add Department';
        
        // Show modal
        departmentModal.style.display = 'block';
      });
    }
    
    // Populate department manager dropdown
    const populateDepartmentManagerDropdown = () => {
      if (departmentManagerField) {
        departmentManagerField.innerHTML = '<option value="">Select Manager</option>';
        const users = DB.get('users') || [];
        users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.name;
          option.textContent = user.name;
          departmentManagerField.appendChild(option);
        });
      }
    };
    
    populateDepartmentManagerDropdown();
    
    // Department Form Submission
    if (departmentForm) {
      departmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Department form submitted');
        
        const departmentId = departmentIdField.value;
        const departmentName = departmentNameField.value;
        const departmentManager = departmentManagerField.value;
        
        if (!departmentName) {
          alert('Department name is required');
          return;
        }
        
        const departments = DB.get('departments') || [];
        
        if (departmentId) {
          // Update existing department
          const departmentIndex = departments.findIndex(d => d.id === departmentId);
          if (departmentIndex !== -1) {
            departments[departmentIndex].name = departmentName;
            departments[departmentIndex].manager = departmentManager;
          }
        } else {
          // Create new department
          const newDepartment = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            name: departmentName,
            manager: departmentManager
          };
          departments.push(newDepartment);
        }
        
        // Save to local storage
        DB.set('departments', departments);
        
        // Close modal
        departmentModal.style.display = 'none';
        
        // Refresh the table
        location.reload();
      });
    }
    
    // Department Edit/Delete buttons
    document.querySelectorAll('#departments-settings-table .action-icon.edit').forEach(button => {
      button.addEventListener('click', function() {
        const departmentId = this.getAttribute('data-id');
        console.log('Edit department:', departmentId);
        
        // Find the department
        const departments = DB.get('departments') || [];
        const department = departments.find(d => d.id === departmentId);
        
        if (department) {
          // Populate the form
          departmentIdField.value = department.id;
          departmentNameField.value = department.name;
          
          // Select the manager if it exists
          if (department.manager) {
            for (let i = 0; i < departmentManagerField.options.length; i++) {
              if (departmentManagerField.options[i].value === department.manager) {
                departmentManagerField.selectedIndex = i;
                break;
              }
            }
          } else {
            departmentManagerField.selectedIndex = 0;
          }
          
          // Update modal title
          document.getElementById('department-modal-title').textContent = 'Edit Department';
          
          // Show modal
          departmentModal.style.display = 'block';
        }
      });
    });
    
    document.querySelectorAll('#departments-settings-table .action-icon.delete').forEach(button => {
      button.addEventListener('click', function() {
        const departmentId = this.getAttribute('data-id');
        console.log('Delete department:', departmentId);
        
        if (confirm('Are you sure you want to delete this department?')) {
          const departments = DB.get('departments') || [];
          const updatedDepartments = departments.filter(d => d.id !== departmentId);
          DB.set('departments', updatedDepartments);
          location.reload();
        }
      });
    });
    
    // Report Type modal handling
    const reportModal = document.getElementById('report-modal');
    const reportForm = document.getElementById('report-form');
    const reportIdField = document.getElementById('report-id');
    const reportNameField = document.getElementById('report-name');
    const reportDepartmentField = document.getElementById('report-department');
    const reportFrequencyField = document.getElementById('report-frequency');
    const reportFormatField = document.getElementById('report-format');
    const reportDescriptionField = document.getElementById('report-description');
    
    // Add Report Type button
    const addReportBtn = document.getElementById('add-report-btn');
    if (addReportBtn) {
      addReportBtn.addEventListener('click', function() {
        console.log('Add Report Type button clicked');
        
        // Reset form
        reportIdField.value = '';
        reportNameField.value = '';
        reportDepartmentField.selectedIndex = 0;
        reportFrequencyField.selectedIndex = 0;
        reportFormatField.selectedIndex = 0;
        reportDescriptionField.value = '';
        
        // Update modal title
        document.getElementById('report-modal-title').textContent = 'Add Report Type';
        
        // Show modal
        reportModal.style.display = 'block';
      });
    }
    
    // Populate dropdowns for report form
    const populateReportFormDropdowns = () => {
      // Populate department dropdown
      if (reportDepartmentField) {
        reportDepartmentField.innerHTML = '<option value="">Select Department</option>';
        const departments = DB.get('departments') || [];
        departments.forEach(dept => {
          const option = document.createElement('option');
          option.value = dept.name;
          option.textContent = dept.name;
          reportDepartmentField.appendChild(option);
        });
      }
      
      // Populate frequency dropdown
      if (reportFrequencyField) {
        reportFrequencyField.innerHTML = '<option value="">Select Frequency</option>';
        const frequencies = DB.get('frequencies') || [];
        frequencies.forEach(freq => {
          const option = document.createElement('option');
          option.value = freq.name;
          option.textContent = freq.name;
          reportFrequencyField.appendChild(option);
        });
      }
      
      // Populate format dropdown
      if (reportFormatField) {
        reportFormatField.innerHTML = '<option value="">Select Format</option>';
        const formats = DB.get('formats') || [];
        formats.forEach(format => {
          const option = document.createElement('option');
          option.value = format.name;
          option.textContent = format.name;
          reportFormatField.appendChild(option);
        });
      }
    };
    
    populateReportFormDropdowns();
    
    // Report Form Submission
    if (reportForm) {
      reportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Report form submitted');
        
        const reportId = reportIdField.value;
        const reportName = reportNameField.value;
        const department = reportDepartmentField.value;
        const frequency = reportFrequencyField.value;
        const format = reportFormatField.value;
        const description = reportDescriptionField.value;
        
        if (!reportName || !department || !frequency || !format) {
          alert('Please fill all required fields');
          return;
        }
        
        const reportTypes = DB.get('reportTypes') || [];
        
        if (reportId) {
          // Update existing report type
          const reportIndex = reportTypes.findIndex(r => r.id === reportId);
          if (reportIndex !== -1) {
            reportTypes[reportIndex].name = reportName;
            reportTypes[reportIndex].department = department;
            reportTypes[reportIndex].frequency = frequency;
            reportTypes[reportIndex].format = format;
            reportTypes[reportIndex].description = description;
          }
        } else {
          // Create new report type
          const newReportType = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            name: reportName,
            department: department,
            frequency: frequency,
            format: format,
            description: description
          };
          reportTypes.push(newReportType);
        }
        
        // Save to local storage
        DB.set('reportTypes', reportTypes);
        
        // Close modal
        reportModal.style.display = 'none';
        
        // Refresh the table
        location.reload();
      });
    }
    
    // Report Type Edit/Delete buttons
    document.querySelectorAll('#reports-settings-table .action-icon.edit').forEach(button => {
      button.addEventListener('click', function() {
        const reportId = this.getAttribute('data-id');
        console.log('Edit report type:', reportId);
        
        // Find the report type
        const reportTypes = DB.get('reportTypes') || [];
        const reportType = reportTypes.find(r => r.id === reportId);
        
        if (reportType) {
          // Populate the form
          reportIdField.value = reportType.id;
          reportNameField.value = reportType.name;
          reportDescriptionField.value = reportType.description || '';
          
          // Select dropdowns
          for (let i = 0; i < reportDepartmentField.options.length; i++) {
            if (reportDepartmentField.options[i].value === reportType.department) {
              reportDepartmentField.selectedIndex = i;
              break;
            }
          }
          
          for (let i = 0; i < reportFrequencyField.options.length; i++) {
            if (reportFrequencyField.options[i].value === reportType.frequency) {
              reportFrequencyField.selectedIndex = i;
              break;
            }
          }
          
          for (let i = 0; i < reportFormatField.options.length; i++) {
            if (reportFormatField.options[i].value === reportType.format) {
              reportFormatField.selectedIndex = i;
              break;
            }
          }
          
          // Update modal title
          document.getElementById('report-modal-title').textContent = 'Edit Report Type';
          
          // Show modal
          reportModal.style.display = 'block';
        }
      });
    });
    
    document.querySelectorAll('#reports-settings-table .action-icon.delete').forEach(button => {
      button.addEventListener('click', function() {
        const reportId = this.getAttribute('data-id');
        console.log('Delete report type:', reportId);
        
        if (confirm('Are you sure you want to delete this report type?')) {
          const reportTypes = DB.get('reportTypes') || [];
          const updatedReportTypes = reportTypes.filter(r => r.id !== reportId);
          DB.set('reportTypes', updatedReportTypes);
          location.reload();
        }
      });
    });
    
    // Frequency modal handling
    const frequencyModal = document.getElementById('frequency-modal');
    const frequencyForm = document.getElementById('frequency-form');
    const frequencyIdField = document.getElementById('frequency-id');
    const frequencyNameField = document.getElementById('frequency-name');
    const frequencyDescriptionField = document.getElementById('frequency-description');
    
    // Add Frequency button
    const addFrequencyBtn = document.getElementById('add-frequency-btn');
    if (addFrequencyBtn) {
      addFrequencyBtn.addEventListener('click', function() {
        console.log('Add Frequency button clicked');
        
        // Reset form
        frequencyIdField.value = '';
        frequencyNameField.value = '';
        frequencyDescriptionField.value = '';
        
        // Update modal title
        document.getElementById('frequency-modal-title').textContent = 'Add Frequency';
        
        // Show modal
        frequencyModal.style.display = 'block';
      });
    }
    
    // Frequency Form Submission
    if (frequencyForm) {
      frequencyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Frequency form submitted');
        
        const frequencyId = frequencyIdField.value;
        const frequencyName = frequencyNameField.value;
        const frequencyDescription = frequencyDescriptionField.value;
        
        if (!frequencyName) {
          alert('Frequency name is required');
          return;
        }
        
        const frequencies = DB.get('frequencies') || [];
        
        if (frequencyId) {
          // Update existing frequency
          const frequencyIndex = frequencies.findIndex(f => f.id === frequencyId);
          if (frequencyIndex !== -1) {
            frequencies[frequencyIndex].name = frequencyName;
            frequencies[frequencyIndex].description = frequencyDescription;
          }
        } else {
          // Create new frequency
          const newFrequency = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            name: frequencyName,
            description: frequencyDescription
          };
          frequencies.push(newFrequency);
        }
        
        // Save to local storage
        DB.set('frequencies', frequencies);
        
        // Close modal
        frequencyModal.style.display = 'none';
        
        // Refresh the table
        location.reload();
      });
    }
    
    // Frequency Edit/Delete buttons
    document.querySelectorAll('#frequencies-settings-table .action-icon.edit').forEach(button => {
      button.addEventListener('click', function() {
        const frequencyId = this.getAttribute('data-id');
        console.log('Edit frequency:', frequencyId);
        
        // Find the frequency
        const frequencies = DB.get('frequencies') || [];
        const frequency = frequencies.find(f => f.id === frequencyId);
        
        if (frequency) {
          // Populate the form
          frequencyIdField.value = frequency.id;
          frequencyNameField.value = frequency.name;
          frequencyDescriptionField.value = frequency.description || '';
          
          // Update modal title
          document.getElementById('frequency-modal-title').textContent = 'Edit Frequency';
          
          // Show modal
          frequencyModal.style.display = 'block';
        }
      });
    });
    
    document.querySelectorAll('#frequencies-settings-table .action-icon.delete').forEach(button => {
      button.addEventListener('click', function() {
        const frequencyId = this.getAttribute('data-id');
        console.log('Delete frequency:', frequencyId);
        
        if (confirm('Are you sure you want to delete this frequency?')) {
          const frequencies = DB.get('frequencies') || [];
          const updatedFrequencies = frequencies.filter(f => f.id !== frequencyId);
          DB.set('frequencies', updatedFrequencies);
          location.reload();
        }
      });
    });
    
    // Format modal handling
    const formatModal = document.getElementById('format-modal');
    const formatForm = document.getElementById('format-form');
    const formatIdField = document.getElementById('format-id');
    const formatNameField = document.getElementById('format-name');
    const formatDescriptionField = document.getElementById('format-description');
    
    // Add Format button
    const addFormatBtn = document.getElementById('add-format-btn');
    if (addFormatBtn) {
      addFormatBtn.addEventListener('click', function() {
        console.log('Add Format button clicked');
        
        // Reset form
        formatIdField.value = '';
        formatNameField.value = '';
        formatDescriptionField.value = '';
        
        // Update modal title
        document.getElementById('format-modal-title').textContent = 'Add Format';
        
        // Show modal
        formatModal.style.display = 'block';
      });
    }
    
    // Format Form Submission
    if (formatForm) {
      formatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Format form submitted');
        
        const formatId = formatIdField.value;
        const formatName = formatNameField.value;
        const formatDescription = formatDescriptionField.value;
        
        if (!formatName) {
          alert('Format name is required');
          return;
        }
        
        const formats = DB.get('formats') || [];
        
        if (formatId) {
          // Update existing format
          const formatIndex = formats.findIndex(f => f.id === formatId);
          if (formatIndex !== -1) {
            formats[formatIndex].name = formatName;
            formats[formatIndex].description = formatDescription;
          }
        } else {
          // Create new format
          const newFormat = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            name: formatName,
            description: formatDescription
          };
          formats.push(newFormat);
        }
        
        // Save to local storage
        DB.set('formats', formats);
        
        // Close modal
        formatModal.style.display = 'none';
        
        // Refresh the table
        location.reload();
      });
    }
    
    // Format Edit/Delete buttons
    document.querySelectorAll('#formats-settings-table .action-icon.edit').forEach(button => {
      button.addEventListener('click', function() {
        const formatId = this.getAttribute('data-id');
        console.log('Edit format:', formatId);
        
        // Find the format
        const formats = DB.get('formats') || [];
        const format = formats.find(f => f.id === formatId);
        
        if (format) {
          // Populate the form
          formatIdField.value = format.id;
          formatNameField.value = format.name;
          formatDescriptionField.value = format.description || '';
          
          // Update modal title
          document.getElementById('format-modal-title').textContent = 'Edit Format';
          
          // Show modal
          formatModal.style.display = 'block';
        }
      });
    });
    
    document.querySelectorAll('#formats-settings-table .action-icon.delete').forEach(button => {
      button.addEventListener('click', function() {
        const formatId = this.getAttribute('data-id');
        console.log('Delete format:', formatId);
        
        if (confirm('Are you sure you want to delete this format?')) {
          const formats = DB.get('formats') || [];
          const updatedFormats = formats.filter(f => f.id !== formatId);
          DB.set('formats', updatedFormats);
          location.reload();
        }
      });
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, .cancel-btn').forEach(button => {
      button.addEventListener('click', function() {
        document.querySelectorAll('.modal').forEach(modal => {
          modal.style.display = 'none';
        });
      });
    });
  }
  
  // Initialize reports page
  if (currentPage === 'reports.html') {
    console.log('Initializing reports page...');
    
    // Populate department filter
    const departmentsData = DB.get('departments') || [];
    const departmentFilter = document.getElementById('department-filter');
    if (departmentFilter) {
      departmentsData.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        departmentFilter.appendChild(option);
      });
    }
    

    
    // Render reports table
    const reportsData = DB.get('reports') || [];
    const reportsTable = document.getElementById('reports-table');
    if (reportsTable && reportsTable.querySelector('tbody')) {
      const tbody = reportsTable.querySelector('tbody');
      tbody.innerHTML = '';
      
      reportsData.forEach(report => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${report.name}</td>
          <td>${report.department}</td>
          <td>${report.reportType}</td>
          <td>${report.submitter}</td>
          <td>${report.submissionDate}</td>
          <td><span class="status-badge ${report.status.toLowerCase()}">${report.status}</span></td>
          <td>${report.format}</td>
          <td>
            <button class="action-icon view" data-id="${report.id}"><i class="fas fa-eye"></i></button>
            <button class="action-icon download" data-id="${report.id}"><i class="fas fa-download"></i></button>
            <button class="action-icon delete" data-id="${report.id}"><i class="fas fa-trash"></i></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      // Add row click event for report preview
      tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', function() {
          const reportId = this.querySelector('.action-icon.view').getAttribute('data-id');
          const report = reportsData.find(r => r.id === reportId);
          
          if (report) {
            // Update preview section
            document.getElementById('preview-title').textContent = report.name;
            document.getElementById('preview-info').textContent = `${report.department} | ${report.submissionDate}`;
            document.getElementById('no-preview-message').style.display = 'none';
            
            const previewImage = document.getElementById('preview-image');
            previewImage.src = report.fileUrl || 'assets/images/no-preview.png';
            previewImage.style.display = 'block';
            
            // Enable preview buttons
            document.getElementById('preview-download-btn').disabled = false;
            document.getElementById('preview-details-btn').disabled = false;
            
            // Highlight selected row
            tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
            this.classList.add('selected-row');
          }
        });
      });
      
      // Initialize the upload report button
      const uploadReportBtn = document.getElementById('upload-report-btn');
      const uploadReportModal = document.getElementById('upload-report-modal');
      
      if (uploadReportBtn && uploadReportModal) {
        uploadReportBtn.addEventListener('click', function() {
          console.log('Upload Report button clicked');
          
          // Show the upload modal
          uploadReportModal.style.display = 'block';
          
          // Populate department dropdown
          const departmentDropdown = document.getElementById('report-department-upload');
          if (departmentDropdown) {
            departmentDropdown.innerHTML = '<option value="">Select Department</option>';
            departmentsData.forEach(dept => {
              const option = document.createElement('option');
              option.value = dept.name;
              option.textContent = dept.name;
              departmentDropdown.appendChild(option);
            });
          }
        });
      }
      
      // Handle report department change to update report types
      const reportDepartmentUpload = document.getElementById('report-department-upload');
      if (reportDepartmentUpload) {
        reportDepartmentUpload.addEventListener('change', function() {
          const selectedDepartment = this.value;
          const reportTypeDropdown = document.getElementById('report-type');
          
          if (reportTypeDropdown) {
            reportTypeDropdown.innerHTML = selectedDepartment 
              ? '<option value="">Select Report Type</option>' 
              : '<option value="">Select Department First</option>';
            
            if (selectedDepartment) {
              const departmentReportTypes = reportTypesData.filter(rt => rt.department === selectedDepartment);
              departmentReportTypes.forEach(rt => {
                const option = document.createElement('option');
                option.value = rt.name;
                option.textContent = rt.name;
                reportTypeDropdown.appendChild(option);
              });
            }
          }
        });
      }
      
      // NOTE: Upload form submission is now handled by integration-fix.js
      // This handler has been disabled to prevent conflicts
      
      // Helper function to get preview image based on format
      function getPreviewImageForFormat(format) {
        switch(format.toLowerCase()) {
          case 'pdf': return 'assets/images/pdf-preview.png';
          case 'excel': return 'assets/images/excel-preview.png';
          case 'word': return 'assets/images/word-preview.png';
          case 'powerpoint': return 'assets/images/powerpoint-preview.png';
          default: return 'assets/images/generic-preview.png';
        }
      }
      
      // Close modal buttons
      document.querySelectorAll('.modal-close, .cancel-btn').forEach(button => {
        button.addEventListener('click', function() {
          document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
          });
        });
      });
    }
  }
  
  console.log('🎉 Data loading fix initialized successfully!');
}); 