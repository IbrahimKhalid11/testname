// Supabase Full Integration Manager
// Coordinates all data synchronization between local storage and Supabase

class SupabaseIntegrationManager {
    constructor() {
        this.isInitialized = false;
        this.syncInProgress = false;
        this.lastFullSyncTime = null;
        this.components = {
            departmentsUsers: null,
            reportsStorage: null
        };
    }

    /**
     * Initialize full integration system
     */
    async init() {
        console.log('🚀 Initializing Supabase Integration Manager...');
        
        try {
            // Initialize Supabase client script if not already loaded
            await this.ensureSupabaseClientLoaded();
            
            // Initialize component integrations
            if (typeof departmentsUsersIntegration !== 'undefined') {
                await departmentsUsersIntegration.init();
                this.components.departmentsUsers = departmentsUsersIntegration;
                console.log('✅ Departments & Users integration ready');
            }
            
            if (typeof reportsStorageIntegration !== 'undefined') {
                await reportsStorageIntegration.init();
                this.components.reportsStorage = reportsStorageIntegration;
                console.log('✅ Reports & Storage integration ready');
            }
            
            this.isInitialized = true;
            console.log('✅ Supabase Integration Manager initialized');
            
            return true;
        } catch (error) {
            console.error('❌ Supabase Integration Manager initialization failed:', error);
            return false;
        }
    }

    /**
     * Ensure the Supabase client script is loaded
     */
    async ensureSupabaseClientLoaded() {
        if (typeof supabase !== 'undefined') {
            return true;
        }
        
        return new Promise((resolve, reject) => {
            // Check if the script is already in the process of loading
            if (document.querySelector('script[src*="supabase-js"]')) {
                // Script is already loading, wait for it
                const checkSupabase = setInterval(() => {
                    if (typeof supabase !== 'undefined') {
                        clearInterval(checkSupabase);
                        resolve(true);
                    }
                }, 100);
                
                // Set a timeout in case the script fails to load
                setTimeout(() => {
                    clearInterval(checkSupabase);
                    if (typeof supabase === 'undefined') {
                        console.error('Supabase client script load timeout');
                        reject(new Error('Supabase client script load timeout'));
                    }
                }, 10000); // 10 second timeout
                
                return;
            }
            
            // Script needs to be loaded
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.async = true;
            
            script.onload = () => {
                // Initialize Supabase client once script is loaded
                if (typeof supabase !== 'undefined') {
                    console.log('Supabase client script loaded');
                    resolve(true);
                } else {
                    // Create global supabase object
                    window.supabase = {
                        createClient: (url, key) => {
                            return {
                                auth: {},
                                from: () => {},
                                storage: {}
                            };
                        }
                    };
                    console.log('Created fallback Supabase client');
                    resolve(true);
                }
            };
            
            script.onerror = () => {
                console.error('Failed to load Supabase client script');
                reject(new Error('Failed to load Supabase client script'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Perform complete data synchronization
     */
    async fullSync(direction = 'bidirectional') {
        if (this.syncInProgress) {
            console.log('⚠️ Full sync already in progress');
            return;
        }

        this.syncInProgress = true;
        console.log(`🔄 Starting full system sync (${direction})...`);

        try {
            const results = {};

            // Phase 1: Sync foundational data (departments, users)
            if (this.components.departmentsUsers) {
                console.log('📋 Phase 1: Syncing foundational data...');
                results.foundational = await this.components.departmentsUsers.syncDepartmentsAndUsers(direction);
            }

            // Phase 2: Sync reports and related data
            if (this.components.reportsStorage) {
                console.log('📄 Phase 2: Syncing reports and storage data...');
                results.reports = await this.components.reportsStorage.syncAllReportsData(direction);
            }

            this.lastFullSyncTime = new Date();
            console.log('✅ Full system sync completed:', results);
            
            // Trigger UI refresh
            this.triggerUIRefresh();
            
            return results;
        } catch (error) {
            console.error('❌ Full sync failed:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync only departments data
     */
    async syncDepartments(direction = 'bidirectional') {
        if (this.components.departmentsUsers) {
            return await this.components.departmentsUsers.syncDepartmentsOnly(direction);
        }
        throw new Error('Departments integration not available');
    }

    /**
     * Sync only users data
     */
    async syncUsers(direction = 'bidirectional') {
        if (this.components.departmentsUsers) {
            return await this.components.departmentsUsers.syncUsersOnly(direction);
        }
        throw new Error('Users integration not available');
    }

    /**
     * Sync only reports data
     */
    async syncReports(direction = 'bidirectional') {
        if (this.components.reportsStorage) {
            return await this.components.reportsStorage.syncReports(direction);
        }
        throw new Error('Reports integration not available');
    }

    /**
     * Sync only report types data
     */
    async syncReportTypes(direction = 'bidirectional') {
        if (this.components.reportsStorage) {
            return await this.components.reportsStorage.syncReportTypes(direction);
        }
        throw new Error('Report types integration not available');
    }

    /**
     * Create new department with full integration
     */
    async createDepartment(departmentData) {
        if (this.components.departmentsUsers) {
            const result = await this.components.departmentsUsers.createDepartment(departmentData);
            this.triggerUIRefresh();
            return result;
        }
        throw new Error('Departments integration not available');
    }

    /**
     * Create new report with file upload
     */
    async createReport(reportData, files = []) {
        if (this.components.reportsStorage) {
            const result = await this.components.reportsStorage.createReport(reportData, files);
            this.triggerUIRefresh();
            return result;
        }
        throw new Error('Reports integration not available');
    }

    /**
     * Upload file to existing report
     */
    async uploadFileToReport(reportId, file, notes = '') {
        if (this.components.reportsStorage) {
            const result = await this.components.reportsStorage.uploadReportFile(reportId, file, notes);
            this.triggerUIRefresh();
            return result;
        }
        throw new Error('File upload integration not available');
    }

    /**
     * Get comprehensive sync status
     */
    getSyncStatus() {
        const status = {
            isInitialized: this.isInitialized,
            syncInProgress: this.syncInProgress,
            lastFullSyncTime: this.lastFullSyncTime,
            components: {}
        };

        if (this.components.departmentsUsers) {
            status.components.departmentsUsers = this.components.departmentsUsers.getSyncStatus();
        }

        if (this.components.reportsStorage) {
            status.components.reportsStorage = this.components.reportsStorage.getSyncStatus();
        }

        return status;
    }

    /**
     * Trigger UI refresh across all pages
     */
    triggerUIRefresh() {
        // Trigger refresh events for different page components
        try {
            // Refresh departments table if on departments page
            if (document.getElementById('departments-table')) {
                renderTable('departments-table', DB.get('departments'), ['name', 'manager', 'reports', 'onTimeRate']);
            }

            // Refresh settings tables if on settings page
            if (document.getElementById('departments-settings-table')) {
                this.refreshSettingsPage();
            }

            // Refresh reports page if on reports page
            if (document.getElementById('reports-table')) {
                this.refreshReportsPage();
            }

            // Refresh dashboard if on dashboard page
            if (document.querySelector('.dashboard-metrics')) {
                this.refreshDashboard();
            }

            console.log('✅ UI refresh triggered');
        } catch (error) {
            console.warn('⚠️ UI refresh had some issues:', error);
        }
    }

    /**
     * Refresh settings page components
     */
    refreshSettingsPage() {
        try {
            // Refresh departments table
            const departmentsTable = document.getElementById('departments-settings-table');
            if (departmentsTable) {
                this.renderSettingsTable('departments', DB.get('departments'));
            }

            // Refresh report types table
            const reportTypesTable = document.getElementById('reports-settings-table');
            if (reportTypesTable) {
                this.renderSettingsTable('reportTypes', DB.get('reportTypes'));
            }

            // Refresh frequencies table
            const frequenciesTable = document.getElementById('frequencies-settings-table');
            if (frequenciesTable) {
                this.renderSettingsTable('frequencies', DB.get('frequencies'));
            }

            // Refresh formats table
            const formatsTable = document.getElementById('formats-settings-table');
            if (formatsTable) {
                this.renderSettingsTable('formats', DB.get('formats'));
            }

            console.log('✅ Settings page refreshed');
        } catch (error) {
            console.warn('⚠️ Settings page refresh failed:', error);
        }
    }

    /**
     * Render settings table with updated data
     */
    renderSettingsTable(type, data) {
        const tableId = `${type}-settings-table`;
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            
            switch (type) {
                case 'departments':
                    row.innerHTML = `
                        <td>${item.name}</td>
                        <td>${item.manager}</td>
                        <td>${item.reports || 0}</td>
                        <td>${item.onTimeRate || '0%'}</td>
                        <td>
                            <button class="btn-sm btn-primary" onclick="editDepartment(${item.id})">Edit</button>
                            <button class="btn-sm btn-danger" onclick="deleteDepartment(${item.id})">Delete</button>
                        </td>
                    `;
                    break;
                case 'reportTypes':
                    row.innerHTML = `
                        <td>${item.name}</td>
                        <td>${item.department}</td>
                        <td>${item.frequency}</td>
                        <td>${item.format}</td>
                        <td>${item.description || ''}</td>
                        <td>
                            <button class="btn-sm btn-primary" onclick="editReportType(${item.id})">Edit</button>
                            <button class="btn-sm btn-danger" onclick="deleteReportType(${item.id})">Delete</button>
                        </td>
                    `;
                    break;
                case 'frequencies':
                    row.innerHTML = `
                        <td>${item.name}</td>
                        <td>${item.description || ''}</td>
                        <td>
                            <button class="btn-sm btn-primary" onclick="editFrequency(${item.id})">Edit</button>
                            <button class="btn-sm btn-danger" onclick="deleteFrequency(${item.id})">Delete</button>
                        </td>
                    `;
                    break;
                case 'formats':
                    row.innerHTML = `
                        <td>${item.name}</td>
                        <td>${item.description || ''}</td>
                        <td>
                            <button class="btn-sm btn-primary" onclick="editFormat(${item.id})">Edit</button>
                            <button class="btn-sm btn-danger" onclick="deleteFormat(${item.id})">Delete</button>
                        </td>
                    `;
                    break;
            }
            
            tbody.appendChild(row);
        });
    }

    /**
     * Refresh reports page
     */
    refreshReportsPage() {
        try {
            if (typeof renderReportsPage === 'function') {
                renderReportsPage();
            }
            console.log('✅ Reports page refreshed');
        } catch (error) {
            console.warn('⚠️ Reports page refresh failed:', error);
        }
    }

    /**
     * Refresh dashboard
     */
    refreshDashboard() {
        try {
            if (typeof renderDashboardChart === 'function') {
                renderDashboardChart();
            }
            if (typeof renderRecentActivity === 'function') {
                renderRecentActivity();
            }
            console.log('✅ Dashboard refreshed');
        } catch (error) {
            console.warn('⚠️ Dashboard refresh failed:', error);
        }
    }

    /**
     * Initialize integration on page load
     */
    async autoInit() {
        console.log('🚀 Auto-initializing Supabase Integration Manager...');
        
        try {
            const initialized = await this.init();
            
            if (initialized) {
                console.log('✅ Auto-initialization successful');
                
                // Perform initial sync from Supabase
                await this.fullSync('fromSupabase');
                
                console.log('✅ Initial data sync completed');
            } else {
                console.warn('⚠️ Running in offline mode');
            }
        } catch (error) {
            console.error('❌ Auto-initialization failed:', error);
        }
    }
}

// Create global instance
const supabaseIntegrationManager = new SupabaseIntegrationManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        supabaseIntegrationManager.autoInit();
    }, 500);
});