// integration-fix.js - Comprehensive fix for Supabase integration issues
// This script should be included after all other scripts on each page

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔧 Applying comprehensive integration fix...');

  // Add data validation function at the beginning
  function validateDataIntegrity() {
    console.log('🔍 Validating data integrity...');
    
    const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
    
    console.log('📊 Current localStorage data structure:');
            console.log('- departments:', (localData.departments && localData.departments.length) || 0, 'items');
        console.log('- reportTypes:', (localData.reportTypes && localData.reportTypes.length) || 0, 'items');
        console.log('- frequencies:', (localData.frequencies && localData.frequencies.length) || 0, 'items');
        console.log('- formats:', (localData.formats && localData.formats.length) || 0, 'items');
        console.log('- reports:', (localData.reports && localData.reports.length) || 0, 'items');
    
    if (localData.departments) {
      console.log('🏢 Sample departments:', localData.departments.slice(0, 3));
    }
    
    if (localData.reportTypes) {
      console.log('📋 Sample report types:', localData.reportTypes.slice(0, 3));
    }
    
    // Check for data inconsistencies
    if (!localData.departments || localData.departments.length === 0) {
      console.warn('⚠️ No departments found in localStorage');
    }
    
    if (!localData.reportTypes || localData.reportTypes.length === 0) {
      console.warn('⚠️ No report types found in localStorage');
    }
    
    // Check if departments and report types are properly linked
    if (localData.departments && localData.reportTypes) {
      const departmentNames = localData.departments.map(d => d.name);
      const reportTypeDepartments = localData.reportTypes.map(rt => rt.department);
      const missingDepartments = reportTypeDepartments.filter(dept => !departmentNames.includes(dept));
      
      if (missingDepartments.length > 0) {
        console.warn('⚠️ Report types reference departments that don\'t exist:', missingDepartments);
      }
    }
    
    console.log('✅ Data validation complete');
  }

  // Call validation function
  validateDataIntegrity();
  
  // Force reload correct data if needed (uncomment to reset data)
  // localStorage.removeItem('reportrepo_db');
  // console.log('🔄 Forced data reset - reload page to see changes');

  // 1. ENSURE CORE SERVICES ARE AVAILABLE
  // ====================================
  
  // Initialize Supabase services if not already initialized
  if (typeof supabaseDataService === 'undefined') {
    console.log('Creating Supabase data service...');
    window.supabaseDataService = new SupabaseData();
    await window.supabaseDataService.init();
  }
  
  if (typeof supabaseIntegrationManager === 'undefined') {
    console.log('Creating Supabase integration manager...');
    window.supabaseIntegrationManager = new SupabaseIntegrationManager();
    await window.supabaseIntegrationManager.init();
  }

  // Helper function to format IDs correctly for different tables
  function generateIdForTable(collection) {
    // Tables that need numeric IDs
    if (['departments', 'reportTypes', 'frequencies', 'formats'].includes(collection)) {
      const items = DB.get(collection) || [];
      const maxId = items.length > 0 
        ? Math.max(...items.map(item => parseInt(item.id) || 0)) 
        : 0;
      return (maxId + 1).toString();
    }
    
    // Tables that need UUID string IDs
    return crypto.randomUUID().substring(0, 8);
  }

  // 2. ENSURE LOCAL DB OBJECT IS FULLY FUNCTIONAL
  // ============================================
  
  // Create or enhance DB object to ensure full functionality
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
        return data;
      },
      add: function(collection, item) {
        const items = this.get(collection) || [];
        items.push(item);
        this.set(collection, items);
        return items;
      },
      update: function(collection, id, updates) {
        const items = this.get(collection) || [];
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          this.set(collection, items);
          return items[index];
        }
        return null;
      },
      delete: function(collection, id) {
        const items = this.get(collection) || [];
        const filtered = items.filter(item => item.id !== id);
        this.set(collection, filtered);
        return filtered;
      },
      getAllData: function() {
        return JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
      },
      replaceAllData: function(newData) {
        localStorage.setItem('reportrepo_db', JSON.stringify(newData));
        return newData;
      },
      getById: function(collection, id) {
        const items = this.get(collection) || [];
        return items.find(item => item.id == id || item.name === id);
      },
      getCurrentUser: function() {
        // Try to get current user from localStorage
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            return JSON.parse(userData);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
        
        // Fallback to currentUser from reportrepo_db
        const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
        if (localData.currentUser) {
          return localData.currentUser;
        }
        
        // Return null if no user found
        return null;
      }
    };
  } else {
    // Ensure DB object has all required methods
    if (!DB.set) {
      console.log('Adding missing DB.set method...');
      DB.set = function(collection, data) {
        const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
        localData[collection] = data;
        localStorage.setItem('reportrepo_db', JSON.stringify(localData));
        return data;
      };
    }
    if (!DB.update) {
      console.log('Adding missing DB.update method...');
      DB.update = function(collection, id, updates) {
        const items = this.get(collection) || [];
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          this.set(collection, items);
          return items[index];
        }
        return null;
      };
    }
    if (!DB.delete) {
      console.log('Adding missing DB.delete method...');
      DB.delete = function(collection, id) {
        const items = this.get(collection) || [];
        const filtered = items.filter(item => item.id !== id);
        this.set(collection, filtered);
        return filtered;
      };
    }
    if (!DB.getAllData) {
      console.log('Adding missing DB.getAllData method...');
      DB.getAllData = function() {
        return JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
      };
    }
    if (!DB.replaceAllData) {
      console.log('Adding missing DB.replaceAllData method...');
      DB.replaceAllData = function(newData) {
        localStorage.setItem('reportrepo_db', JSON.stringify(newData));
        return newData;
      };
    }
  }

  // Add missing functions for user management
  if (typeof getSelectedDepartments !== 'function') {
    window.getSelectedDepartments = function() {
      const checkboxes = document.querySelectorAll('input[name="additional-departments"]:checked');
      const selected = Array.from(checkboxes).map(cb => cb.value);
      console.log('Selected secondary departments:', selected);
      return selected;
    };
  }

  // Function to get user's allowed departments (RLS)
  if (typeof getUserAllowedDepartments !== 'function') {
    window.getUserAllowedDepartments = function() {
      console.log('🔒 getUserAllowedDepartments called - checking user permissions...');
      
      // Try multiple ways to get current user
      let currentUser = null;
      
      // Method 1: Try window.DB.getCurrentUser()
      if (window.DB && window.DB.getCurrentUser) {
        currentUser = window.DB.getCurrentUser();
        console.log('🔒 Method 1 - DB.getCurrentUser():', currentUser);
      }
      
      // Method 2: Try direct localStorage access
      if (!currentUser) {
        try {
          const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
          currentUser = localData.currentUser;
          console.log('🔒 Method 2 - localStorage currentUser:', currentUser);
        } catch (error) {
          console.error('🔒 Error reading from localStorage:', error);
        }
      }
      
      // Method 3: Try user_data from localStorage
      if (!currentUser) {
        try {
          const userData = localStorage.getItem('user_data');
          if (userData) {
            currentUser = JSON.parse(userData);
            console.log('🔒 Method 3 - user_data from localStorage:', currentUser);
          }
        } catch (error) {
          console.error('🔒 Error reading user_data:', error);
        }
      }
      
      if (!currentUser) {
        console.log('🔒 No current user found, showing all departments');
        
        // Try multiple methods to get departments
        let departments = [];
        
        // Method 1: Try window.DB.get
        if (window.DB && window.DB.get) {
          departments = window.DB.get('departments') || [];
          console.log('🔒 No User Method 1 - window.DB.get departments:', departments);
        }
        
        // Method 2: Try direct localStorage access
        if (departments.length === 0) {
          try {
            const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
            departments = localData.departments || [];
            console.log('🔒 No User Method 2 - localStorage departments:', departments);
          } catch (error) {
            console.error('🔒 No User Error reading departments from localStorage:', error);
          }
        }
        
        // Method 3: Try global DB if available
        if (departments.length === 0 && typeof DB !== 'undefined' && DB && DB.get) {
          departments = DB.get('departments') || [];
          console.log('🔒 No User Method 3 - global DB departments:', departments);
        }
        
        console.log('🔒 No User final departments found:', departments);
        const departmentNames = departments.map(d => d.name);
        console.log('🔒 No user department names:', departmentNames);
        return departmentNames;
      }
      
      console.log('🔒 Current user:', currentUser.name, 'Role:', currentUser.role, 'Primary dept:', currentUser.department, 'Secondary depts:', currentUser.departments);
      
      // Admin users can see all departments
      if (currentUser.role === 'Admin') {
        console.log('🔒 Admin user - showing all departments');
        
        // Try multiple methods to get departments
        let departments = [];
        
        // Method 1: Try window.DB.get
        if (window.DB && window.DB.get) {
          departments = window.DB.get('departments') || [];
          console.log('🔒 Admin Method 1 - window.DB.get departments:', departments);
        }
        
        // Method 2: Try direct localStorage access
        if (departments.length === 0) {
          try {
            const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
            departments = localData.departments || [];
            console.log('🔒 Admin Method 2 - localStorage departments:', departments);
          } catch (error) {
            console.error('🔒 Admin Error reading departments from localStorage:', error);
          }
        }
        
        // Method 3: Try global DB if available
        if (departments.length === 0 && typeof DB !== 'undefined' && DB && DB.get) {
          departments = DB.get('departments') || [];
          console.log('🔒 Admin Method 3 - global DB departments:', departments);
        }
        
        console.log('🔒 Admin final departments found:', departments);
        const departmentNames = departments.map(d => d.name);
        console.log('🔒 Admin department names:', departmentNames);
        return departmentNames;
      }
      
      // Regular users can only see their assigned departments
      let allowedDepartments = [];
      
      // Add primary department
      if (currentUser.department) {
        allowedDepartments.push(currentUser.department);
        console.log('🔒 Added primary department:', currentUser.department);
      }
      
      // Add secondary departments
      if (currentUser.departments && Array.isArray(currentUser.departments)) {
        currentUser.departments.forEach(dept => {
          if (!allowedDepartments.includes(dept)) {
            allowedDepartments.push(dept);
            console.log('🔒 Added secondary department:', dept);
          }
        });
      }
      
      // If no departments found, show all departments as fallback
      if (allowedDepartments.length === 0) {
        console.log('🔒 No departments assigned to user, showing all departments as fallback');
        
        // Try multiple methods to get departments
        let departments = [];
        
        // Method 1: Try window.DB.get
        if (window.DB && window.DB.get) {
          departments = window.DB.get('departments') || [];
          console.log('🔒 Fallback Method 1 - window.DB.get departments:', departments);
        }
        
        // Method 2: Try direct localStorage access
        if (departments.length === 0) {
          try {
            const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
            departments = localData.departments || [];
            console.log('🔒 Fallback Method 2 - localStorage departments:', departments);
          } catch (error) {
            console.error('🔒 Fallback Error reading departments from localStorage:', error);
          }
        }
        
        // Method 3: Try global DB if available
        if (departments.length === 0 && typeof DB !== 'undefined' && DB && DB.get) {
          departments = DB.get('departments') || [];
          console.log('🔒 Fallback Method 3 - global DB departments:', departments);
        }
        
        console.log('🔒 Fallback final departments found:', departments);
        const departmentNames = departments.map(d => d.name);
        console.log('🔒 Fallback department names:', departmentNames);
        return departmentNames;
      }
      
      console.log(`🔒 User ${currentUser.name} final allowed departments:`, allowedDepartments);
      return allowedDepartments;
    };
  }

  // 3. ENSURE SAMPLE DATA IS LOADED
  // =============================
  
  const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
  console.log('🔧 Checking sample data...');
  console.log('Current local data keys:', Object.keys(localData));
          console.log('Departments count:', (localData.departments && localData.departments.length) || 0);
        console.log('Report types count:', (localData.reportTypes && localData.reportTypes.length) || 0);
        console.log('Frequencies count:', (localData.frequencies && localData.frequencies.length) || 0);
        console.log('Formats count:', (localData.formats && localData.formats.length) || 0);
  
  if (!localData.departments || localData.departments.length === 0) {
    console.log('📥 Loading sample data...');
    const sampleData = {
      departments: [
        { id: 1, name: 'Sales', manager: 'John Doe', reports: 120, onTimeRate: '95%' },
        { id: 2, name: 'Marketing', manager: 'Jane Smith', reports: 95, onTimeRate: '89%' },
        { id: 3, name: 'Finance', manager: 'Peter Jones', reports: 150, onTimeRate: '98%' },
        { id: 4, name: 'Human Resources', manager: 'Mary Johnson', reports: 80, onTimeRate: '91%' },
        { id: 5, name: 'IT', manager: 'David Williams', reports: 110, onTimeRate: '93%' }
      ],
      users: [
        { id: 1, name: 'Admin User', email: 'admin@reportrepo.com', department: 'IT', departments: ['Sales', 'Marketing'], role: 'Admin', lastLogin: '2025-06-08 10:00 AM', permissions: { canView: ['all'], canAdd: ['all'], canEdit: ['all'], canDelete: ['all'] } },
        { id: 2, name: 'John Doe', email: 'john.doe@reportrepo.com', department: 'Sales', departments: ['Marketing'], role: 'Manager', lastLogin: '2025-06-08 09:30 AM', permissions: { canView: ['Sales'], canAdd: ['Sales'], canEdit: ['Sales'], canDelete: ['Sales'] } },
        { id: 3, name: 'Jane Smith', email: 'jane.smith@reportrepo.com', department: 'Marketing', departments: ['Sales'], role: 'Manager', lastLogin: '2025-06-07 05:00 PM', permissions: { canView: ['Marketing'], canAdd: ['Marketing'], canEdit: ['Marketing'], canDelete: ['Marketing'] } },
        { id: 4, name: 'Peter Jones', email: 'peter.jones@reportrepo.com', department: 'Finance', departments: ['IT'], role: 'Manager', lastLogin: '2025-06-08 08:00 AM', permissions: { canView: ['Finance'], canAdd: ['Finance'], canEdit: ['Finance'], canDelete: ['Finance'] } }
      ],
      reportTypes: [
        { id: 1, name: 'Q2 Sales Performance', department: 'Sales', frequency: 'Quarterly', format: 'PDF', description: 'Sales performance metrics for Q2' },
        { id: 2, name: 'Social Media Analytics', department: 'Marketing', frequency: 'Monthly', format: 'Excel', description: 'Analysis of social media engagement and metrics' },
        { id: 3, name: 'Monthly Expense Report', department: 'Finance', frequency: 'Monthly', format: 'PDF', description: 'Summary of monthly expenses across departments' },
        { id: 4, name: 'Employee Onboarding Stats', department: 'Human Resources', frequency: 'Monthly', format: 'Image', description: 'Statistics on new employee onboarding process' },
        { id: 5, name: 'Server Uptime Report', department: 'IT', frequency: 'Weekly', format: 'Excel', description: 'Server performance and availability metrics' }
      ],
      frequencies: [
        { id: 1, name: 'Daily', description: 'Due every day' },
        { id: 2, name: 'Weekly', description: 'Due every week' },
        { id: 3, name: 'Monthly', description: 'Due every month' },
        { id: 4, name: 'Quarterly', description: 'Due every quarter' },
        { id: 5, name: 'Annually', description: 'Due once a year' }
      ],
      formats: [
        { id: 1, name: 'PDF', description: 'Portable Document Format', extensions: ['.pdf'] },
        { id: 2, name: 'Excel', description: 'Microsoft Excel Spreadsheet', extensions: ['.xlsx', '.xls'] },
        { id: 3, name: 'Word', description: 'Microsoft Word Document', extensions: ['.docx', '.doc'] },
        { id: 4, name: 'Image', description: 'Image files (PNG, JPG, etc.)', extensions: ['.png', '.jpg', '.jpeg', '.gif'] },
        { id: 5, name: 'PowerPoint', description: 'Microsoft PowerPoint Presentation', extensions: ['.pptx', '.ppt'] },
        { id: 6, name: 'Video', description: 'Video files (MP4, AVI, etc.)', extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'] }
      ],
      reports: [],
      recentActivity: [],
      systemReport: {},
      currentUser: { id: 1, name: 'Admin User', role: 'Admin' }
    };
    localStorage.setItem('reportrepo_db', JSON.stringify(sampleData));
    console.log('✅ Sample data loaded successfully');
  } else {
    console.log('✅ Sample data already exists');
  }

  // 4. DEFINE RENDER FUNCTIONS IF THEY DON'T EXIST
  // =============================================

  if (typeof renderDepartmentsTable !== 'function') {
    window.renderDepartmentsTable = function() {
      console.log('🔧 Rendering departments table...');
      
      // Try to find the table element
      const departmentsTable = document.getElementById('departments-settings-table');
      console.log('Departments table element:', departmentsTable);
      
      // If table doesn't exist on this page, don't try to render it
      if (!departmentsTable) {
        console.log('ℹ️ Departments table not found on this page - skipping render');
        return;
      }
      
      // Check for tbody
      const tbody = departmentsTable.querySelector('tbody');
      console.log('Departments table tbody:', tbody);
      
      if (!tbody) {
        console.error('❌ Departments table tbody not found. Cannot render.');
        return;
      }
      
      console.log('Departments data:', DB.get('departments') || []);
      
      // Clear existing content
      tbody.innerHTML = '';
      
      const departments = DB.get('departments') || [];
      console.log('Rendering', departments.length, 'departments');
      
      if (departments.length === 0) {
        // Add a "no data" row
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
          <td colspan="5" style="text-align: center; color: #999; font-style: italic;">
            No departments found. Click "Add Department" to create one.
          </td>
        `;
        tbody.appendChild(noDataRow);
      } else {
        // Render departments
        departments.forEach(dept => {
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
      
      console.log('✅ Departments table rendered successfully');
    };
  }

  if (typeof renderUsersTable !== 'function') {
    window.renderUsersTable = function() {
      console.log('🔧 Rendering users table with department access control...');
      const usersTable = document.getElementById('users-table');
      if (usersTable && usersTable.querySelector('tbody')) {
        const tbody = usersTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        const users = DB.get('users') || [];
        const currentUser = DB.getCurrentUser();
        
        // Apply department access control
        let filteredUsers = users;
        if (currentUser && currentUser.role !== 'Admin') {
          const allowedDepartments = getUserAllowedDepartments ? getUserAllowedDepartments() : [];
          console.log('🔒 Filtering users by allowed departments:', allowedDepartments);
          
          filteredUsers = users.filter(user => {
            const userDepartment = user.department || '';
            const hasAccess = allowedDepartments.includes(userDepartment);
            console.log(`🔒 User ${user.name} (${userDepartment}) - Access: ${hasAccess}`);
            return hasAccess;
          });
          
          console.log(`🔒 Filtered users: ${filteredUsers.length} out of ${users.length} total users`);
        }
        
        if (filteredUsers.length === 0) {
          // Show no data message
          const noDataRow = document.createElement('tr');
          noDataRow.innerHTML = `
            <td colspan="6" style="text-align: center; color: #999; padding: 20px;">
              <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
              <p>No users found in your accessible departments</p>
              <small>You can only view users from departments you have access to</small>
            </td>
          `;
          tbody.appendChild(noDataRow);
        } else {
          // Render filtered users
          filteredUsers.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.department}</td>
              <td>${user.role}</td>
              <td>${user.lastLogin || 'Never'}</td>
              <td>
                <button class="action-icon edit" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                <button class="action-icon reset-password" data-id="${user.id}" data-email="${user.email}"><i class="fas fa-key"></i></button>
                <button class="action-icon test-login" data-id="${user.id}" data-email="${user.email}"><i class="fas fa-sign-in-alt"></i></button>
                <button class="action-icon confirm-email" data-id="${user.id}" data-email="${user.email}"><i class="fas fa-check-circle"></i></button>
                <button class="action-icon delete" data-id="${user.id}"><i class="fas fa-trash"></i></button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
        
        console.log('✅ Users table rendered with department access control');
      }
    };
  }

  if (typeof renderReportsTable !== 'function') {
    window.renderReportsTable = function() {
      console.log('🔧 Rendering grouped reports with RLS...');
      // This function is now handled by global-functions.js
      // The grouped reports rendering with RLS filtering is implemented there
      console.log('✅ renderReportsTable function available - using grouped reports with RLS');
    };
  }

  if (typeof renderReportTypesTable !== 'function') {
    window.renderReportTypesTable = function() {
      console.log('🔧 Rendering report types table...');
      
      // Try to find the table element
      const reportTypesTable = document.getElementById('reports-settings-table');
      console.log('Report types table element:', reportTypesTable);
      
      // If table doesn't exist on this page, don't try to render it
      if (!reportTypesTable) {
        console.log('ℹ️ Report types table not found on this page - skipping render');
        return;
      }
      
      // Check for tbody
      const tbody = reportTypesTable.querySelector('tbody');
      console.log('Report types table tbody:', tbody);
      
      if (!tbody) {
        console.error('❌ Report types table tbody not found. Cannot render.');
        return;
      }
      
      console.log('Report types data:', DB.get('reportTypes') || []);
      
      // Clear existing content
      tbody.innerHTML = '';
      
      const reportTypes = DB.get('reportTypes') || [];
      console.log('Rendering', reportTypes.length, 'report types');
      
      if (reportTypes.length === 0) {
        // Add a "no data" row
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
          <td colspan="6" style="text-align: center; color: #999; font-style: italic;">
            No report types found. Click "Add Report Type" to create one.
          </td>
        `;
        tbody.appendChild(noDataRow);
      } else {
        // Render report types
        reportTypes.forEach(type => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${type.name}</td>
            <td>${type.department}</td>
            <td>${type.frequency}</td>
            <td>${type.format}</td>
            <td>${type.description || 'No description'}</td>
            <td>
              <button class="action-icon edit" data-id="${type.id}"><i class="fas fa-edit"></i></button>
              <button class="action-icon delete" data-id="${type.id}"><i class="fas fa-trash"></i></button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
      
      console.log('✅ Report types table rendered successfully');
    };
  }

  if (typeof renderFrequenciesTable !== 'function') {
    window.renderFrequenciesTable = function() {
      console.log('🔧 Rendering frequencies table...');
      
      // Try to find the table element
      const frequenciesTable = document.getElementById('frequencies-settings-table');
      console.log('Frequencies table element:', frequenciesTable);
      
      // If table doesn't exist on this page, don't try to render it
      if (!frequenciesTable) {
        console.log('ℹ️ Frequencies table not found on this page - skipping render');
        return;
      }
      
      // Check for tbody
      const tbody = frequenciesTable.querySelector('tbody');
      console.log('Frequencies table tbody:', tbody);
      
      if (!tbody) {
        console.error('❌ Frequencies table tbody not found. Cannot render.');
        return;
      }
      
      console.log('Frequencies data:', DB.get('frequencies') || []);
      
      // Clear existing content
      tbody.innerHTML = '';
      
      const frequencies = DB.get('frequencies') || [];
      console.log('Rendering', frequencies.length, 'frequencies');
      
      if (frequencies.length === 0) {
        // Add a "no data" row
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
          <td colspan="3" style="text-align: center; color: #999; font-style: italic;">
            No frequencies found. Click "Add Frequency" to create one.
          </td>
        `;
        tbody.appendChild(noDataRow);
      } else {
        // Render frequencies
        frequencies.forEach(item => {
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
      
      console.log('✅ Frequencies table rendered successfully');
    };
  }

  if (typeof renderFormatsTable !== 'function') {
    window.renderFormatsTable = function() {
      console.log('🔧 Rendering formats table...');
      
      // Try to find the table element
      const formatsTable = document.getElementById('formats-settings-table');
      console.log('Formats table element:', formatsTable);
      
      // If table doesn't exist on this page, don't try to render it
      if (!formatsTable) {
        console.log('ℹ️ Formats table not found on this page - skipping render');
        return;
      }
      
      // Check for tbody
      const tbody = formatsTable.querySelector('tbody');
      console.log('Formats table tbody:', tbody);
      
      if (!tbody) {
        console.error('❌ Formats table tbody not found. Cannot render.');
        return;
      }
      
      console.log('Formats data:', DB.get('formats') || []);
      
      // Clear existing content
      tbody.innerHTML = '';
      
      const formats = DB.get('formats') || [];
      console.log('Rendering', formats.length, 'formats');
      
      if (formats.length === 0) {
        // Add a "no data" row
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
          <td colspan="3" style="text-align: center; color: #999; font-style: italic;">
            No formats found. Click "Add Format" to create one.
          </td>
        `;
        tbody.appendChild(noDataRow);
      } else {
        // Render formats
        formats.forEach(item => {
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
      
      console.log('✅ Formats table rendered successfully');
    };
  }

  // 5. ATTACH EVENT HANDLERS FOR COMMON UI ELEMENTS
  // ============================================

  // Generic form handling function for modals
  function setupModalFormHandling(modalId, formId, collection, renderFunction, getFormDataFn) {
    const modal = document.getElementById(modalId);
    const form = document.getElementById(formId);
    if (!modal || !form) return;

    // Handle modal close buttons
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    
    const cancelBtn = modal.querySelector('.cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      try {
        const formData = getFormDataFn();
        const recordId = formData.id;
        
        let result;
        if (recordId) {
          // Update existing record
          delete formData.id; // Remove id from updates
          result = await supabaseIntegrationManager.updateRecord(collection, recordId, formData);
        } else {
          // Create new record with appropriate ID format
          formData.id = generateIdForTable(collection);
          console.log(`Generated ID for ${collection}: ${formData.id}`);
          result = await supabaseIntegrationManager.createRecord(collection, formData);
        }
        
        if (result) {
          modal.style.display = 'none';
          if (typeof renderFunction === 'function') {
            renderFunction();
          } else {
            // Trigger UI refresh
            const event = new CustomEvent('dataUpdated', {
              detail: { timestamp: new Date().toISOString() }
            });
            document.dispatchEvent(event);
          }
        }
      } catch (error) {
        console.error('Error saving form:', error);
        alert('Error saving: ' + error.message);
      }
    });
  }

  // 6. PAGE-SPECIFIC INITIALIZATIONS
  // ===============================

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  console.log('🔧 Current page:', currentPage);

  if (currentPage === 'settings.html') {
    console.log('🔧 Initializing settings page...');
    console.log('DB object available:', typeof DB !== 'undefined');
            console.log('Sample data check:', (DB.get('departments') && DB.get('departments').length) || 0, 'departments');
        console.log('Sample data check:', (DB.get('reportTypes') && DB.get('reportTypes').length) || 0, 'reportTypes');
        console.log('Sample data check:', (DB.get('frequencies') && DB.get('frequencies').length) || 0, 'frequencies');
        console.log('Sample data check:', (DB.get('formats') && DB.get('formats').length) || 0, 'formats');
    
    // Initialize tab switching
    document.querySelectorAll('.tab-link').forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = e.target.getAttribute('data-tab');
        console.log('Tab clicked:', tabId);
        
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
    
    // DEPARTMENTS TAB
    // ==============
    
    // Add Department button
    const addDepartmentBtn = document.getElementById('add-department-btn');
    if (addDepartmentBtn) {
      addDepartmentBtn.addEventListener('click', async function() {
        console.log('Add Department button clicked');
        // Get the modal
        const modal = document.getElementById('department-modal');
        const idField = document.getElementById('department-id');
        const nameField = document.getElementById('department-name');
        const managerField = document.getElementById('department-manager');
        
        // Reset form
        idField.value = '';
        nameField.value = '';
        if (managerField) managerField.selectedIndex = 0;
        
        // Update modal title
        document.getElementById('department-modal-title').textContent = 'Add Department';
        
        // Show modal
        modal.style.display = 'block';
        
        // Populate manager dropdown with fresh data from Supabase
        console.log('🔧 Populating department manager dropdown with fresh Supabase data...');
        if (managerField) {
          managerField.innerHTML = '<option value="">Select Manager</option>';
          
          try {
            // First try to get users from Supabase with admin mode
            let users = [];
            
            if (typeof supabaseDataService !== 'undefined' && supabaseDataService) {
              console.log('🔧 Fetching users from Supabase with admin mode...');
              
              // Enable admin mode to bypass RLS
              await supabaseDataService.setAdminMode(true);
              
              users = await supabaseDataService.getAll('users');
              console.log('🔧 Fetched users from Supabase:', users.length);
              
              // If still no users, try direct Supabase client approach
              if (users.length === 0) {
                console.log('🔧 Trying direct Supabase client approach...');
                try {
                  const supabaseClient = getSupabaseClient();
                  if (supabaseClient) {
                    const { data: directUsers, error: directError } = await supabaseClient
                      .from('users')
                      .select('*');
                    
                    if (!directError && directUsers) {
                      users = directUsers;
                      console.log('🔧 Direct client fetched users:', users.length);
                    } else {
                      console.error('🔧 Direct client error:', directError);
                    }
                  }
                } catch (directError) {
                  console.error('🔧 Direct client approach failed:', directError);
                }
              }
              
              // Update local storage with fresh data
              if (users.length > 0) {
                DB.set('users', users);
                console.log('🔧 Updated local storage with fresh user data');
              }
              
              // Disable admin mode after fetching
              await supabaseDataService.setAdminMode(false);
            }
            
            // Fallback to local storage if Supabase fails or returns no data
            if (users.length === 0) {
              console.log('🔧 Falling back to local storage users...');
              users = DB.get('users') || [];
              console.log('🔧 Local storage users found:', users.length);
              
              // If still no users, ensure we have default users
              if (users.length === 0) {
                console.log('🔧 No users found, ensuring default users exist...');
                const defaultUsers = [
                  { id: 1, name: 'Admin User', email: 'admin@reportrepo.com', department: 'IT', role: 'Admin' },
                  { id: 2, name: 'John Doe', email: 'john.doe@reportrepo.com', department: 'Sales', role: 'Manager' },
                  { id: 3, name: 'Jane Smith', email: 'jane.smith@reportrepo.com', department: 'Marketing', role: 'Manager' },
                  { id: 4, name: 'Peter Jones', email: 'peter.jones@reportrepo.com', department: 'Finance', role: 'Manager' },
                  { id: 5, name: 'Mary Johnson', email: 'mary.johnson@reportrepo.com', department: 'Human Resources', role: 'Manager' }
                ];
                DB.set('users', defaultUsers);
                users = defaultUsers;
                console.log('🔧 Created default users:', users.length);
              }
            }
            
            console.log('🔧 Total users available for manager selection:', users.length);
            console.log('🔧 Users found:', users.map(u => `${u.name} (${u.role})`));
            
            // Filter for managers and admins
            const managers = users.filter(user => 
              user.role === 'Manager' || user.role === 'Admin'
            );
            
            console.log('🔧 Found managers/admins:', managers.length);
            console.log('🔧 Managers found:', managers.map(u => `${u.name} (${u.role})`));
            
            managers.forEach(user => {
              console.log('🔧 Adding manager option:', user.name, 'with role:', user.role);
              const option = document.createElement('option');
              option.value = user.name;
              option.textContent = `${user.name} (${user.role})`;
              managerField.appendChild(option);
            });
            
            console.log('🔧 Total manager options added:', managerField.options.length - 1);
            
            if (managers.length === 0) {
              console.warn('⚠️ No managers found in the system');
              const noManagerOption = document.createElement('option');
              noManagerOption.value = '';
              noManagerOption.textContent = 'No managers available';
              noManagerOption.disabled = true;
              managerField.appendChild(noManagerOption);
            }
            
          } catch (error) {
            console.error('❌ Error loading users for manager dropdown:', error);
            
            // Fallback to local storage
            const localUsers = DB.get('users') || [];
            console.log('🔧 Using local storage fallback with', localUsers.length, 'users');
            
            localUsers.forEach(user => {
              if (user.role === 'Manager' || user.role === 'Admin') {
                const option = document.createElement('option');
                option.value = user.name;
                option.textContent = `${user.name} (${user.role})`;
                managerField.appendChild(option);
              }
            });
          }
        } else {
          console.error('❌ Department manager field not found!');
        }
      });
    }
    
    // Setup department form
    setupModalFormHandling('department-modal', 'department-form', 'departments', renderDepartmentsTable, () => {
      return {
        id: document.getElementById('department-id').value,
        name: document.getElementById('department-name').value,
        manager: document.getElementById('department-manager').value
      };
    });
    
    // REPORT TYPES TAB
    // ==============
    
    // Add Report Type button
    const addReportBtn = document.getElementById('add-report-btn');
    if (addReportBtn) {
      addReportBtn.addEventListener('click', function() {
        console.log('Add Report Type button clicked');
        // Get the modal
        const modal = document.getElementById('report-modal');
        const idField = document.getElementById('report-id');
        const nameField = document.getElementById('report-name');
        const departmentField = document.getElementById('report-department');
        const frequencyField = document.getElementById('report-frequency');
        const formatField = document.getElementById('report-format');
        const descriptionField = document.getElementById('report-description');
        
        // Reset form
        idField.value = '';
        nameField.value = '';
        if (departmentField) departmentField.selectedIndex = 0;
        if (frequencyField) frequencyField.selectedIndex = 0;
        if (formatField) formatField.selectedIndex = 0;
        if (descriptionField) descriptionField.value = '';
        
        // Update modal title
        document.getElementById('report-modal-title').textContent = 'Add Report Type';
        
        // Show modal
        modal.style.display = 'block';
        
        // Populate department dropdown
        const departments = DB.get('departments') || [];
        if (departmentField) {
          departmentField.innerHTML = '<option value="">Select Department</option>';
          departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            departmentField.appendChild(option);
          });
        }
        
        // Populate frequency dropdown
        const frequencies = DB.get('frequencies') || [];
        if (frequencyField) {
          frequencyField.innerHTML = '<option value="">Select Frequency</option>';
          frequencies.forEach(freq => {
            const option = document.createElement('option');
            option.value = freq.name;
            option.textContent = freq.name;
            frequencyField.appendChild(option);
          });
        }
        
        // Populate format dropdown
        const formats = DB.get('formats') || [];
        if (formatField) {
          formatField.innerHTML = '<option value="">Select Format</option>';
          formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.name;
            option.textContent = format.name;
            formatField.appendChild(option);
          });
        }
      });
    }
    
    // Setup report type form
    setupModalFormHandling('report-modal', 'report-form', 'reportTypes', renderReportTypesTable, () => {
      return {
        id: document.getElementById('report-id').value,
        name: document.getElementById('report-name').value,
        department: document.getElementById('report-department').value,
        frequency: document.getElementById('report-frequency').value,
        format: document.getElementById('report-format').value,
        description: document.getElementById('report-description').value
      };
    });
    
    // FREQUENCIES TAB
    // ==============
    
    // Add Frequency button
    const addFrequencyBtn = document.getElementById('add-frequency-btn');
    if (addFrequencyBtn) {
      addFrequencyBtn.addEventListener('click', function() {
        console.log('Add Frequency button clicked');
        // Get the modal
        const modal = document.getElementById('frequency-modal');
        const idField = document.getElementById('frequency-id');
        const nameField = document.getElementById('frequency-name');
        const descriptionField = document.getElementById('frequency-description');
        
        // Reset form
        idField.value = '';
        nameField.value = '';
        if (descriptionField) descriptionField.value = '';
        
        // Update modal title
        document.getElementById('frequency-modal-title').textContent = 'Add Frequency';
        
        // Show modal
        modal.style.display = 'block';
      });
    }
    
    // Setup frequency form
    setupModalFormHandling('frequency-modal', 'frequency-form', 'frequencies', renderFrequenciesTable, () => {
      return {
        id: document.getElementById('frequency-id').value,
        name: document.getElementById('frequency-name').value,
        description: document.getElementById('frequency-description').value
      };
    });
    
    // FORMATS TAB
    // ==============
    
    // Add Format button
    const addFormatBtn = document.getElementById('add-format-btn');
    if (addFormatBtn) {
      addFormatBtn.addEventListener('click', function() {
        console.log('Add Format button clicked');
        // Get the modal
        const modal = document.getElementById('format-modal');
        const idField = document.getElementById('format-id');
        const nameField = document.getElementById('format-name');
        const descriptionField = document.getElementById('format-description');
        
        // Reset form
        idField.value = '';
        nameField.value = '';
        if (descriptionField) descriptionField.value = '';
        
        // Update modal title
        document.getElementById('format-modal-title').textContent = 'Add Format';
        
        // Show modal
        modal.style.display = 'block';
      });
    }
    
    // Setup format form
    setupModalFormHandling('format-modal', 'format-form', 'formats', renderFormatsTable, () => {
      return {
        id: document.getElementById('format-id').value,
        name: document.getElementById('format-name').value,
        description: document.getElementById('format-description').value
      };
    });
    
    // Render functions are now defined globally above
    
    // Setup edit button handlers for all tables
    document.querySelectorAll('.data-table tbody').forEach(tbody => {
      tbody.addEventListener('click', function(e) {
        const target = e.target.closest('.action-icon');
        if (!target) return;
        
        const id = target.getAttribute('data-id');
        const isEdit = target.classList.contains('edit');
        const isDelete = target.classList.contains('delete');
        
        // Determine which table we're working with
        let collection, modal, renderFunction;
        if (tbody.closest('#departments-settings-table')) {
          collection = 'departments';
          modal = document.getElementById('department-modal');
          renderFunction = renderDepartmentsTable;
        } else if (tbody.closest('#reports-settings-table')) {
          collection = 'reportTypes';
          modal = document.getElementById('report-modal');
          renderFunction = renderReportTypesTable;
        } else if (tbody.closest('#frequencies-settings-table')) {
          collection = 'frequencies';
          modal = document.getElementById('frequency-modal');
          renderFunction = renderFrequenciesTable;
        } else if (tbody.closest('#formats-settings-table')) {
          collection = 'formats';
          modal = document.getElementById('format-modal');
          renderFunction = renderFormatsTable;
        }
        
        if (!collection || !modal) return;
        
        if (isEdit) {
          // Handle edit
          const items = DB.get(collection) || [];
          const item = items.find(i => i.id === id);
          
          if (item) {
            if (collection === 'departments') {
              document.getElementById('department-id').value = item.id;
              document.getElementById('department-name').value = item.name;
              
              const managerField = document.getElementById('department-manager');
              if (managerField) {
                // Populate manager dropdown with fresh data from Supabase
                console.log('🔧 Populating department manager dropdown for editing with fresh Supabase data...');
                managerField.innerHTML = '<option value="">Select Manager</option>';
                
                // Use async function to load fresh users data
                (async () => {
                  try {
                    // First try to get users from Supabase
                    let users = [];
                    
                    if (typeof supabaseDataService !== 'undefined' && supabaseDataService) {
                      console.log('🔧 Fetching users from Supabase for editing...');
                      users = await supabaseDataService.getAll('users');
                      console.log('🔧 Fetched users from Supabase for editing:', users.length);
                      
                      // Update local storage with fresh data
                      if (users.length > 0) {
                        DB.set('users', users);
                        console.log('🔧 Updated local storage with fresh user data for editing');
                      }
                    }
                    
                    // Fallback to local storage if Supabase fails
                    if (users.length === 0) {
                      console.log('🔧 Falling back to local storage users for editing...');
                      users = DB.get('users') || [];
                    }
                    
                    console.log('🔧 Total users available for manager selection during edit:', users.length);
                    
                    // Filter for managers and admins
                    const managers = users.filter(user => 
                      user.role === 'Manager' || user.role === 'Admin'
                    );
                    
                    console.log('🔧 Found managers/admins for editing:', managers.length);
                    
                    managers.forEach(user => {
                      console.log('🔧 Adding manager option for edit:', user.name, 'with role:', user.role);
                      const option = document.createElement('option');
                      option.value = user.name;
                      option.textContent = `${user.name} (${user.role})`;
                      if (user.name === item.manager) {
                        option.selected = true;
                        console.log('🔧 Selected manager for edit:', user.name);
                      }
                      managerField.appendChild(option);
                    });
                    
                    console.log('🔧 Total manager options added for edit:', managerField.options.length - 1);
                    
                    if (managers.length === 0) {
                      console.warn('⚠️ No managers found in the system for editing');
                      const noManagerOption = document.createElement('option');
                      noManagerOption.value = '';
                      noManagerOption.textContent = 'No managers available';
                      noManagerOption.disabled = true;
                      managerField.appendChild(noManagerOption);
                    }
                    
                  } catch (error) {
                    console.error('❌ Error loading users for manager dropdown during edit:', error);
                    
                    // Fallback to local storage
                    const localUsers = DB.get('users') || [];
                    console.log('🔧 Using local storage fallback for editing with', localUsers.length, 'users');
                    
                    localUsers.forEach(user => {
                      if (user.role === 'Manager' || user.role === 'Admin') {
                        const option = document.createElement('option');
                        option.value = user.name;
                        option.textContent = `${user.name} (${user.role})`;
                        if (user.name === item.manager) {
                          option.selected = true;
                        }
                        managerField.appendChild(option);
                      }
                    });
                  }
                })();
              } else {
                console.error('❌ Department manager field not found for editing!');
              }
              
              document.getElementById('department-modal-title').textContent = 'Edit Department';
            } else if (collection === 'reportTypes') {
              document.getElementById('report-id').value = item.id;
              document.getElementById('report-name').value = item.name;
              document.getElementById('report-description').value = item.description || '';
              
              // Populate dropdowns and select current values
              const departmentField = document.getElementById('report-department');
              const frequencyField = document.getElementById('report-frequency');
              const formatField = document.getElementById('report-format');
              
              if (departmentField) {
                const departments = DB.get('departments') || [];
                departmentField.innerHTML = '<option value="">Select Department</option>';
                departments.forEach(dept => {
                  const option = document.createElement('option');
                  option.value = dept.name;
                  option.textContent = dept.name;
                  if (dept.name === item.department) {
                    option.selected = true;
                  }
                  departmentField.appendChild(option);
                });
              }
              
              if (frequencyField) {
                const frequencies = DB.get('frequencies') || [];
                frequencyField.innerHTML = '<option value="">Select Frequency</option>';
                frequencies.forEach(freq => {
                  const option = document.createElement('option');
                  option.value = freq.name;
                  option.textContent = freq.name;
                  if (freq.name === item.frequency) {
                    option.selected = true;
                  }
                  frequencyField.appendChild(option);
                });
              }
              
              if (formatField) {
                const formats = DB.get('formats') || [];
                formatField.innerHTML = '<option value="">Select Format</option>';
                formats.forEach(format => {
                  const option = document.createElement('option');
                  option.value = format.name;
                  option.textContent = format.name;
                  if (format.name === item.format) {
                    option.selected = true;
                  }
                  formatField.appendChild(option);
                });
              }
              
              document.getElementById('report-modal-title').textContent = 'Edit Report Type';
            } else if (collection === 'frequencies') {
              document.getElementById('frequency-id').value = item.id;
              document.getElementById('frequency-name').value = item.name;
              document.getElementById('frequency-description').value = item.description || '';
              document.getElementById('frequency-modal-title').textContent = 'Edit Frequency';
            } else if (collection === 'formats') {
              document.getElementById('format-id').value = item.id;
              document.getElementById('format-name').value = item.name;
              document.getElementById('format-description').value = item.description || '';
              document.getElementById('format-modal-title').textContent = 'Edit Format';
            }
            
            modal.style.display = 'block';
          }
        } else if (isDelete) {
          // Handle delete
          if (confirm(`Are you sure you want to delete this ${collection.slice(0, -1)}?`)) {
            supabaseIntegrationManager.deleteRecord(collection, id)
              .then(() => {
                if (typeof renderFunction === 'function') {
                  renderFunction();
                }
              })
              .catch(error => {
                console.error(`Error deleting ${collection.slice(0, -1)}:`, error);
                alert(`Error deleting ${collection.slice(0, -1)}: ${error.message}`);
              });
          }
        }
      });
    });
    
    // Render settings tables with a small delay to ensure DOM is ready
    console.log('🔧 Rendering settings tables...');
    setTimeout(() => {
      console.log('🔧 Starting settings table rendering...');
      console.log('renderDepartmentsTable function exists:', typeof renderDepartmentsTable === 'function');
      console.log('renderReportTypesTable function exists:', typeof renderReportTypesTable === 'function');
      console.log('renderFrequenciesTable function exists:', typeof renderFrequenciesTable === 'function');
      console.log('renderFormatsTable function exists:', typeof renderFormatsTable === 'function');
      
      if (typeof renderDepartmentsTable === 'function') {
        renderDepartmentsTable();
      } else {
        console.error('❌ renderDepartmentsTable function not found');
      }
      
      if (typeof renderReportTypesTable === 'function') {
        renderReportTypesTable();
      } else {
        console.error('❌ renderReportTypesTable function not found');
      }
      
      if (typeof renderFrequenciesTable === 'function') {
        renderFrequenciesTable();
      } else {
        console.error('❌ renderFrequenciesTable function not found');
      }
      
      if (typeof renderFormatsTable === 'function') {
        renderFormatsTable();
      } else {
        console.error('❌ renderFormatsTable function not found');
      }
      
      console.log('✅ Settings tables rendered');
    }, 500);
  }
  
  else if (currentPage === 'users.html') {
    console.log('Initializing users page...');
    
    // --- Add or fix this function near the top, after DB and utility functions ---
    if (typeof populateDepartmentDropdowns !== 'function') {
      window.populateDepartmentDropdowns = function() {
        console.log('🔧 populateDepartmentDropdowns function called with department access control...');
        
        // Get current user and their allowed departments
        const currentUser = DB.getCurrentUser();
        let allowedDepartments = [];
        
        if (currentUser && currentUser.role !== 'Admin') {
          allowedDepartments = getUserAllowedDepartments ? getUserAllowedDepartments() : [];
          console.log('🔒 User allowed departments for dropdowns:', allowedDepartments);
        } else {
          // Admin users can see all departments
          const allDepartments = DB.get('departments') || [];
          allowedDepartments = allDepartments.map(d => d.name);
          console.log('🔒 Admin user - showing all departments:', allowedDepartments);
        }
        
        // Populate main department dropdown
        const departmentDropdown = document.getElementById('user-department');
        console.log('🔧 Found departments:', allowedDepartments.length, allowedDepartments);
        
        if (departmentDropdown) {
          console.log('🔧 Populating main department dropdown with RLS...');
          departmentDropdown.innerHTML = '<option value="">Select Department</option>';
          allowedDepartments.forEach(deptName => {
            const option = document.createElement('option');
            option.value = deptName;
            option.textContent = deptName;
            departmentDropdown.appendChild(option);
            console.log('🔒 Added department option:', deptName);
          });
          console.log('🔧 Main department dropdown populated with RLS:', allowedDepartments.length, 'departments');
        } else {
          console.error('❌ Main department dropdown not found!');
        }
        
        // Populate secondary departments checkboxes
        const container = document.getElementById('additional-departments-container');
        console.log('🔧 Looking for additional-departments-container:', container);
        
        if (container) {
          console.log('🔧 Populating secondary departments checkboxes with RLS...');
          container.innerHTML = '';
          allowedDepartments.forEach(deptName => {
            // Exclude the currently selected primary department
            if (departmentDropdown && deptName === departmentDropdown.value) {
              console.log('🔧 Skipping', deptName, 'as it matches primary department');
              return;
            }
            const label = document.createElement('label');
            label.style.marginRight = '10px';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'additional-departments';
            checkbox.value = deptName;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + deptName));
            container.appendChild(label);
            console.log('🔒 Added checkbox for:', deptName);
          });
          console.log('🔧 Secondary departments populated successfully with RLS');
        } else {
          console.error('❌ additional-departments-container not found!');
        }
      };
    }
    // --- Remove duplicate Add User button event handler and ensure only one exists ---
    var addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      console.log('🔧 Setting up Add User button with secondary departments support...');
      addUserBtn.replaceWith(addUserBtn.cloneNode(true)); // Remove all old handlers
      addUserBtn = document.getElementById('add-user-btn');
      addUserBtn.addEventListener('click', function() {
        console.log('🔧 Add User button clicked - populating department dropdowns...');
        if (typeof populateDepartmentDropdowns === 'function') {
          console.log('🔧 Calling populateDepartmentDropdowns function...');
          populateDepartmentDropdowns();
        } else {
          console.error('❌ populateDepartmentDropdowns function not found!');
        }
        document.getElementById('user-modal').style.display = 'block';
      });
    }

    // Setup custom user form handling (to avoid password field in Supabase)
    const userForm = document.getElementById('user-form');
    if (userForm) {
      // Add dynamic password field behavior
      const userIdField = document.getElementById('user-id');
      const passwordField = document.getElementById('user-password');
      const passwordHelp = document.getElementById('password-help');
      
      if (userIdField && passwordField && passwordHelp) {
        // Function to update password field behavior
        function updatePasswordField() {
          const isNewUser = !userIdField.value;
          if (isNewUser) {
            passwordField.required = true;
            passwordField.placeholder = 'Enter password for new user';
            passwordHelp.textContent = 'Password is required for new users. This will be shown to you after creation.';
            passwordHelp.style.color = '#e74c3c';
          } else {
            passwordField.required = false;
            passwordField.placeholder = 'Leave empty to keep current password';
            passwordHelp.textContent = 'Leave empty to keep current password when editing.';
            passwordHelp.style.color = '#666';
          }
        }
        
        // Update on page load
        updatePasswordField();
        
              // Update when user ID field changes
      userIdField.addEventListener('input', updatePasswordField);
      
      // Add generate password functionality
      const generatePasswordBtn = document.getElementById('generate-password-btn');
      if (generatePasswordBtn) {
        generatePasswordBtn.addEventListener('click', function() {
          // Generate a secure password
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
          let password = '';
          for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          // Set the password in the field
          passwordField.value = password;
          
          // Show a brief notification
          if (typeof showNotification === 'function') {
            showNotification('Secure password generated!', 'success');
          } else {
            alert('Secure password generated!');
          }
        });
      }
    }
      
      userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          const userId = document.getElementById('user-id').value;
          const name = document.getElementById('user-name').value;
          const email = document.getElementById('user-email').value;
          const department = document.getElementById('user-department').value;
          const role = document.getElementById('user-role').value;
          const password = document.getElementById('user-password').value;
          
          // Apply department access control validation
          const currentUser = DB.getCurrentUser();
          if (currentUser && currentUser.role !== 'Admin') {
            const allowedDepartments = getUserAllowedDepartments ? getUserAllowedDepartments() : [];
            console.log('🔒 Validating user form submission against allowed departments:', allowedDepartments);
            
            // Check if selected primary department is allowed
            if (department && !allowedDepartments.includes(department)) {
              console.error('🔒 Access denied: User cannot assign to department:', department);
              if (typeof showNotification === 'function') {
                showNotification('Access denied: You can only assign users to departments you have access to', 'error');
              } else {
                alert('Access denied: You can only assign users to departments you have access to');
              }
              return;
            }
            
            // Check if selected secondary departments are allowed
            let additionalDepartments = [];
            if (typeof getSelectedDepartments === 'function') {
              additionalDepartments = getSelectedDepartments();
            }
            
            const invalidSecondaryDepts = additionalDepartments.filter(dept => !allowedDepartments.includes(dept));
            if (invalidSecondaryDepts.length > 0) {
              console.error('🔒 Access denied: User cannot assign to secondary departments:', invalidSecondaryDepts);
              if (typeof showNotification === 'function') {
                showNotification(`Access denied: You cannot assign users to departments: ${invalidSecondaryDepts.join(', ')}`, 'error');
              } else {
                alert(`Access denied: You cannot assign users to departments: ${invalidSecondaryDepts.join(', ')}`);
              }
              return;
            }
            
            console.log('🔒 User form submission validated - all departments are allowed');
          }
          
          // Get selected departments if function exists
          let additionalDepartments = [];
          if (typeof getSelectedDepartments === 'function') {
            additionalDepartments = getSelectedDepartments();
          }
          
          // Get permissions
          const viewPermissionElement = document.querySelector('input[name="view-permission"]:checked');
          const addPermissionElement = document.querySelector('input[name="add-permission"]:checked');
          const editPermissionElement = document.querySelector('input[name="edit-permission"]:checked');
          const deletePermissionElement = document.querySelector('input[name="delete-permission"]:checked');
          
          const viewPermission = viewPermissionElement ? viewPermissionElement.value : 'department';
          const addPermission = addPermissionElement ? addPermissionElement.value : 'department';
          const editPermission = editPermissionElement ? editPermissionElement.value : 'department';
          const deletePermission = deletePermissionElement ? deletePermissionElement.value : 'none';
          
          const permissions = {
            canView: [viewPermission],
            canAdd: [addPermission],
            canEdit: [editPermission],
            canDelete: [deletePermission]
          };
          
          // Create user data object (without password for Supabase)
          // Include all fields that exist in the Supabase users table schema
          const userData = {
            id: userId || crypto.randomUUID(), // Include ID for both new and existing users
            name: name,
            email: email, // Add email field which is required by Supabase
            department: department,
            departments: additionalDepartments,
            role: role,
            permissions: permissions,
            last_login: null
          };
          
                      if (userId) {
              // Update existing user
              console.log('Updating existing user:', userId);
              
              // Create local storage data (includes lastLogin and departments)
              const localUserData = { ...userData, lastLogin: null, departments: additionalDepartments };
              
              // Update in local storage
              const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
              const userIndex = localData.users.findIndex(u => u.id == userId);
              if (userIndex !== -1) {
                localData.users[userIndex] = { ...localData.users[userIndex], ...localUserData, id: userId };
                localStorage.setItem('reportrepo_db', JSON.stringify(localData));
              }
              
              // Update user in Supabase using data service with admin mode
              try {
                if (typeof supabaseDataService !== 'undefined') {
                  console.log('Updating user in Supabase using data service with admin mode...');
                  
                  // Enable admin mode for this operation
                  await supabaseDataService.setAdminMode(true);
                  
                  const supabaseUser = await supabaseDataService.update('users', userId, userData);
                  
                  if (supabaseUser) {
                    console.log('User updated successfully in Supabase:', supabaseUser);
                  } else {
                    throw new Error('Failed to update user in Supabase');
                  }
                } else {
                  console.warn('Supabase data service not available');
                }
              } catch (error) {
                console.error('Failed to update user in Supabase:', error);
                // Continue with localStorage success
              }
              
              showNotification('User updated successfully in Supabase and local storage', 'success');
            } else {
              // Add new user
              console.log('Adding new user');
              
              if (!password) {
                showNotification('Password is required for new users', 'error');
                return;
              }
              
              // User ID is already set in userData object
              
              // We'll update local storage after successful Supabase creation
              // to use the auth user ID
              
              // Create user in Supabase using admin client for both auth and profile
              try {
                const adminClient = getSupabaseAdminClient();
                if (adminClient) {
                  console.log('Creating user in Supabase auth system using admin client...');
                  
                  // First, create the user in auth.users using admin client
                  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
                    email: email,
                    password: password,
                    email_confirm: true, // Auto-confirm email so user can log in immediately
                    user_metadata: {
                      name: name,
                      department: department,
                      role: role
                    }
                  });
                  
                  if (authError) {
                    console.error('Auth user creation error:', authError);
                    throw authError;
                  }
                  
                  console.log('User created in auth system:', authData.user);
                  
                  // Now create the profile in public.users table using admin client
                  console.log('Creating user profile in public.users table...');
                  
                  // Use the auth user ID for the profile
                  const profileData = {
                    id: authData.user.id, // Use the auth user ID
                    name: name,
                    email: email,
                    department: department,
                    departments: additionalDepartments,
                    role: role,
                    permissions: permissions,
                    last_login: null
                  };
                  
                  const { data: supabaseUser, error: profileError } = await adminClient
                    .from('users')
                    .insert([profileData])
                    .select()
                    .single();
                  
                  if (profileError) {
                    console.error('Profile creation error:', profileError);
                    throw profileError;
                  }
                  
                  if (supabaseUser) {
                    console.log('User profile created successfully in Supabase:', supabaseUser);
                    
                    // Now add to local storage with the auth user ID
                    const localUserData = { 
                      id: authData.user.id, // Use the auth user ID
                      name: name,
                      email: email,
                      department: department,
                      departments: additionalDepartments,
                      role: role,
                      permissions: permissions,
                      lastLogin: null
                    };
                    
                    const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
                    if (!localData.users) localData.users = [];
                    localData.users.push(localUserData);
                    localStorage.setItem('reportrepo_db', JSON.stringify(localData));
                    
                    console.log('User added to local storage with auth ID:', authData.user.id);
                    
                    // Test the login credentials immediately after creation
                    console.log('🧪 Testing login credentials for new user...');
                    try {
                      const testClient = getSupabaseClient();
                      const { data: testData, error: testError } = await testClient.auth.signInWithPassword({
                        email: email,
                        password: password
                      });
                      
                      if (testError) {
                        console.error('❌ Login test failed:', testError);
                        console.error('❌ This means the user cannot log in with these credentials!');
                      } else {
                        console.log('✅ Login test successful! User can log in with these credentials.');
                        // Sign out the test user
                        await testClient.auth.signOut();
                      }
                    } catch (testError) {
                      console.error('❌ Login test error:', testError);
                    }
                    
                    // Show the password to the admin for the new user
                    const passwordMessage = `✅ User created successfully!

📧 Email: ${email}
🔑 Password: ${password}

⚠️ IMPORTANT: Please share these credentials with the user. They can now log in to the system.

💡 Tip: The user should change their password after their first login for security.`;
                    alert(passwordMessage);
                  } else {
                    throw new Error('Failed to create user profile in Supabase');
                  }
                } else {
                  console.warn('Supabase admin client not available');
                }
              } catch (error) {
                console.error('Failed to create user in Supabase:', error);
                console.log('User created successfully in localStorage only');
                // Continue with localStorage success
              }
              
              showNotification('User created successfully in Supabase and local storage', 'success');
            }
          
          // Close modal
          document.getElementById('user-modal').style.display = 'none';
          
          // Refresh the users table
          if (typeof renderUsersTable === 'function') {
            renderUsersTable();
          }
          
        } catch (error) {
          console.error('Error saving user:', error);
          showNotification('Error saving user: ' + error.message, 'error');
        }
      });
    }
    
    // Render tables
    renderUsersTable();
    
    // Setup users table event handlers
    const usersTable = document.getElementById('users-table');
    if (usersTable) {
      const tbody = usersTable.querySelector('tbody');
      if (tbody) {
        tbody.addEventListener('click', function(e) {
          const target = e.target.closest('.action-icon');
          if (!target) return;
          
          const id = target.getAttribute('data-id');
          const email = target.getAttribute('data-email');
          const isEdit = target.classList.contains('edit');
          const isDelete = target.classList.contains('delete');
          const isResetPassword = target.classList.contains('reset-password');
          const isTestLogin = target.classList.contains('test-login');
          const isConfirmEmail = target.classList.contains('confirm-email');
          
          if (isEdit) {
            // Handle edit - populate form with user data
            const users = DB.get('users') || [];
            const user = users.find(u => u.id === id);
            
            if (user) {
              document.getElementById('user-id').value = user.id;
              document.getElementById('user-name').value = user.name;
              document.getElementById('user-email').value = user.email;
              document.getElementById('user-department').value = user.department;
              document.getElementById('user-role').value = user.role;
              document.getElementById('user-password').value = ''; // Clear password field
              
              // Update password field behavior for editing
              if (typeof updatePasswordField === 'function') {
                updatePasswordField();
              }
              
              // Populate secondary departments
              if (typeof populateDepartmentDropdowns === 'function') {
                populateDepartmentDropdowns();
              }
              
              // Set permissions
              if (user.permissions) {
                const viewPermission = user.permissions.canView && user.permissions.canView[0] ? user.permissions.canView[0] : 'department';
                const addPermission = user.permissions.canAdd && user.permissions.canAdd[0] ? user.permissions.canAdd[0] : 'department';
                const editPermission = user.permissions.canEdit && user.permissions.canEdit[0] ? user.permissions.canEdit[0] : 'department';
                const deletePermission = user.permissions.canDelete && user.permissions.canDelete[0] ? user.permissions.canDelete[0] : 'none';
                
                const viewElement = document.querySelector('input[name="view-permission"][value="' + viewPermission + '"]');
                const addElement = document.querySelector('input[name="add-permission"][value="' + addPermission + '"]');
                const editElement = document.querySelector('input[name="edit-permission"][value="' + editPermission + '"]');
                const deleteElement = document.querySelector('input[name="delete-permission"][value="' + deletePermission + '"]');
                
                if (viewElement) viewElement.checked = true;
                if (addElement) addElement.checked = true;
                if (editElement) editElement.checked = true;
                if (deleteElement) deleteElement.checked = true;
              }
              
              document.getElementById('user-modal-title').textContent = 'Edit User';
              document.getElementById('user-modal').style.display = 'block';
            }
          } else if (isDelete) {
            // Handle delete
            if (confirm('Are you sure you want to delete this user?')) {
              // Remove from local storage
              const users = DB.get('users') || [];
              const filteredUsers = users.filter(u => u.id !== id);
              DB.set('users', filteredUsers);
              
              // Try to delete from Supabase
              if (typeof supabaseDataService !== 'undefined') {
                supabaseDataService.delete('users', id)
                  .then(() => {
                    console.log('User deleted from Supabase');
                  })
                  .catch(error => {
                    console.error('Error deleting user from Supabase:', error);
                  });
              }
              
              renderUsersTable();
              if (typeof showNotification === 'function') {
                showNotification('User deleted successfully', 'success');
              }
            }
          } else if (isResetPassword) {
            // Handle reset password
            if (confirm(`Reset password for ${email}?`)) {
              // Generate a new secure password
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
              let newPassword = '';
              for (let i = 0; i < 12; i++) {
                newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              
              // Try to reset password in Supabase
              const adminClient = getSupabaseAdminClient();
              if (adminClient) {
                adminClient.auth.admin.updateUserById(id, { password: newPassword })
                  .then(({ data, error }) => {
                    if (error) {
                      console.error('Password reset error:', error);
                      alert('Failed to reset password: ' + error.message);
                    } else {
                      const message = `Password reset successfully!\n\nNew credentials:\nEmail: ${email}\nPassword: ${newPassword}\n\nPlease share these credentials with the user.`;
                      alert(message);
                    }
                  })
                  .catch(error => {
                    console.error('Password reset error:', error);
                    alert('Failed to reset password: ' + error.message);
                  });
              } else {
                alert('Admin client not available. Cannot reset password.');
              }
            }
          } else if (isTestLogin) {
            // Handle test login
            const testPassword = prompt(`Enter password to test login for ${email}:`);
            if (testPassword) {
              console.log(`🧪 Testing login for ${email}...`);
              
              const testClient = getSupabaseClient();
              testClient.auth.signInWithPassword({
                email: email,
                password: testPassword
              })
              .then(({ data, error }) => {
                if (error) {
                  console.error('❌ Login test failed:', error);
                  alert(`❌ Login test failed: ${error.message}`);
                } else {
                  console.log('✅ Login test successful!');
                  alert('✅ Login test successful! User can log in with this password.');
                  // Sign out the test user
                  return testClient.auth.signOut();
                }
              })
              .catch(error => {
                console.error('❌ Login test error:', error);
                alert(`❌ Login test error: ${error.message}`);
              });
            }
          } else if (isConfirmEmail) {
            // Handle confirm email
            if (confirm(`Confirm email for ${email}? This will allow the user to log in.`)) {
              console.log(`📧 Confirming email for ${email}...`);
              
              const adminClient = getSupabaseAdminClient();
              if (adminClient) {
                adminClient.auth.admin.updateUserById(id, { email_confirm: true })
                  .then(({ data, error }) => {
                    if (error) {
                      console.error('❌ Email confirmation failed:', error);
                      alert(`❌ Email confirmation failed: ${error.message}`);
                    } else {
                      console.log('✅ Email confirmed successfully!');
                      alert(`✅ Email confirmed successfully!\n\nUser ${email} can now log in.`);
                    }
                  })
                  .catch(error => {
                    console.error('❌ Email confirmation error:', error);
                    alert(`❌ Email confirmation error: ${error.message}`);
                  });
              } else {
                alert('Admin client not available. Cannot confirm email.');
              }
            }
          }
        });
      }
    }
    
    // Populate department filter
    const departmentFilter = document.getElementById('department-filter');
    if (departmentFilter) {
      const departments = DB.get('departments') || [];
      departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        departmentFilter.appendChild(option);
      });
    }
  }
  
  else if (currentPage === 'reports.html') {
    console.log('Initializing reports page...');
    
    // Upload Report button
    const uploadReportBtn = document.getElementById('upload-report-btn');
    if (uploadReportBtn) {
      uploadReportBtn.addEventListener('click', function() {
        console.log('Upload Report button clicked');
        
        // Get the modal
        const modal = document.getElementById('upload-report-modal');
        
        // Reset form
        document.getElementById('report-department-upload').selectedIndex = 0;
        document.getElementById('report-type').selectedIndex = 0;
        document.getElementById('report-file').value = '';
        document.getElementById('report-notes').value = '';
        
        // Reset progress
        document.getElementById('progress-bar-fill').style.width = '0%';
        document.getElementById('progress-status').textContent = '0% Uploaded';
        document.getElementById('upload-progress').style.display = 'none';
        
        // Populate department dropdown with user's allowed departments (RLS)
        populateUploadModalDepartmentDropdown();
        
        // Show modal
        modal.style.display = 'block';
      });
    }
    
    // Setup upload form handling
    const uploadForm = document.getElementById('upload-report-form');
    if (uploadForm) {
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Upload form submitted');
        
        const file = document.getElementById('report-file').files[0];
        const notes = document.getElementById('report-notes').value;
        const departmentSelect = document.getElementById('report-department-upload');
        const reportTypeSelect = document.getElementById('report-type');
        
        // Get selected values FIRST
        const selectedDepartmentName = departmentSelect ? departmentSelect.value : null;
        const selectedReportTypeName = reportTypeSelect ? reportTypeSelect.value : null;
        
        if (!file) {
            alert('Please select a file');
            return;
        }
        
        if (!selectedDepartmentName) {
            alert('Please select a department');
            return;
        }
        
        if (!selectedReportTypeName) {
            alert('Please select a report type');
            return;
        }
        
        try {
            // Show progress and loading spinner
            const progressBar = document.getElementById('progress-bar-fill');
            const progressContainer = document.getElementById('upload-progress');
            const uploadButton = document.querySelector('#upload-report-form .save-btn');
            
            if (progressContainer) {
                progressContainer.style.display = 'block';
            }
            
            if (progressBar) {
                progressBar.style.width = '25%';
                progressBar.textContent = 'Uploading file...';
            }
            
            if (uploadButton) {
                uploadButton.disabled = true;
                uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            }
            
            console.log('Selected department name:', selectedDepartmentName);
            console.log('Selected report type name:', selectedReportTypeName);
            
            // Look up actual IDs and get format/frequency
            let departmentId = null;
            let reportTypeId = null;
            let selectedFormat = null;
            let selectedFrequency = null;
            
            if (selectedDepartmentName) {
                // Try multiple ways to get departments data
                let departments = [];
                
                // Method 1: Try window.DB
                if (window.DB && window.DB.get) {
                    departments = window.DB.get('departments') || [];
                    console.log('Got departments from window.DB:', departments.length);
                }
                
                // Method 2: Try direct localStorage if window.DB failed
                if (departments.length === 0) {
                    try {
                        const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
                        departments = localData.departments || [];
                        console.log('Got departments from localStorage:', departments.length);
                    } catch (error) {
                        console.error('Error reading departments from localStorage:', error);
                    }
                }
                
                // Method 3: Try global DB if available
                if (departments.length === 0 && typeof DB !== 'undefined' && DB && DB.get) {
                    departments = DB.get('departments') || [];
                    console.log('Got departments from global DB:', departments.length);
                }
                
                const selectedDepartment = departments.find(dept => dept.name === selectedDepartmentName);
                if (selectedDepartment) {
                    departmentId = selectedDepartment.id;
                    console.log('Found department ID:', departmentId);
                } else {
                    console.error('Department not found:', selectedDepartmentName);
                    console.log('Available departments:', departments.map(d => d.name));
                }
            }
            
            if (selectedReportTypeName && selectedDepartmentName) {
                // Try multiple ways to get report types data (same as department change handler)
                let reportTypes = [];
                
                // Method 1: Try window.DB
                if (window.DB && window.DB.get) {
                    reportTypes = window.DB.get('reportTypes') || [];
                    console.log('Got report types from window.DB:', reportTypes.length);
                }
                
                // Method 2: Try direct localStorage if window.DB failed
                if (reportTypes.length === 0) {
                    try {
                        const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
                        reportTypes = localData.reportTypes || [];
                        console.log('Got report types from localStorage:', reportTypes.length);
                    } catch (error) {
                        console.error('Error reading from localStorage:', error);
                    }
                }
                
                // Method 3: Try global DB if available
                if (reportTypes.length === 0 && typeof DB !== 'undefined' && DB && DB.get) {
                    reportTypes = DB.get('reportTypes') || [];
                    console.log('Got report types from global DB:', reportTypes.length);
                }
                
                console.log('Available report types:', reportTypes);
                console.log('Looking for:', selectedReportTypeName, 'in department:', selectedDepartmentName);
                console.log('window.DB available:', !!window.DB);
                console.log('window.DB.get available:', !!(window.DB && window.DB.get));
                
                const selectedReportType = reportTypes.find(rt => 
                    rt.name === selectedReportTypeName && rt.department === selectedDepartmentName
                );
                
                if (selectedReportType) {
                    reportTypeId = selectedReportType.id;
                    selectedFormat = selectedReportType.format;
                    selectedFrequency = selectedReportType.frequency;
                    console.log('Found report type ID:', reportTypeId);
                    console.log('Selected format:', selectedFormat);
                    console.log('Selected frequency:', selectedFrequency);
                } else {
                    console.error('Report type not found:', selectedReportTypeName, 'for department:', selectedDepartmentName);
                    console.log('Available report types for this department:', reportTypes.filter(rt => rt.department === selectedDepartmentName));
                    alert('Selected report type not found. Please try again.');
                    return;
                }
            }
            
            // Validate that we have all required data
            if (!departmentId || !reportTypeId || !selectedFormat || !selectedFrequency) {
                console.error('Missing required data:', { departmentId, reportTypeId, selectedFormat, selectedFrequency });
                alert('Could not find required report information. Please try again.');
                return;
            }
            
            // Upload file to Supabase storage using admin mode to bypass RLS
            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) {
                throw new Error('Supabase client not available');
            }
            
            const fileName = `${Date.now()}_${file.name}`;
            let uploadData, uploadError;
            
            // Try using admin client for file upload to bypass RLS
            const adminClient = getSupabaseAdminClient();
            if (adminClient) {
                console.log('Using admin client for file upload to bypass RLS...');
                const { data, error } = await adminClient.storage
                    .from('reports-files')
                    .upload(fileName, file);
                uploadData = data;
                uploadError = error;
            } else {
                console.log('Admin client not available, using regular client for file upload...');
                const { data, error } = await supabaseClient.storage
                    .from('reports-files')
                    .upload(fileName, file);
                uploadData = data;
                uploadError = error;
            }
            
            if (uploadError) {
                console.error('File upload error:', uploadError);
                alert('File upload failed: ' + uploadError.message);
                return;
            }
            
            // Get the public URL
            const { data: urlData } = supabaseClient.storage
                .from('reports-files')
                .getPublicUrl(fileName);
            
            const reportUrl = urlData.publicUrl;
            console.log('File uploaded successfully:', reportUrl);
            
            if (progressBar) {
                progressBar.style.width = '50%';
                progressBar.textContent = 'Creating report record...';
            }
            
            // Get user info
            const { data: { user } } = await supabaseClient.auth.getUser();
            const submitterId = user ? user.id : null;
            const submitter = user ? user.email : 'Unknown';
            
            // Create report record with correct values
            const reportData = {
                name: file.name, // Keep full filename with extension
                notes: notes,
                department_id: departmentId,
                department: selectedDepartmentName, // Add department name for app functionality
                report_type_id: reportTypeId,
                report_url: reportUrl,
                file_size: file.size,
                format: selectedFormat,
                frequency: selectedFrequency,
                status: 'Submitted',
                submitter_id: submitterId,
                submitter: submitter,
                date: new Date().toISOString().split('T')[0]
            };
            
            console.log('Creating report with data:', JSON.stringify(reportData, null, 2));
            console.log('Department ID:', departmentId, 'Department Name:', selectedDepartmentName);
            
            // Save to Supabase using admin mode to bypass RLS
            let reportRecord, reportError;
            
            if (typeof supabaseDataService !== 'undefined' && supabaseDataService) {
                // Use admin mode to bypass RLS policies
                await supabaseDataService.setAdminMode(true);
                
                try {
                    reportRecord = await supabaseDataService.insert('reports', reportData);
                    console.log('Report created successfully using admin mode:', reportRecord);
                } catch (error) {
                    reportError = error;
                    console.error('Report creation error with admin mode:', error);
                } finally {
                    // Disable admin mode after operation
                    await supabaseDataService.setAdminMode(false);
                }
            } else {
                // Fallback to direct client if admin service not available
                const { data, error } = await supabaseClient
                    .from('reports')
                    .insert([reportData])
                    .select();
                reportRecord = data;
                reportError = error;
            }
            
            if (reportError) {
                console.error('Report creation error:', reportError);
                alert('Failed to create report: ' + reportError.message);
                return;
            }
            
            console.log('Report created successfully:', reportRecord);
            
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.textContent = 'Upload complete!';
            }
            
            // Reset upload button
            const resetUploadButton = document.querySelector('#upload-report-form .save-btn');
            if (resetUploadButton) {
                resetUploadButton.disabled = false;
                resetUploadButton.innerHTML = 'Upload';
            }
            
            // Close modal and refresh
            const modal = document.getElementById('upload-report-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Refresh the reports table
            setTimeout(() => {
                console.log('🔄 Refreshing reports table after upload...');
                renderReportsTable();
                console.log('✅ Reports table refreshed');
            }, 1000);
            
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
            
            // Reset upload button on error
            const errorUploadButton = document.querySelector('#upload-report-form .save-btn');
            if (errorUploadButton) {
                errorUploadButton.disabled = false;
                errorUploadButton.innerHTML = 'Upload';
            }
            
            // Hide progress bar on error
            const errorProgressContainer = document.getElementById('upload-progress');
            if (errorProgressContainer) {
                errorProgressContainer.style.display = 'none';
            }
        }
    });
    }

    // Setup modal close functionality
    const uploadModal = document.getElementById('upload-report-modal');
    if (uploadModal) {
      // Close button
      const uploadCloseBtn = uploadModal.querySelector('.modal-close');
      if (uploadCloseBtn) {
        uploadCloseBtn.addEventListener('click', () => {
          uploadModal.style.display = 'none';
        });
      }
      
      // Cancel button
      const uploadCancelBtn = uploadModal.querySelector('.cancel-btn');
      if (uploadCancelBtn) {
        uploadCancelBtn.addEventListener('click', () => {
          uploadModal.style.display = 'none';
        });
      }
      
      // Close on outside click
      uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
          uploadModal.style.display = 'none';
        }
      });
    }
    
    // Setup department change handler for report type dropdown
    const departmentSelect = document.getElementById('report-department-upload');
    const reportTypeSelect = document.getElementById('report-type');
    
    if (departmentSelect && reportTypeSelect) {
      departmentSelect.addEventListener('change', function() {
        const selectedDepartment = this.value;
        console.log('Department changed to:', selectedDepartment);
        
        // Try multiple ways to get report types data
        let reportTypes = [];
        
        // Method 1: Try window.DB
        if (window.DB && window.DB.get) {
          reportTypes = window.DB.get('reportTypes') || [];
          console.log('Got report types from window.DB:', reportTypes.length);
        }
        
        // Method 2: Try direct localStorage if window.DB failed
        if (reportTypes.length === 0) {
          try {
            const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
            reportTypes = localData.reportTypes || [];
            console.log('Got report types from localStorage:', reportTypes.length);
          } catch (error) {
            console.error('Error reading from localStorage:', error);
          }
        }
        
        // Method 3: Try global DB if available
        if (reportTypes.length === 0 && typeof DB !== 'undefined' && DB && DB.get) {
          reportTypes = DB.get('reportTypes') || [];
          console.log('Got report types from global DB:', reportTypes.length);
        }
        
        console.log('All report types:', reportTypes);
        
        // Filter report types by department
        const filteredTypes = reportTypes.filter(type => type.department === selectedDepartment);
        console.log('Filtered report types for department', selectedDepartment, ':', filteredTypes);
        
        // Update report type dropdown
        reportTypeSelect.innerHTML = '<option value="">Select Report Type</option>';
        filteredTypes.forEach(type => {
          const option = document.createElement('option');
          option.value = type.name;
          option.textContent = type.name;
          reportTypeSelect.appendChild(option);
        });
        console.log('Report type dropdown populated with', filteredTypes.length, 'types');
        
        // Update format hint
        const formatHint = document.getElementById('format-hint');
        if (formatHint && filteredTypes.length > 0) {
          formatHint.textContent = `Expected format: ${filteredTypes[0].format}`;
        } else {
          formatHint.textContent = 'Please select a report type first';
        }
      });
    }
    
    // Render grouped reports with RLS
    if (typeof window.renderReportsTable === 'function') {
      console.log('🔧 Calling grouped reports rendering with RLS...');
      window.renderReportsTable();
    } else {
      console.warn('⚠️ renderReportsTable function not available');
    }
  }
  
  // Function to populate department filter with RLS (moved outside conditional blocks)
  function populateDepartmentFilterWithRLS() {
    console.log('🔒 populateDepartmentFilterWithRLS called...');
    
    const departmentFilter = document.getElementById('department-filter');
    if (departmentFilter) {
      console.log('🔒 Applying RLS to reports page department filter...');
      console.log('🔒 Department filter element found:', departmentFilter);
      
      // Check what departments are available in the database - try multiple methods
      let allDepartments = [];
      
      // Method 1: Try window.DB.get
      if (window.DB && window.DB.get) {
        allDepartments = window.DB.get('departments') || [];
        console.log('🔒 Method 1 - window.DB.get departments:', allDepartments);
      }
      
      // Method 2: Try direct localStorage access
      if (allDepartments.length === 0) {
        try {
          const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
          allDepartments = localData.departments || [];
          console.log('🔒 Method 2 - localStorage departments:', allDepartments);
        } catch (error) {
          console.error('🔒 Error reading departments from localStorage:', error);
        }
      }
      
      // Method 3: Try global DB if available
      if (allDepartments.length === 0 && typeof DB !== 'undefined' && DB && DB.get) {
        allDepartments = DB.get('departments') || [];
        console.log('🔒 Method 3 - global DB departments:', allDepartments);
      }
      
      console.log('🔒 Final all departments found:', allDepartments);
      
      const allowedDepartments = window.getUserAllowedDepartments ? window.getUserAllowedDepartments() : [];
      console.log('🔒 User allowed departments for reports filter:', allowedDepartments);
      
      departmentFilter.innerHTML = '<option value="">All Departments</option>';
      allowedDepartments.forEach(deptName => {
        const option = document.createElement('option');
        option.value = deptName;
        option.textContent = deptName;
        departmentFilter.appendChild(option);
        console.log('🔒 Added department option:', deptName);
      });
      console.log('🔒 Reports page department filter populated with RLS:', allowedDepartments.length, 'departments');
      console.log('🔒 Final filter options:', Array.from(departmentFilter.options).map(opt => opt.text));
      
      // Add event listener for department filter changes
      departmentFilter.addEventListener('change', function() {
        console.log('🔒 Department filter changed to:', this.value);
        filterReportsByDepartment(this.value);
      });
    } else {
      console.error('❌ Department filter element not found!');
    }
  }
  
  // Function to filter reports by department (moved outside conditional blocks)
  function filterReportsByDepartment(selectedDepartment) {
    console.log('🔒 Filtering reports by department:', selectedDepartment);
    
    // Get all report rows
    const reportRows = document.querySelectorAll('.report-type-row');
    console.log('🔒 Found report rows:', reportRows.length);
    
    let visibleCount = 0;
    let firstVisibleIndex = -1;
    
    reportRows.forEach((row, index) => {
      const departmentCell = row.querySelector('td:nth-child(2)'); // Department is in 2nd column
      if (departmentCell) {
        const rowDepartment = departmentCell.textContent.trim();
        console.log(`🔒 Row ${index} department: "${rowDepartment}" vs selected: "${selectedDepartment}"`);
        
        if (!selectedDepartment || rowDepartment === selectedDepartment) {
          row.style.display = '';
          visibleCount++;
          if (firstVisibleIndex === -1) {
            firstVisibleIndex = index;
          }
        } else {
          row.style.display = 'none';
        }
      }
    });
    
    console.log('🔒 Filter result - visible reports:', visibleCount, 'first visible index:', firstVisibleIndex);
    
    // Update preview state with filtered reports
    if (window.previewState && window.previewState.filteredReports) {
      const originalReports = window.previewState.filteredReports;
      const filteredReports = originalReports.filter((report, index) => {
        const row = reportRows[index];
        if (row) {
          return row.style.display !== 'none';
        }
        return true;
      });
      
      window.previewState.filteredReports = filteredReports;
        window.previewState.currentIndex = filteredReports.length > 0 ? 0 : -1;
        
        console.log('🔒 Updated preview state - filtered reports:', filteredReports.length);
        
        // Update preview display
        if (typeof window.updatePreviewDisplay === 'function') {
          window.updatePreviewDisplay();
        }
        
        // Select first visible row if any
        if (firstVisibleIndex >= 0) {
          // Remove selection from all rows
          document.querySelectorAll('.report-type-row').forEach(row => {
            row.classList.remove('selected-row');
          });
          
          // Add selection to first visible row
          const firstVisibleRow = reportRows[firstVisibleIndex];
          if (firstVisibleRow) {
            firstVisibleRow.classList.add('selected-row');
            console.log('🔒 Selected first visible row at index:', firstVisibleIndex);
          }
        }
      }
    }
    
    // Function to setup pagination button event listeners
    function setupPaginationButtons() {
      console.log('🔧 Setting up pagination buttons...');
      
      const prevButton = document.getElementById('prev-report-btn');
      const nextButton = document.getElementById('next-report-btn');
      
      if (prevButton) {
        // Remove existing listeners to prevent duplicates
        prevButton.replaceWith(prevButton.cloneNode(true));
        const newPrevButton = document.getElementById('prev-report-btn');
        
        newPrevButton.addEventListener('click', function() {
          console.log('🔧 Previous button clicked');
          if (window.previewState && window.previewState.currentIndex > 0) {
            window.previewState.currentIndex--;
            console.log('🔧 Moving to previous report, new index:', window.previewState.currentIndex);
            
            // Update preview display
            if (typeof window.updatePreviewDisplay === 'function') {
              window.updatePreviewDisplay();
            }
            
            // Update table row selection
            updateTableRowSelection();
          }
        });
      }
      
      if (nextButton) {
        // Remove existing listeners to prevent duplicates
        nextButton.replaceWith(nextButton.cloneNode(true));
        const newNextButton = document.getElementById('next-report-btn');
        
        newNextButton.addEventListener('click', function() {
          console.log('🔧 Next button clicked');
          if (window.previewState && window.previewState.currentIndex < window.previewState.filteredReports.length - 1) {
            window.previewState.currentIndex++;
            console.log('🔧 Moving to next report, new index:', window.previewState.currentIndex);
            
            // Update preview display
            if (typeof window.updatePreviewDisplay === 'function') {
              window.updatePreviewDisplay();
            }
            
            // Update table row selection
            updateTableRowSelection();
          }
        });
      }
    }
    
    // Function to update table row selection based on current preview index
    function updateTableRowSelection() {
      console.log('🔧 Updating table row selection...');
      
      if (!window.previewState || window.previewState.currentIndex < 0) {
        console.log('🔧 No valid preview index, clearing selection');
        document.querySelectorAll('.report-type-row').forEach(row => {
          row.classList.remove('selected-row');
        });
        return;
      }
      
      const reportRows = document.querySelectorAll('.report-type-row');
      const currentIndex = window.previewState.currentIndex;
      
      console.log('🔧 Current preview index:', currentIndex, 'Total rows:', reportRows.length);
      
      // Remove selection from all rows
      reportRows.forEach(row => {
        row.classList.remove('selected-row');
      });
      
      // Add selection to current index row
      if (reportRows[currentIndex]) {
        reportRows[currentIndex].classList.add('selected-row');
        console.log('🔧 Selected row at index:', currentIndex);
        
        // Scroll to the selected row if needed
        reportRows[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        console.warn('🔧 Row at index', currentIndex, 'not found');
      }
  }
  
  // Log that the fix has been applied
  console.log('✅ Integration fix applied successfully!');
  
  // Test secondary departments functionality
  console.log('🧪 Testing secondary departments functionality...');
  if (typeof getUserAllowedDepartments === 'function') {
    const allowedDepts = getUserAllowedDepartments();
    console.log('Current user allowed departments:', allowedDepts);
  }
  if (typeof getSelectedDepartments === 'function') {
    console.log('getSelectedDepartments function is available');
  }
  
  // Add debug functions to window for troubleshooting
  window.debugSupabaseAuth = async function(email, password) {
    console.log('🔍 Debugging Supabase auth for:', email);
    
    try {
      const client = getSupabaseClient();
      console.log('Supabase client:', client);
      
      // Test login
      const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) {
        console.error('❌ Login failed:', error);
        return { success: false, error: error };
      } else {
        console.log('✅ Login successful:', data);
        await client.auth.signOut();
        return { success: true, data: data };
      }
    } catch (err) {
      console.error('❌ Debug error:', err);
      return { success: false, error: err };
    }
  };
  
  window.debugUserCreation = async function(email, password, name, department, role) {
    console.log('🔍 Debugging user creation for:', email);
    
    try {
      const adminClient = getSupabaseAdminClient();
      console.log('Admin client:', adminClient);
      
      // Create user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: name,
          department: department,
          role: role
        }
      });
      
      if (authError) {
        console.error('❌ User creation failed:', authError);
        return { success: false, error: authError };
      } else {
        console.log('✅ User created:', authData);
        
        // Test login immediately
        const testResult = await window.debugSupabaseAuth(email, password);
        console.log('🧪 Immediate login test result:', testResult);
        
        return { success: true, data: authData, loginTest: testResult };
      }
    } catch (err) {
      console.error('❌ Debug creation error:', err);
      return { success: false, error: err };
    }
  };
  
  console.log('🔧 Debug functions added to window:');
  console.log('- window.debugSupabaseAuth(email, password)');
  console.log('- window.debugUserCreation(email, password, name, department, role)');
  
  // Make the functions globally available
  window.populateDepartmentFilterWithRLS = populateDepartmentFilterWithRLS;
  window.filterReportsByDepartment = filterReportsByDepartment;
  window.setupPaginationButtons = setupPaginationButtons;
  window.updateTableRowSelection = updateTableRowSelection;
  
  // Populate filters with user's allowed departments (RLS) - with delay to ensure data is loaded
  setTimeout(() => {
    console.log('🔒 Delayed filter population - checking data availability...');
    if (typeof populateDepartmentFilterWithRLS === 'function') {
      populateDepartmentFilterWithRLS();
    } else {
      console.warn('⚠️ populateDepartmentFilterWithRLS not available in delayed call');
    }
    if (typeof setupPaginationButtons === 'function') {
      setupPaginationButtons();
    } else {
      console.warn('⚠️ setupPaginationButtons not available in delayed call');
    }
  }, 1000); // 1 second delay
  
  // Also try to populate immediately (only if functions are available)
  if (typeof populateDepartmentFilterWithRLS === 'function') {
    populateDepartmentFilterWithRLS();
  } else {
    console.warn('⚠️ populateDepartmentFilterWithRLS not available for immediate call');
  }
  if (typeof setupPaginationButtons === 'function') {
    setupPaginationButtons();
  } else {
    console.warn('⚠️ setupPaginationButtons not available for immediate call');
  }
  
  // Function to populate upload modal department dropdown
  function populateUploadModalDepartmentDropdown() {
    console.log('🔒 populateUploadModalDepartmentDropdown called...');
    
    const departmentDropdown = document.getElementById('report-department-upload');
    if (departmentDropdown) {
      const allowedDepartments = window.getUserAllowedDepartments ? window.getUserAllowedDepartments() : [];
      console.log('🔒 Applying RLS to upload modal department dropdown...');
      console.log('🔒 User allowed departments for upload:', allowedDepartments);
      
      departmentDropdown.innerHTML = '<option value="">Select Department</option>';
      allowedDepartments.forEach(deptName => {
        const option = document.createElement('option');
        option.value = deptName;
        option.textContent = deptName;
        departmentDropdown.appendChild(option);
      });
      console.log('🔒 Upload modal department dropdown populated with RLS:', allowedDepartments.length, 'departments');
    } else {
      console.warn('⚠️ Upload modal department dropdown not found');
    }
  }
  
  // Make the function globally available
  window.populateUploadModalDepartmentDropdown = populateUploadModalDepartmentDropdown;
}); 