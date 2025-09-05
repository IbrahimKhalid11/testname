/**
 * Supabase Client Manager - Singleton Pattern
 * Prevents multiple GoTrueClient instances and manages client lifecycle
 */

class SupabaseClientManager {
    constructor() {
        this.clients = new Map();
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * Initialize the client manager
     */
    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                console.log('🔧 Initializing Supabase Client Manager...');
                
                // Check if Supabase library is loaded
                if (typeof supabase === 'undefined') {
                    throw new Error('Supabase library not loaded');
                }

                // Create main client with proper auth configuration
                const mainClient = supabase.createClient(
                    'https://pvfmdczitmjtvbgewurc.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Zm1kY3ppdG1qdHZiZ2V3dXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjIzNDcsImV4cCI6MjA2NzczODM0N30.o6xchlNcS-EwPO6ldPRIRtelk45WRBEbmJdTLrlf1W4',
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            storageKey: 'supabase-auth', // Ensure consistent storage key
                            detectSessionInUrl: false
                        }
                    }
                );
                
                console.log('📊 Main client created, type:', typeof mainClient);
                console.log('📊 Main client has auth:', !!mainClient?.auth);
                console.log('📊 Main client auth methods:', Object.keys(mainClient?.auth || {}));

                // Create admin client with minimal auth configuration
                const adminClient = supabase.createClient(
                    'https://pvfmdczitmjtvbgewurc.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Zm1kY3ppdG1qdHZiZ2V3dXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE2MjM0NywiZXhwIjoyMDY3NzM4MzQ3fQ.Dz_Pojsx7mtdaK6LTvTmg9h494a1UC-FXnpK1KK5lio',
                    {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false,
                            detectSessionInUrl: false
                        }
                    }
                );

                // Validate clients
                if (!mainClient || !mainClient.auth) {
                    throw new Error('Main client not created properly');
                }
                
                if (!adminClient) {
                    throw new Error('Admin client not created properly');
                }
                
                // Store clients
                this.clients.set('main', mainClient);
                this.clients.set('admin', adminClient);
                
                // Verify storage
                const storedMain = this.clients.get('main');
                console.log('📊 Stored main client type:', typeof storedMain);
                console.log('📊 Stored main client has auth:', !!storedMain?.auth);
                
                this.initialized = true;
                console.log('✅ Supabase Client Manager initialized successfully');
                console.log('📊 Main client auth available:', !!mainClient.auth);
                console.log('📊 Admin client available:', !!adminClient);
                
                resolve(true);
            } catch (error) {
                console.error('❌ Supabase Client Manager initialization failed:', error);
                reject(error);
            }
        });

        return this.initPromise;
    }

    /**
     * Get the main client
     */
    async getClient() {
        if (!this.initialized) {
            console.log('🔄 Client Manager not initialized, initializing now...');
            await this.init();
        }
        const client = this.clients.get('main');
        console.log('📊 getClient() returning:', typeof client);
        console.log('📊 getClient() has auth:', !!client?.auth);
        console.log('📊 getClient() client keys:', Object.keys(client || {}));
        console.log('📊 getClient() client === storedMain:', client === this.clients.get('main'));
        return client;
    }

    /**
     * Get the admin client
     */
    async getAdminClient() {
        if (!this.initialized) {
            console.log('🔄 Client Manager not initialized, initializing now...');
            await this.init();
        }
        return this.clients.get('admin');
    }

    /**
     * Check if manager is initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get client status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            mainClient: !!this.clients.get('main'),
            adminClient: !!this.clients.get('admin'),
            clientCount: this.clients.size
        };
    }

    /**
     * Clear all clients (for testing)
     */
    clear() {
        this.clients.clear();
        this.initialized = false;
        this.initPromise = null;
        console.log('🔧 Supabase Client Manager cleared');
    }
}

// Create global singleton instance
const supabaseClientManager = new SupabaseClientManager();

// Export for use in other modules
window.SupabaseClientManager = SupabaseClientManager;
window.supabaseClientManager = supabaseClientManager;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Supabase library is loaded
    setTimeout(() => {
        supabaseClientManager.init().catch(error => {
            console.error('❌ Auto-initialization of Supabase Client Manager failed:', error);
        });
    }, 100);
});

console.log('🔧 Supabase Client Manager loaded'); 