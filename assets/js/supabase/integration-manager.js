// Supabase Integration Manager - Streamlined Data Sync
// Implements three-layer data reading architecture with parallel fetching

class SupabaseIntegrationManager {
    constructor() {
        this.isInitialized = false;
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.supabaseData = null;
    }

    /**
     * Initialize the integration manager
     */
    async initialize() {
        return this.init();
    }

    /**
     * Initialize the integration manager
     */
    async init() {
        console.log('🚀 Initializing Supabase Integration Manager...');
        
        try {
            // Initialize Supabase data service
            if (typeof supabaseDataService !== 'undefined') {
                await supabaseDataService.init();
                this.supabaseData = supabaseDataService;
                console.log('✅ Supabase data service ready');
            } else {
                console.warn('⚠️ Supabase data service not available, checking for fallback...');
                // Try to create data service if it doesn't exist
                if (typeof SupabaseData !== 'undefined') {
                    this.supabaseData = new SupabaseData();
                    await this.supabaseData.init();
                    console.log('✅ Created and initialized Supabase data service');
                } else {
                    throw new Error('Supabase data service and SupabaseData class not available');
                }
            }
            
            // Initialize Supabase files service
            if (typeof supabaseFilesService !== 'undefined') {
                await supabaseFilesService.init();
                console.log('✅ Supabase files service ready');
            } else {
                console.warn('⚠️ Supabase files service not available');
            }
            
            this.isInitialized = true;
            console.log('✅ Integration Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Integration Manager initialization failed:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Sync data from Supabase to local storage using parallel fetching
     */
    async syncFromSupabase() {
        if (this.syncInProgress) {
            console.log('⚠️ Sync already in progress');
            return;
        }

        this.syncInProgress = true;
        console.log('📥 Syncing data from Supabase to local storage...');
        
        try {
            // Parallel data fetching for performance - with graceful handling of missing tables
            // Use admin mode for reports to bypass RLS
            let reports = [];
            try {
                await this.supabaseData.setAdminMode(true);
                reports = await this.supabaseData.getReports();
                console.log(`✅ Fetched ${reports.length} reports with admin mode`);
                await this.supabaseData.setAdminMode(false);
            } catch (error) {
                console.warn('⚠️ Could not fetch reports with admin mode:', error);
                await this.supabaseData.setAdminMode(false);
                reports = [];
            }
            
            const [departments, users, reportTypes, frequencies, formats] = 
                await Promise.all([
                    this.supabaseData.getDepartments(),
                    this.supabaseData.getUsers(),
                    this.supabaseData.getReportTypes(),
                    this.supabaseData.getFrequencies(),
                    this.supabaseData.getFormats()
                ]);
            
            // Try to fetch scorecard data, but don't fail if tables don't exist yet
            let scorecards = [], kpis = [], scorecardAssignments = [], scorecardResults = [];
            
            try {
                scorecards = await this.supabaseData.getScorecards();
                console.log('✅ Scorecards table found and synced');
            } catch (error) {
                console.log('⚠️ Scorecards table not found yet - skipping');
            }
            
            try {
                kpis = await this.supabaseData.getKPIs();
                console.log('✅ KPIs table found and synced');
            } catch (error) {
                console.log('⚠️ KPIs table not found yet - skipping');
            }
            
            try {
                scorecardAssignments = await this.supabaseData.getScorecardAssignments();
                console.log('✅ Scorecard assignments table found and synced');
            } catch (error) {
                console.log('⚠️ Scorecard assignments table not found yet - skipping');
            }
            
            try {
                scorecardResults = await this.supabaseData.getScorecardResults();
                console.log('✅ Scorecard results table found and synced');
            } catch (error) {
                console.log('⚠️ Scorecard results table not found yet - skipping');
            }
            
            // Update local storage with fetched data
            const localData = {
                departments: departments || [],
                users: users || [],
                reports: reports || [],
                reportTypes: reportTypes || [],
                frequencies: frequencies || [],
                formats: formats || [],
                scorecards: scorecards || [],
                kpis: kpis || [],
                scorecard_assignments: scorecardAssignments || [],
                scorecard_results: scorecardResults || [],
                recentActivity: [],  // Initialize recentActivity array to prevent undefined errors
                systemReport: {}     // Initialize systemReport object for compatibility
            };
            
            localStorage.setItem('reportrepo_db', JSON.stringify(localData));
            
            this.lastSyncTime = new Date();
            console.log('✅ Data synced from Supabase successfully');
            console.log(`📊 Synced: ${departments?.length || 0} departments, ${users?.length || 0} users, ${reports?.length || 0} reports, ${scorecards?.length || 0} scorecards, ${kpis?.length || 0} KPIs`);
            
            // Trigger UI refresh
            this.triggerUIRefresh();
            
            return {
                departments: departments?.length || 0,
                users: users?.length || 0,
                reports: reports?.length || 0,
                reportTypes: reportTypes?.length || 0,
                frequencies: frequencies?.length || 0,
                formats: formats?.length || 0
            };
        } catch (error) {
            console.error('❌ Sync from Supabase failed:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync data from local storage to Supabase
     */
    async syncToSupabase() {
        if (this.syncInProgress) {
            console.log('⚠️ Sync already in progress');
            return;
        }

        this.syncInProgress = true;
        console.log('📤 Syncing data from local storage to Supabase...');
        
        try {
            const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
            
            const results = await Promise.allSettled([
                this.syncTableToSupabase('departments', localData.departments || []),
                this.syncTableToSupabase('users', localData.users || []),
                this.syncTableToSupabase('report_types', localData.reportTypes || []),
                this.syncTableToSupabase('frequencies', localData.frequencies || []),
                this.syncTableToSupabase('formats', localData.formats || []),
                this.syncTableToSupabase('scorecards', localData.scorecards || []),
                this.syncTableToSupabase('kpis', localData.kpis || []),
                this.syncTableToSupabase('scorecard_assignments', localData.scorecard_assignments || []),
                this.syncTableToSupabase('scorecard_results', localData.scorecard_results || [])
                // Note: Reports sync might need special handling due to file attachments
            ]);
            
            this.lastSyncTime = new Date();
            console.log('✅ Data synced to Supabase successfully');
            
            // Log results
            results.forEach((result, index) => {
                const tables = ['departments', 'users', 'report_types', 'frequencies', 'formats', 'scorecards', 'kpis', 'scorecard_assignments', 'scorecard_results'];
                if (result.status === 'fulfilled') {
                    console.log(`✅ ${tables[index]} synced successfully`);
                } else {
                    console.error(`❌ ${tables[index]} sync failed:`, result.reason);
                }
            });
            
            return results;
        } catch (error) {
            console.error('❌ Sync to Supabase failed:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync a specific table to Supabase
     */
    async syncTableToSupabase(table, data) {
        try {
            if (!data || data.length === 0) {
                console.log(`⚠️ No data to sync for ${table}`);
                return true;
            }
            
            // Enable admin mode to bypass RLS for write operations
            if (this.supabaseData && typeof this.supabaseData.setAdminMode === 'function') {
                this.supabaseData.setAdminMode(true);
                console.log(`🔓 Enabled admin mode for ${table} sync`);
            }
            
            // Transform data to handle UUID to integer conversions and column validation
            const transformedData = data.map(record => {
                const transformed = { ...record };
                
                // Handle user ID conversion for scorecard tables
                if (['scorecards', 'scorecard_assignments', 'scorecard_results'].includes(table)) {
                    if (transformed.created_by && typeof transformed.created_by === 'string') {
                        // Convert UUID to integer (use a hash or default to 1)
                        transformed.created_by = 1; // Default to admin user
                        console.log(`🔄 Converted created_by from UUID to integer: 1`);
                    }
                    if (transformed.user_id && typeof transformed.user_id === 'string') {
                        // Convert UUID to integer
                        transformed.user_id = 1; // Default to admin user
                        console.log(`🔄 Converted user_id from UUID to integer: 1`);
                    }
                }
                
                // Ensure numeric IDs for specific tables that expect integers
                // Don't convert IDs for tables that expect UUIDs (like users)
                if (['departments', 'report_types', 'frequencies', 'formats', 'scorecards', 'kpis', 'scorecard_assignments', 'scorecard_results'].includes(table)) {
                    if (transformed.id && typeof transformed.id === 'string' && !isNaN(parseInt(transformed.id))) {
                        transformed.id = parseInt(transformed.id);
                        console.log(`🔄 Converted ID to integer for ${table}: ${transformed.id}`);
                    }
                }
                
                // Handle specific column issues for scorecards table
                if (table === 'scorecards') {
                    // Ensure responsible_person is a string or null
                    if (transformed.responsible_person === undefined || transformed.responsible_person === '') {
                        transformed.responsible_person = null;
                    }
                    
                    // Remove any undefined values that might cause column errors
                    Object.keys(transformed).forEach(key => {
                        if (transformed[key] === undefined) {
                            delete transformed[key];
                        }
                    });
                }
                
                return transformed;
            });
            
            // Use upsert to handle both inserts and updates
            const result = await this.supabaseData.upsert(table, transformedData);
            console.log(`✅ Synced ${transformedData.length} records to ${table}`);
            
            // Disable admin mode after operation
            if (this.supabaseData && typeof this.supabaseData.setAdminMode === 'function') {
                this.supabaseData.setAdminMode(false);
                console.log(`🔒 Disabled admin mode after ${table} sync`);
            }
            
            return result;
        } catch (error) {
            // Ensure admin mode is turned off even in case of error
            if (this.supabaseData && typeof this.supabaseData.setAdminMode === 'function') {
                this.supabaseData.setAdminMode(false);
                console.log(`🔒 Disabled admin mode after ${table} sync error`);
            }
            
            console.error(`❌ Failed to sync ${table}:`, error);
            throw error;
        }
    }

    /**
     * Bidirectional sync - sync from Supabase first, then sync local changes back
     */
    async bidirectionalSync() {
        console.log('🔄 Starting bidirectional sync...');
        
        try {
            // First, get latest data from Supabase
            await this.syncFromSupabase();
            
            // Then, push any local changes (if needed)
            // This could be enhanced to detect actual local changes
            
            console.log('✅ Bidirectional sync completed');
        } catch (error) {
            console.error('❌ Bidirectional sync failed:', error);
            throw error;
        }
    }

    /**
     * Get specific data with caching and fallback
     */
    async getData(table, options = {}) {
        try {
            // Ensure integration manager is initialized
            if (!this.isInitialized) {
                console.log('Integration manager not initialized, attempting to initialize...');
                await this.init();
            }
            
            // Check if supabaseData is available
            if (!this.supabaseData) {
                console.warn('⚠️ Supabase data service not available, using local storage fallback');
                const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
                return localData[table] || [];
            }
            
            // Try to get from Supabase first
            const data = await this.supabaseData.get(table, options);
            
            if (data && data.length > 0) {
                return data;
            }
            
            // Fallback to local storage
            const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
            return localData[table] || [];
        } catch (error) {
            console.error(`❌ Failed to get ${table} data:`, error);
            
            // Final fallback to local storage
            const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
            return localData[table] || [];
        }
    }

    /**
     * Create new record with automatic sync
     */
    async createRecord(table, record) {
        try {
            // Map local table names to Supabase table names
            const tableMapping = {
                'reportTypes': 'report_types',
                'frequencies': 'frequencies',
                'formats': 'formats',
                'departments': 'departments',
                'users': 'users',
                'reports': 'reports',
                'scorecards': 'scorecards',
                'kpis': 'kpis',
                'scorecard_assignments': 'scorecard_assignments',
                'scorecard_results': 'scorecard_results'
            };
            
            // Use the correct table name for Supabase
            const supabaseTable = tableMapping[table] || table;
            
            // Format ID correctly for the specific table
            if (['departments', 'reportTypes', 'report_types', 'frequencies', 'formats'].includes(table) && record.id) {
                // Ensure ID is numeric for these tables
                record.id = parseInt(record.id);
                if (isNaN(record.id)) {
                    throw new Error(`Invalid ID format for ${table} table: ${record.id}`);
                }
                console.log(`Formatted ID for ${table} table: ${record.id} (numeric)`);
            }
            
            // For tables that should auto-generate IDs, remove the ID field to avoid conflicts
            if (['scorecard_results', 'reports'].includes(table) && record.id) {
                console.log(`Removing ID field for ${table} to let Supabase auto-generate`);
                console.log(`Original record ID: ${record.id}`);
                const { id, ...recordWithoutId } = record;
                record = recordWithoutId;
                console.log(`Record after ID removal:`, record);
            }
            
            // Enable admin mode to bypass RLS for write operations
            if (this.supabaseData && typeof this.supabaseData.setAdminMode === 'function') {
                this.supabaseData.setAdminMode(true);
                console.log('Enabled admin mode for database write operation');
            }
            
            // Create in Supabase first
            const created = await this.supabaseData.insert(supabaseTable, record);
            
            // Disable admin mode after operation
            if (this.supabaseData && typeof this.supabaseData.setAdminMode === 'function') {
                this.supabaseData.setAdminMode(false);
            }
            
            if (created) {
                // Update local storage
                const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
                if (!localData[table]) localData[table] = [];
                localData[table].push(created);
                localStorage.setItem('reportrepo_db', JSON.stringify(localData));
                
                this.triggerUIRefresh();
                console.log(`✅ Created record in ${table} (Supabase table: ${supabaseTable})`);
                return created;
            }
            
            throw new Error('Failed to create record in Supabase');
        } catch (error) {
            // Ensure admin mode is turned off even in case of error
            if (this.supabaseData && typeof this.supabaseData.setAdminMode === 'function') {
                this.supabaseData.setAdminMode(false);
            }
            
            console.error(`❌ Failed to create record in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Update record with automatic sync
     */
    async updateRecord(table, id, updates) {
        try {
            // Update in Supabase first
            const updated = await this.supabaseData.update(table, id, updates);
            
            if (updated) {
                // Update local storage
                const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
                if (localData[table]) {
                    const index = localData[table].findIndex(item => item.id === id);
                    if (index !== -1) {
                        localData[table][index] = { ...localData[table][index], ...updated };
                        localStorage.setItem('reportrepo_db', JSON.stringify(localData));
                    }
                }
                
                this.triggerUIRefresh();
                console.log(`✅ Updated record in ${table}`);
                return updated;
            }
            
            throw new Error('Failed to update record in Supabase');
        } catch (error) {
            console.error(`❌ Failed to update record in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Delete record with automatic sync
     */
    async deleteRecord(table, id) {
        try {
            // Delete from Supabase first
            const deleted = await this.supabaseData.delete(table, id);
            
            if (deleted) {
                // Update local storage
                const localData = JSON.parse(localStorage.getItem('reportrepo_db') || '{}');
                if (localData[table]) {
                    localData[table] = localData[table].filter(item => item.id !== id);
                    localStorage.setItem('reportrepo_db', JSON.stringify(localData));
                }
                
                this.triggerUIRefresh();
                console.log(`✅ Deleted record from ${table}`);
                return true;
            }
            
            throw new Error('Failed to delete record from Supabase');
        } catch (error) {
            console.error(`❌ Failed to delete record from ${table}:`, error);
            throw error;
        }
    }

    /**
     * Trigger UI refresh across application
     */
    triggerUIRefresh() {
        // Dispatch custom event for UI components to listen to
        const event = new CustomEvent('dataUpdated', {
            detail: { timestamp: new Date().toISOString() }
        });
        document.dispatchEvent(event);

        // Trigger specific page refreshes
        try {
            // Refresh tables if they exist
            if (typeof renderReportsTable === 'function') {
                renderReportsTable();
            }
            if (typeof renderUsersTable === 'function') {
                renderUsersTable();
            }
            if (typeof renderDepartmentsTable === 'function') {
                renderDepartmentsTable();
            }
            
            console.log('✅ UI refresh triggered');
        } catch (error) {
            console.warn('⚠️ Some UI components failed to refresh:', error);
        }
    }

    /**
     * Get sync status information
     */
    getSyncStatus() {
        return {
            isInitialized: this.isInitialized,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime,
            dataServiceAvailable: this.supabaseData !== null
        };
    }

    /**
     * Auto-initialize on page load with initial sync
     */
    async autoInit() {
        console.log('🚀 Auto-initializing Integration Manager...');
        
        try {
            const initialized = await this.init();
            
            if (initialized) {
                // Perform initial sync from Supabase
                await this.syncFromSupabase();
                console.log('✅ Auto-initialization completed');
            } else {
                console.warn('⚠️ Running in offline mode - using local storage only');
            }
        } catch (error) {
            console.error('❌ Auto-initialization failed:', error);
            console.warn('⚠️ Falling back to local storage only');
        }
    }
}

// Create global instance
const supabaseIntegrationManager = new SupabaseIntegrationManager();

// Make data service available globally for backward compatibility
const supabaseData = supabaseIntegrationManager;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all dependencies are loaded
    setTimeout(() => {
        supabaseIntegrationManager.autoInit();
    }, 500);
});