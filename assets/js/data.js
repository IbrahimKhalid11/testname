// Initialize database in localStorage if it doesn't exist
function initializeDatabase() {
    if (!localStorage.getItem('reportrepo_db')) {
        const initialData = {
            departments: [
                { id: 1, name: 'Sales', manager: 'John Doe', reports: 120, onTimeRate: '95%' },
                { id: 2, name: 'Marketing', manager: 'Jane Smith', reports: 95, onTimeRate: '89%' },
                { id: 3, name: 'Finance', manager: 'Peter Jones', reports: 150, onTimeRate: '98%' },
                { id: 4, name: 'Human Resources', manager: 'Mary Johnson', reports: 80, onTimeRate: '91%' },
                { id: 5, name: 'IT', manager: 'David Williams', reports: 110, onTimeRate: '93%' },
                { id: 6, name: 'Supply Chain', manager: 'Sarah Brown', reports: 85, onTimeRate: '92%' },
            ],
            reports: [
                // Individual file records - one report per file
                { id: 1, name: 'Q2 Sales Performance.pdf', department: 'Sales', submitter: 'John Doe', date: '2025-06-05', status: 'Submitted', format: 'PDF', frequency: 'Quarterly', reportTypeId: 1, 
                  report_url: 'https://example.com/files/q2-sales-performance.pdf', file_size: 1024000, created_at: '2025-06-05T10:00:00Z', notes: 'Initial submission' },
                { id: 2, name: 'Q2 Sales Performance v2.pdf', department: 'Sales', submitter: 'John Doe', date: '2025-06-06', status: 'Submitted', format: 'PDF', frequency: 'Quarterly', reportTypeId: 1, 
                  report_url: 'https://example.com/files/q2-sales-performance-v2.pdf', file_size: 1125000, created_at: '2025-06-06T14:30:00Z', notes: 'Updated with regional data' },
                { id: 3, name: 'May Social Media Analytics.xlsx', department: 'Marketing', submitter: 'Jane Smith', date: '2025-06-02', status: 'Submitted', format: 'Excel', frequency: 'Monthly', reportTypeId: 2, 
                  report_url: 'https://example.com/files/may-social-media.xlsx', file_size: 512000, created_at: '2025-06-02T09:15:00Z', notes: 'Initial submission' },
                { id: 4, name: 'May Social Media Analytics v2.xlsx', department: 'Marketing', submitter: 'Jane Smith', date: '2025-06-03', status: 'Submitted', format: 'Excel', frequency: 'Monthly', reportTypeId: 2, 
                  report_url: 'https://example.com/files/may-social-media-v2.xlsx', file_size: 548000, created_at: '2025-06-03T11:45:00Z', notes: 'Updated with new metrics' },
                { id: 5, name: 'May Social Media Analytics v3.xlsx', department: 'Marketing', submitter: 'Jane Smith', date: '2025-06-05', status: 'Submitted', format: 'Excel', frequency: 'Monthly', reportTypeId: 2, 
                  report_url: 'https://example.com/files/may-social-media-v3.xlsx', file_size: 623000, created_at: '2025-06-05T16:20:00Z', notes: 'Final version with all platforms' },
                { id: 6, name: 'Monthly Expense Report.pdf', department: 'Finance', submitter: 'Peter Jones', date: '2025-06-01', status: 'Submitted', format: 'PDF', frequency: 'Monthly', reportTypeId: 3, 
                  report_url: 'https://example.com/files/monthly-expense-report.pdf', file_size: 825000, created_at: '2025-06-01T08:00:00Z', notes: 'Initial submission' },
                { id: 7, name: 'Employee Onboarding Stats.png', department: 'Human Resources', submitter: 'Mary Johnson', date: '2025-06-08', status: 'Pending', format: 'Image', frequency: 'Monthly', reportTypeId: 4, 
                  report_url: 'https://example.com/files/employee-onboarding-stats.png', file_size: 156000, created_at: '2025-06-08T13:30:00Z', notes: 'Initial submission' },
                { id: 8, name: 'Server Uptime Report.xlsx', department: 'IT', submitter: 'David Williams', date: '2025-05-30', status: 'Late', format: 'Excel', frequency: 'Weekly', reportTypeId: 5, 
                  report_url: 'https://example.com/files/server-uptime-report.xlsx', file_size: 342000, created_at: '2025-05-30T17:45:00Z', notes: 'Initial submission' },
            ],
            reportTypes: [
                { id: 1, name: 'Q2 Sales Performance', department: 'Sales', frequency: 'Quarterly', format: 'PDF', description: 'Sales performance metrics for Q2' },
                { id: 2, name: 'Social Media Analytics', department: 'Marketing', frequency: 'Monthly', format: 'Excel', description: 'Analysis of social media engagement and metrics' },
                { id: 3, name: 'Monthly Expense Report', department: 'Finance', frequency: 'Monthly', format: 'PDF', description: 'Summary of monthly expenses across departments' },
                { id: 4, name: 'Employee Onboarding Stats', department: 'Human Resources', frequency: 'Monthly', format: 'Image', description: 'Statistics on new employee onboarding process' },
                { id: 5, name: 'Server Uptime Report', department: 'IT', frequency: 'Weekly', format: 'Excel', description: 'Server performance and availability metrics' },
            ],
            frequencies: [
                { id: 1, name: 'Daily', description: 'Due every day' },
                { id: 2, name: 'Weekly', description: 'Due every week' },
                { id: 3, name: 'Monthly', description: 'Due every month' },
                { id: 4, name: 'Quarterly', description: 'Due every quarter' },
                { id: 5, name: 'Annually', description: 'Due once a year' },
            ],
            formats: [
                { id: 1, name: 'PDF', description: 'Portable Document Format', extensions: ['.pdf'] },
                { id: 2, name: 'Excel', description: 'Microsoft Excel Spreadsheet', extensions: ['.xlsx', '.xls'] },
                { id: 3, name: 'Word', description: 'Microsoft Word Document', extensions: ['.docx', '.doc'] },
                { id: 4, name: 'Image', description: 'Image files (PNG, JPG, etc.)', extensions: ['.png', '.jpg', '.jpeg', '.gif'] },
                { id: 5, name: 'PowerPoint', description: 'Microsoft PowerPoint Presentation', extensions: ['.pptx', '.ppt'] },
                { id: 6, name: 'Video', description: 'Video files (MP4, AVI, etc.)', extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'] },
            ],
            users: [
                { id: 1, name: 'Admin User', email: 'admin@reportrepo.com', department: 'IT', departments: ['Sales', 'Marketing'], role: 'Admin', lastLogin: '2025-06-08 10:00 AM', permissions: { canView: ['all'], canAdd: ['all'], canEdit: ['all'], canDelete: ['all'] } },
                { id: 2, name: 'John Doe', email: 'john.doe@reportrepo.com', department: 'Sales', departments: ['Marketing'], role: 'Manager', lastLogin: '2025-06-08 09:30 AM', permissions: { canView: ['Sales'], canAdd: ['Sales'], canEdit: ['Sales'], canDelete: ['Sales'] } },
                { id: 3, name: 'Jane Smith', email: 'jane.smith@reportrepo.com', department: 'Marketing', departments: ['Sales'], role: 'Manager', lastLogin: '2025-06-07 05:00 PM', permissions: { canView: ['Marketing'], canAdd: ['Marketing'], canEdit: ['Marketing'], canDelete: ['Marketing'] } },
                { id: 4, name: 'Peter Jones', email: 'peter.jones@reportrepo.com', department: 'Finance', departments: ['IT'], role: 'Manager', lastLogin: '2025-06-08 08:00 AM', permissions: { canView: ['Finance'], canAdd: ['Finance'], canEdit: ['Finance'], canDelete: ['Finance'] } },
                { id: 5, name: 'Mary Johnson', email: 'mary.johnson@reportrepo.com', department: 'Human Resources', departments: [], role: 'Manager', lastLogin: '2025-06-08 11:00 AM', permissions: { canView: ['Human Resources'], canAdd: ['Human Resources'], canEdit: ['Human Resources'], canDelete: ['Human Resources'] } },
                { id: 6, name: 'Youssef', email: 'youssef@reportrepo.com', department: 'Marketing', departments: [], role: 'User', lastLogin: '2025-06-08 12:00 PM', permissions: { canView: ['Marketing'], canAdd: ['Marketing'], canEdit: ['own'], canDelete: ['none'] } },
            ],
            // NEW: KPI Scorecard System Data Models
            scorecards: [
                { 
                    id: 1, 
                    name: 'Sales Performance Scorecard', 
                    description: 'Comprehensive KPI tracking for sales team performance',
                    department: 'Sales',
                    created_by: 1,
                    created_at: '2025-06-01T10:00:00Z',
                    updated_at: '2025-06-01T10:00:00Z',
                    is_active: true,
                    tags: ['sales', 'performance', 'quarterly']
                },
                { 
                    id: 2, 
                    name: 'Marketing Effectiveness Scorecard', 
                    description: 'Track marketing campaign performance and ROI metrics',
                    department: 'Marketing',
                    created_by: 1,
                    created_at: '2025-06-01T11:00:00Z',
                    updated_at: '2025-06-01T11:00:00Z',
                    is_active: true,
                    tags: ['marketing', 'campaigns', 'roi']
                },
                { 
                    id: 3, 
                    name: 'IT Operations Scorecard', 
                    description: 'Monitor IT infrastructure and service delivery metrics',
                    department: 'IT',
                    created_by: 1,
                    created_at: '2025-06-01T12:00:00Z',
                    updated_at: '2025-06-01T12:00:00Z',
                    is_active: true,
                    tags: ['it', 'operations', 'infrastructure']
                },
                { 
                    id: 4, 
                    name: 'Supply Chain Operations Scorecard', 
                    description: 'Track supply chain efficiency and performance metrics',
                    department: 'Supply Chain',
                    created_by: 1,
                    created_at: '2025-06-01T13:00:00Z',
                    updated_at: '2025-06-01T13:00:00Z',
                    is_active: true,
                    tags: ['supply-chain', 'operations', 'efficiency']
                },
                { 
                    id: 5, 
                    name: 'test2', 
                    description: 'Test scorecard for Supply Chain department',
                    department: 'Supply Chain',
                    created_by: 1,
                    created_at: '2025-06-01T14:00:00Z',
                    updated_at: '2025-06-01T14:00:00Z',
                    is_active: true,
                    tags: ['test', 'supply-chain']
                }
            ],
            kpis: [
                {
                    id: 1,
                    scorecard_id: 1,
                    name: 'Sales Revenue',
                    description: 'Total sales revenue achieved',
                    weight: 30,
                    target: 1000000,
                    unit: 'USD',
                    linked_report_types: [1], // Q2 Sales Performance
                    created_at: '2025-06-01T10:00:00Z',
                    is_active: true
                },
                {
                    id: 2,
                    scorecard_id: 1,
                    name: 'Customer Acquisition Rate',
                    description: 'Number of new customers acquired',
                    weight: 25,
                    target: 50,
                    unit: 'customers',
                    linked_report_types: [1], // Q2 Sales Performance
                    created_at: '2025-06-01T10:00:00Z',
                    is_active: true
                },
                {
                    id: 3,
                    scorecard_id: 1,
                    name: 'Sales Conversion Rate',
                    description: 'Percentage of leads converted to sales',
                    weight: 20,
                    target: 15,
                    unit: '%',
                    linked_report_types: [1], // Q2 Sales Performance
                    created_at: '2025-06-01T10:00:00Z',
                    is_active: true
                },
                {
                    id: 4,
                    scorecard_id: 2,
                    name: 'Social Media Engagement',
                    description: 'Average engagement rate on social media posts',
                    weight: 35,
                    target: 5,
                    unit: '%',
                    linked_report_types: [2], // Social Media Analytics
                    created_at: '2025-06-01T11:00:00Z',
                    is_active: true
                },
                {
                    id: 5,
                    scorecard_id: 2,
                    name: 'Campaign ROI',
                    description: 'Return on investment for marketing campaigns',
                    weight: 40,
                    target: 300,
                    unit: '%',
                    linked_report_types: [2], // Social Media Analytics
                    created_at: '2025-06-01T11:00:00Z',
                    is_active: true
                },
                {
                    id: 6,
                    scorecard_id: 3,
                    name: 'Server Uptime',
                    description: 'Percentage of time servers are operational',
                    weight: 50,
                    target: 99.9,
                    unit: '%',
                    linked_report_types: [5], // Server Uptime Report
                    created_at: '2025-06-01T12:00:00Z',
                    is_active: true
                },
                {
                    id: 7,
                    scorecard_id: 3,
                    name: 'Response Time',
                    description: 'Average response time for IT support tickets',
                    weight: 30,
                    target: 4,
                    unit: 'hours',
                    linked_report_types: [5], // Server Uptime Report
                    created_at: '2025-06-01T12:00:00Z',
                    is_active: true
                },
                {
                    id: 8,
                    scorecard_id: 4,
                    name: 'On-Time Delivery',
                    description: 'Percentage of orders delivered on time',
                    weight: 40,
                    target: 95,
                    unit: '%',
                    linked_report_types: [],
                    created_at: '2025-06-01T13:00:00Z',
                    is_active: true
                },
                {
                    id: 9,
                    scorecard_id: 4,
                    name: 'Inventory Turnover',
                    description: 'Number of times inventory is sold and replaced',
                    weight: 30,
                    target: 8,
                    unit: 'times',
                    linked_report_types: [],
                    created_at: '2025-06-01T13:00:00Z',
                    is_active: true
                },
                {
                    id: 10,
                    scorecard_id: 5,
                    name: 'Test KPI 1',
                    description: 'Test KPI for test2 scorecard',
                    weight: 50,
                    target: 100,
                    unit: 'units',
                    linked_report_types: [],
                    created_at: '2025-06-01T14:00:00Z',
                    is_active: true
                },
                {
                    id: 11,
                    scorecard_id: 5,
                    name: 'Test KPI 2',
                    description: 'Another test KPI for test2 scorecard',
                    weight: 50,
                    target: 50,
                    unit: '%',
                    linked_report_types: [],
                    created_at: '2025-06-01T14:00:00Z',
                    is_active: true
                }
            ],
            scorecard_assignments: [
                {
                    id: 1,
                    scorecard_id: 1,
                    user_id: 2, // John Doe
                    department: 'Sales',
                    period_month: 6,
                    period_year: 2025,
                    can_edit: true,
                    assigned_at: '2025-06-01T10:00:00Z',
                    is_active: true
                },
                {
                    id: 2,
                    scorecard_id: 2,
                    user_id: 6, // Youssef (responsible person)
                    department: 'Marketing',
                    period_month: 6,
                    period_year: 2025,
                    can_edit: true,
                    assigned_at: '2025-06-01T11:00:00Z',
                    is_active: true
                },
                {
                    id: 3,
                    scorecard_id: 3,
                    user_id: 1, // Admin User
                    department: 'IT',
                    period_month: 6,
                    period_year: 2025,
                    can_edit: true,
                    assigned_at: '2025-06-01T12:00:00Z',
                    is_active: true
                },
                {
                    id: 4,
                    scorecard_id: 4,
                    user_id: 1, // Admin User (will be replaced by department manager)
                    department: 'Supply Chain',
                    period_month: 6,
                    period_year: 2025,
                    can_edit: true,
                    assigned_at: '2025-06-01T13:00:00Z',
                    is_active: true
                },
                {
                    id: 5,
                    scorecard_id: 5,
                    user_id: 1, // Admin User (will be replaced by department manager)
                    department: 'Supply Chain',
                    period_month: 6,
                    period_year: 2025,
                    can_edit: true,
                    assigned_at: '2025-06-01T14:00:00Z',
                    is_active: true
                }
            ],
            scorecard_results: [
                {
                    id: 1,
                    scorecard_id: 1,
                    user_id: 2, // John Doe
                    period_month: 6,
                    period_year: 2025,
                    kpi_values: {
                        1: 950000, // Sales Revenue: 950k (target: 1M)
                        2: 45,     // Customer Acquisition: 45 (target: 50)
                        3: 12      // Conversion Rate: 12% (target: 15%)
                    },
                    total_score: 78.5,
                    status: 'submitted', // draft, submitted, approved
                    submitted_by: 2, // John Doe (responsible person)
                    submitted_at: '2025-06-15T14:30:00Z',
                    approved_by: null, // Will be set when approved by department manager
                    approved_at: null,
                    final_approved_by: null, // Will be set when approved by HR manager
                    final_approved_at: null,
                    created_at: '2025-06-15T14:30:00Z',
                    updated_at: '2025-06-15T14:30:00Z'
                },
                {
                    id: 2,
                    scorecard_id: 2,
                    user_id: 6, // Youssef (responsible person)
                    period_month: 6,
                    period_year: 2025,
                    kpi_values: {
                        4: 4.2,  // Social Media Engagement: 4.2% (target: 5%)
                        5: 280   // Campaign ROI: 280% (target: 300%)
                    },
                    total_score: 82.4,
                    status: 'draft', // Still in draft
                    submitted_by: 6, // Youssef (responsible person)
                    submitted_at: null,
                    approved_by: null,
                    approved_at: null,
                    final_approved_by: null,
                    final_approved_at: null,
                    created_at: '2025-06-16T09:15:00Z',
                    updated_at: '2025-06-16T09:15:00Z'
                },
                {
                    id: 3,
                    scorecard_id: 3,
                    user_id: 1, // Admin User
                    period_month: 6,
                    period_year: 2025,
                    kpi_values: {
                        6: 99.95, // Server Uptime: 99.95% (target: 99.9%)
                        7: 3.5    // Response Time: 3.5 hours (target: 4 hours)
                    },
                    total_score: 95.2,
                    status: 'approved', // Fully approved
                    submitted_by: 1, // Admin User (responsible person)
                    submitted_at: '2025-06-17T16:45:00Z',
                    approved_by: 4, // Peter Jones (Finance Manager - acting as department manager)
                    approved_at: '2025-06-18T10:30:00Z',
                    final_approved_by: 4, // Mary Johnson (HR Manager)
                    final_approved_at: '2025-06-19T14:20:00Z',
                    created_at: '2025-06-17T16:45:00Z',
                    updated_at: '2025-06-19T14:20:00Z'
                }
            ],
            recentActivity: [
                { user: 'John Doe', action: 'submitted Q2 Sales Performance', time: '2 hours ago' },
                { user: 'Jane Smith', action: 'uploaded a new version of May Social Media Analytics', time: '1 day ago' },
                { user: 'Admin User', action: 'added a new user: Sarah Brown', time: '1 day ago' },
                { user: 'Peter Jones', action: 'submitted Monthly Expense Report', time: '2 days ago' },
            ],
            systemReport: {
                'June 2025': [
                    { department: 'Sales', total: 10, submitted: 8, pending: 1, late: 1, onTime: '80%' },
                    { department: 'Marketing', total: 8, submitted: 7, pending: 1, late: 0, onTime: '87.5%' },
                    { department: 'Finance', total: 12, submitted: 12, pending: 0, late: 0, onTime: '100%' },
                    { department: 'Human Resources', total: 6, submitted: 5, pending: 1, late: 0, onTime: '83.3%' },
                    { department: 'IT', total: 9, submitted: 8, pending: 0, late: 1, onTime: '88.9%' },
                ]
            },
            // Predefined permission sets
            permissionSets: [
                { id: 1, name: 'Admin', description: 'Full access to all features', permissions: { canView: ['all'], canAdd: ['all'], canEdit: ['all'], canDelete: ['all'] } },
                { id: 2, name: 'Department Manager', description: 'Full access to own department', permissions: { canView: ['department'], canAdd: ['department'], canEdit: ['department'], canDelete: ['department'] } },
                { id: 3, name: 'User', description: 'View and submit reports', permissions: { canView: ['department'], canAdd: ['department'], canEdit: ['own'], canDelete: ['none'] } },
                { id: 4, name: 'Viewer', description: 'View-only access', permissions: { canView: ['department'], canAdd: ['none'], canEdit: ['none'], canDelete: ['none'] } }
            ],
            // Current logged in user (for demo purposes)
            currentUser: { id: 1, name: 'Admin User', role: 'Admin' }
        };
        localStorage.setItem('reportrepo_db', JSON.stringify(initialData));
    }
}

// Database access functions
const DB = {
    get: function(collection) {
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        return data[collection];
    },
    getById: function(collection, id) {
        const items = this.get(collection);
        return items.find(item => item.id == id);
    },
    add: function(collection, item) {
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        // Generate new ID
        const maxId = data[collection].reduce((max, current) => (current.id > max ? current.id : max), 0);
        item.id = maxId + 1;
        // Add item
        data[collection].push(item);
        localStorage.setItem('reportrepo_db', JSON.stringify(data));
        return item;
    },
    update: function(collection, id, updates) {
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        const index = data[collection].findIndex(item => item.id == id);
        if (index !== -1) {
            data[collection][index] = { ...data[collection][index], ...updates };
            localStorage.setItem('reportrepo_db', JSON.stringify(data));
            return data[collection][index];
        }
        return null;
    },
    delete: function(collection, id) {
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        const index = data[collection].findIndex(item => item.id == id);
        if (index !== -1) {
            data[collection].splice(index, 1);
            localStorage.setItem('reportrepo_db', JSON.stringify(data));
            return true;
        }
        return false;
    },
    getSystemReport: function(month) {
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        return data.systemReport[month];
    },
    addActivity: function(activity) {
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        
        // Ensure recentActivity array exists (it might not exist if data was synced from Supabase)
        if (!data.recentActivity) {
            data.recentActivity = [];
        }
        
        data.recentActivity.unshift(activity);
        // Keep only the 10 most recent activities
        if (data.recentActivity.length > 10) {
            data.recentActivity = data.recentActivity.slice(0, 10);
        }
        localStorage.setItem('reportrepo_db', JSON.stringify(data));
    },
    getCurrentUser: function() {
        // First try to get the user from Supabase auth
        try {
            if (typeof supabaseAuth !== 'undefined' && supabaseAuth.getUserData) {
                const supabaseUser = supabaseAuth.getUserData();
                if (supabaseUser) {
                    console.log('Getting current user from Supabase auth:', supabaseUser.email);
                    return {
                        id: supabaseUser.id,
                        name: supabaseUser.name || supabaseUser.email,
                        email: supabaseUser.email,
                        role: supabaseUser.role || 'User',
                        department: supabaseUser.department || 'General'
                    };
                }
            }
        } catch (error) {
            console.warn('Error getting user from Supabase auth:', error);
        }
        
        // Then try from localStorage user_data (set during login)
        try {
            const userDataStr = localStorage.getItem('user_data');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                console.log('Getting current user from localStorage user_data:', userData.email);
                return {
                    id: userData.id,
                    name: userData.name || userData.email,
                    email: userData.email,
                    role: userData.role || 'User',
                    department: userData.department || 'General'
                };
            }
        } catch (error) {
            console.warn('Error getting user from localStorage user_data:', error);
        }
        
        // Fallback to the app's internal currentUser
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        console.log('Getting current user from reportrepo_db.currentUser');
        return data.currentUser;
    },
    setCurrentUser: function(user) {
        // Update app's internal current user
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        data.currentUser = user;
        localStorage.setItem('reportrepo_db', JSON.stringify(data));
        
        console.log('Current user set to:', user);
        
        // Also try to update in user_data for consistency
        try {
            const userDataStr = localStorage.getItem('user_data');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                // Only update role and permissions to avoid overwriting auth data
                userData.role = user.role;
                userData.permissions = user.permissions;
                localStorage.setItem('user_data', JSON.stringify(userData));
            }
        } catch (error) {
            console.warn('Error updating user_data:', error);
        }
    },
    // Note: addReportFile and getReportFiles methods removed - 
    // no longer needed with one-file-per-report architecture
    // User permissions functions
    hasPermission: function(userId, action, department) {
        const user = this.getById('users', userId);
        if (!user || !user.permissions) return false;
        
        // Admin can do anything
        if (user.role === 'Admin' || user.permissions[action].includes('all')) {
            return true;
        }
        
        // Department-specific permissions
        if (user.permissions[action].includes('department')) {
            return user.department === department;
        }
        
        // Explicit department permission
        return user.permissions[action].includes(department);
    },
    isValidFileFormat: function(formatName, fileName) {
        const format = this.get('formats').find(f => f.name === formatName);
        if (!format || !format.extensions) return false;
        
        const fileExtension = '.' + fileName.split('.').pop().toLowerCase();
        return format.extensions.includes(fileExtension);
    },
    getReportTypeFormat: function(reportTypeId) {
        const reportType = this.getById('reportTypes', reportTypeId);
        return reportType ? reportType.format : null;
    },
    // Set method for bulk collection updates (needed for Backendless integration)
    set: function(collection, items) {
        const data = JSON.parse(localStorage.getItem('reportrepo_db'));
        data[collection] = items;
        localStorage.setItem('reportrepo_db', JSON.stringify(data));
        return items;
    },
    // Get all data for backup/sync purposes
    getAllData: function() {
        return JSON.parse(localStorage.getItem('reportrepo_db'));
    },
    // Replace all data (for full sync from backend)
    replaceAllData: function(newData) {
        localStorage.setItem('reportrepo_db', JSON.stringify(newData));
    },
    
    // NEW: KPI Scorecard System Methods
    
    /**
     * Get scorecards by department
     * @param {string} department - Department name
     * @returns {Array} Array of scorecards
     */
    getScorecardsByDepartment: function(department) {
        const scorecards = this.get('scorecards');
        return scorecards.filter(scorecard => scorecard.department === department && scorecard.is_active);
    },
    
    /**
     * Get KPIs for a specific scorecard
     * @param {number} scorecardId - Scorecard ID
     * @returns {Array} Array of KPIs
     */
    getKPIsByScorecard: function(scorecardId) {
        const kpis = this.get('kpis');
        return kpis.filter(kpi => kpi.scorecard_id === scorecardId && kpi.is_active);
    },
    
    /**
     * Get scorecard assignment for a user and period
     * @param {number} userId - User ID
     * @param {number} scorecardId - Scorecard ID
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Object|null} Assignment or null
     */
    getScorecardAssignment: function(userId, scorecardId, month, year) {
        const assignments = this.get('scorecard_assignments');
        return assignments.find(assignment => 
            assignment.user_id === userId && 
            assignment.scorecard_id === scorecardId && 
            assignment.period_month === month && 
            assignment.period_year === year && 
            assignment.is_active
        );
    },
    
    /**
     * Get scorecard results for a user and period
     * @param {number} userId - User ID
     * @param {number} scorecardId - Scorecard ID
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Object|null} Result or null
     */
    getScorecardResult: function(userId, scorecardId, month, year) {
        const results = this.get('scorecard_results');
        return results.find(result => 
            result.user_id === userId && 
            result.scorecard_id === scorecardId && 
            result.period_month === month && 
            result.period_year === year
        );
    },
    
    /**
     * Get all scorecard results for a department
     * @param {string} department - Department name
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Array} Array of results
     */
    getScorecardResultsByDepartment: function(department, month, year) {
        const results = this.get('scorecard_results');
        const assignments = this.get('scorecard_assignments');
        
        // Get scorecard IDs for the department
        const departmentScorecards = this.getScorecardsByDepartment(department);
        const scorecardIds = departmentScorecards.map(sc => sc.id);
        
        // Get assignments for these scorecards in the specified period
        const periodAssignments = assignments.filter(assignment => 
            scorecardIds.includes(assignment.scorecard_id) && 
            assignment.period_month === month && 
            assignment.period_year === year
        );
        
        // Get results for these assignments
        return results.filter(result => 
            periodAssignments.some(assignment => 
                assignment.user_id === result.user_id && 
                assignment.scorecard_id === result.scorecard_id
            )
        );
    },
    
    /**
     * Calculate score for a KPI based on actual vs target
     * @param {Object} kpi - KPI object
     * @param {number} actualValue - Actual value achieved
     * @returns {number} Score (0-100)
     */
    calculateKPIScore: function(kpi, actualValue) {
        if (actualValue === null || actualValue === undefined) return 0;
        
        const target = kpi.target;
        const actual = actualValue;
        
        // Calculate percentage of target achieved
        let percentage = (actual / target) * 100;
        
        // Cap at 100% for over-achievement
        return Math.min(percentage, 100);
    },
    
    /**
     * Calculate total scorecard score
     * @param {Array} kpis - Array of KPI objects
     * @param {Object} kpiValues - Object with KPI ID as key and actual value as value
     * @returns {number} Total weighted score
     */
    calculateScorecardScore: function(kpis, kpiValues) {
        let totalWeight = 0;
        let weightedScore = 0;
        
        kpis.forEach(kpi => {
            const actualValue = kpiValues[kpi.id];
            if (actualValue !== null && actualValue !== undefined) {
                const kpiScore = this.calculateKPIScore(kpi, actualValue);
                weightedScore += (kpiScore * kpi.weight);
                totalWeight += kpi.weight;
            }
        });
        
        return totalWeight > 0 ? weightedScore / totalWeight : 0;
    },
    
    /**
     * Get linked report types for a KPI
     * @param {number} kpiId - KPI ID
     * @returns {Array} Array of report type objects
     */
    getLinkedReportTypes: function(kpiId) {
        const kpi = this.getById('kpis', kpiId);
        if (!kpi || !kpi.linked_report_types) return [];
        
        return kpi.linked_report_types.map(reportTypeId => 
            this.getById('reportTypes', reportTypeId)
        ).filter(Boolean);
    },
    
    /**
     * Check if user can edit a scorecard
     * @param {number} userId - User ID
     * @param {number} scorecardId - Scorecard ID
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {boolean} Can edit
     */
    canEditScorecard: function(userId, scorecardId, month, year) {
        const assignment = this.getScorecardAssignment(userId, scorecardId, month, year);
        return assignment ? assignment.can_edit : false;
    },
    
    /**
     * Get user's assigned scorecards
     * @param {number} userId - User ID
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {Array} Array of scorecard assignments
     */
    getUserScorecardAssignments: function(userId, month, year) {
        const assignments = this.get('scorecard_assignments');
        return assignments.filter(assignment => 
            assignment.user_id === userId && 
            assignment.period_month === month && 
            assignment.period_year === year && 
            assignment.is_active
        );
    }
};

// Initialize database on page load
initializeDatabase();

// For backward compatibility with existing code
const mockData = {
    departments: DB.get('departments'),
    reports: DB.get('reports'),
    reportTypes: DB.get('reportTypes'),
    frequencies: DB.get('frequencies'),
    formats: DB.get('formats'),
    users: DB.get('users'),
    recentActivity: DB.get('recentActivity'),
    systemReport: JSON.parse(localStorage.getItem('reportrepo_db')).systemReport
};