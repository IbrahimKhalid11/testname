// Supabase configuration
const SUPABASE_CONFIG = {
  URL: 'https://pvfmdczitmjtvbgewurc.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Zm1kY3ppdG1qdHZiZ2V3dXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjIzNDcsImV4cCI6MjA2NzczODM0N30.o6xchlNcS-EwPO6ldPRIRtelk45WRBEbmJdTLrlf1W4',
  SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Zm1kY3ppdG1qdHZiZ2V3dXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE2MjM0NywiZXhwIjoyMDY3NzM4MzQ3fQ.Dz_Pojsx7mtdaK6LTvTmg9h494a1UC-FXnpK1KK5lio',
  STORAGE_BUCKET: 'reports-files',
  PROJECT_ID: 'pvfmdczitmjtvbgewurc'
};

// Global client instances
let GLOBAL_SUPABASE_CLIENT = null;
let GLOBAL_SUPABASE_ADMIN_CLIENT = null;

// Initialize with anon key for regular operations
function getSupabaseClient() {
  if (!GLOBAL_SUPABASE_CLIENT) {
    console.log('Initializing Supabase client with anon key');
    
    // Check if supabase is available
    if (typeof supabase === 'undefined') {
      console.error('Supabase library not loaded');
      return null;
    }
    
    GLOBAL_SUPABASE_CLIENT = supabase.createClient(
      SUPABASE_CONFIG.URL, 
      SUPABASE_CONFIG.ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      }
    );
  }
  return GLOBAL_SUPABASE_CLIENT;
}

// Initialize with service role key for admin operations (bypasses RLS)
function getSupabaseAdminClient() {
  if (!GLOBAL_SUPABASE_ADMIN_CLIENT) {
    console.log('Initializing Supabase admin client with service role key');
    console.log('Service role key available:', !!SUPABASE_CONFIG.SERVICE_KEY);
    console.log('Service role key length:', SUPABASE_CONFIG.SERVICE_KEY ? SUPABASE_CONFIG.SERVICE_KEY.length : 0);
    console.log('Service role key starts with:', SUPABASE_CONFIG.SERVICE_KEY ? SUPABASE_CONFIG.SERVICE_KEY.substring(0, 20) + '...' : 'N/A');
    
    // Check if supabase is available
    if (typeof supabase === 'undefined') {
      console.error('Supabase library not loaded');
      return null;
    }
    
    // Check if service role key is available
    if (!SUPABASE_CONFIG.SERVICE_KEY) {
      console.error('Service role key not available');
      return null;
    }
    
    GLOBAL_SUPABASE_ADMIN_CLIENT = supabase.createClient(
      SUPABASE_CONFIG.URL, 
      SUPABASE_CONFIG.SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('Admin client created successfully');
  }
  
  return GLOBAL_SUPABASE_ADMIN_CLIENT;
}

// Export functions for use in other modules
window.getSupabaseClient = getSupabaseClient;
window.getSupabaseAdminClient = getSupabaseAdminClient; 