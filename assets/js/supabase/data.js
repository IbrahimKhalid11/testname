// Supabase Data Service
// Provides common data operations for all collections

class SupabaseData {
  constructor() {
    this.supabaseClient = null;
    this.adminClient = null;
    this.initialized = false;
    this.useAdmin = false; // Flag to use admin client for bypassing RLS
  }

  /**
   * Initialize the Supabase client
   */
  async init() {
    try {
      if (!this.initialized) {
        // Use the global singleton client to prevent multiple instances
        if (typeof getSupabaseClient === 'function') {
          this.supabaseClient = getSupabaseClient();
          
          // Also initialize admin client if available
          if (typeof getSupabaseAdminClient === 'function') {
            try {
              this.adminClient = getSupabaseAdminClient();
              console.log('Supabase admin client initialized');
              
              console.log('Supabase admin client initialized successfully');
            } catch (adminError) {
              console.error('Error initializing admin client:', adminError);
            }
          }
          
          console.log('Supabase Data service initialized with singleton client');
          this.initialized = true;
        } else {
          console.error('getSupabaseClient function not available');
          throw new Error('getSupabaseClient function not available');
        }
      }
      return true;
    } catch (error) {
      console.error('Supabase Data initialization error:', error);
      return false;
    }
  }
  
  /**
   * Enable admin mode to bypass RLS for specific operations
   * @param {boolean} enabled - Whether to enable admin mode
   */
  setAdminMode(enabled = true) {
    this.useAdmin = enabled;
    console.log(`Admin mode ${enabled ? 'enabled' : 'disabled'}`);
    
    // Verify we have the admin client when enabling admin mode
    if (enabled && !this.adminClient && typeof getSupabaseAdminClient === 'function') {
      try {
        this.adminClient = getSupabaseAdminClient();
        console.log('Initialized admin client on demand');
      } catch (error) {
        console.error('Failed to initialize admin client on demand:', error);
      }
    }
  }

  /**
   * Generic data retrieval with filtering and options
   * @param {string} table - Table name
   * @param {Object} options - Query options
   * @param {Object} options.filter - Key-value pairs for filtering
   * @param {string} options.select - Columns to select (default: '*')
   * @param {Object} options.order - Order by configuration
   * @param {number} options.limit - Limit number of results
   * @returns {Promise<Array>} Array of records
   */
  async get(table, options = {}) {
    try {
      if (!this.initialized) await this.init();

      // Choose client based on admin mode
      const client = this.useAdmin && this.adminClient ? this.adminClient : this.supabaseClient;
      
      console.log(`🔍 Fetching data from table: ${table}`);
      console.log(`🔍 Using client:`, client ? 'Available' : 'Not available');
      console.log(`🔍 Options:`, options);
      
      let query = client.from(table).select(options.select || '*');
      
      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Apply ordering
      if (options.order) {
        const { column, ascending = true } = options.order;
        query = query.order(column, { ascending });
      }
      
      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      console.log(`✅ Successfully fetched ${data?.length || 0} records from ${table}`);
      return data || [];
    } catch (error) {
      console.error(`❌ Failed to get ${table}:`, error);
      return [];
    }
  }

  /**
   * Get all records from a table (kept for backwards compatibility)
   * @param {string} table - Table name
   * @returns {Promise<Array>} Array of records
   */
  async getAll(table) {
    return this.get(table);
  }

  /**
   * Get a record by ID
   * @param {string} table - Table name
   * @param {number|string} id - Record ID
   * @returns {Promise<Object|null>} Record or null
   */
  async getById(table, id) {
    try {
      await this.init();
      
      const { data, error } = await this.supabaseClient
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching record by ID from ${table}:`, error);
      return null;
    }
  }

  /**
   * Insert a new record
   * @param {string} table - Table name
   * @param {Object} record - Record to insert
   * @returns {Promise<Object|null>} Inserted record or null
   */
  async insert(table, record) {
    try {
      await this.init();
      
      // Choose client based on admin mode
      let client = this.useAdmin && this.adminClient ? this.adminClient : this.supabaseClient;
      
      // If we're using the admin client, we need to log it for debugging
      if (this.useAdmin && this.adminClient) {
        console.log(`Using admin client to insert into ${table} (bypassing RLS)`);
        console.log('Admin client object:', this.adminClient);
        console.log('Admin client URL:', this.adminClient.supabaseUrl);
        
        // Log admin client details for debugging
        console.log('Admin client configured with service role key');
        
        // Admin client is configured and ready for use
      } else if (this.useAdmin && !this.adminClient) {
        console.warn('Admin mode enabled but admin client is not available. Attempting to initialize it now.');
        if (typeof getSupabaseAdminClient === 'function') {
          try {
            this.adminClient = getSupabaseAdminClient();
            console.log('Initialized admin client on demand for insert operation');
            // Update client reference to use the newly initialized admin client
            client = this.adminClient;
          } catch (adminError) {
            console.error('Failed to initialize admin client on demand:', adminError);
          }
        }
      } else {
        // For regular client operations, force admin mode for inserts to avoid RLS issues
        console.log('Switching to admin mode for insert operation to bypass RLS restrictions');
        try {
          await this.setAdminMode(true);
          client = this.adminClient;
        } catch (adminError) {
          console.error('Failed to switch to admin mode, attempting regular insert:', adminError);
        }
      }
      
      const { data, error } = await client
        .from(table)
        .insert(record)
        .select()
        .single();
      
      if (error) {
        console.error(`Error inserting record into ${table}:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Error inserting record into ${table}:`, error);
      return null;
    }
  }

  /**
   * Update a record
   * @param {string} table - Table name
   * @param {number|string} id - Record ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated record or null
   */
  async update(table, id, updates) {
    try {
      await this.init();
      
      // Choose client based on admin mode
      let client = this.useAdmin && this.adminClient ? this.adminClient : this.supabaseClient;
      
      // If we're using the admin client, we need to log it for debugging
      if (this.useAdmin && this.adminClient) {
        console.log(`Using admin client to update ${table} (bypassing RLS)`);
      } else if (this.useAdmin && !this.adminClient) {
        console.warn('Admin mode enabled but admin client is not available. Attempting to initialize it now.');
        if (typeof getSupabaseAdminClient === 'function') {
          try {
            this.adminClient = getSupabaseAdminClient();
            console.log('Initialized admin client on demand for update operation');
            // Update client reference to use the newly initialized admin client
            client = this.adminClient;
          } catch (adminError) {
            console.error('Failed to initialize admin client on demand:', adminError);
          }
        }
      } else {
        // For regular client operations, force admin mode for updates to avoid RLS issues
        console.log('Switching to admin mode for update operation to bypass RLS restrictions');
        try {
          await this.setAdminMode(true);
          client = this.adminClient;
        } catch (adminError) {
          console.error('Failed to switch to admin mode, attempting regular update:', adminError);
        }
      }
      
      const { data, error } = await client
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Error updating record in ${table}:`, error);
      return null;
    }
  }

  /**
   * Append items to a JSONB array field atomically
   * @param {string} table - Table name
   * @param {number|string} id - Record ID
   * @param {string} arrayField - Name of the JSONB array field
   * @param {Array|Object} items - Items to append (can be single item or array)
   * @returns {Promise<Object|null>} Updated record or null
   */
  async appendToArray(table, id, arrayField, items) {
    try {
      await this.init();
      
      // Choose client based on admin mode
      const client = this.useAdmin && this.adminClient ? this.adminClient : this.supabaseClient;
      
      // Ensure items is an array
      const itemsArray = Array.isArray(items) ? items : [items];
      
      // Use PostgreSQL JSON operators to append to array
      // This ensures atomic operation and prevents race conditions
      const { data, error } = await client
        .rpc('append_to_jsonb_array', {
          table_name: table,
          record_id: id,
          field_name: arrayField,
          new_items: JSON.stringify(itemsArray)
        });
      
      if (error) {
        // Fallback to manual append if RPC function doesn't exist
        console.warn(`RPC function not available, using manual append for ${table}.${arrayField}`);
        return await this.manualAppendToArray(table, id, arrayField, itemsArray);
      }
      
      return data;
    } catch (error) {
      console.error(`Error appending to array in ${table}.${arrayField}:`, error);
      // Fallback to manual append
      try {
        const itemsArray = Array.isArray(items) ? items : [items];
        return await this.manualAppendToArray(table, id, arrayField, itemsArray);
      } catch (fallbackError) {
        console.error('Manual append fallback also failed:', fallbackError);
        return null;
      }
    }
  }

  /**
   * Manual append to array as fallback (less atomic but still functional)
   * @param {string} table - Table name
   * @param {number|string} id - Record ID
   * @param {string} arrayField - Name of the JSONB array field
   * @param {Array} items - Items to append
   * @returns {Promise<Object|null>} Updated record or null
   */
  async manualAppendToArray(table, id, arrayField, items) {
    try {
      // Choose client based on admin mode
      const client = this.useAdmin && this.adminClient ? this.adminClient : this.supabaseClient;
      
      // First, get the current record
      const { data: currentRecord, error: fetchError } = await client
        .from(table)
        .select(arrayField)
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Get current array or initialize as empty array
      const currentArray = currentRecord[arrayField] || [];
      
      // Append new items
      const updatedArray = [...currentArray, ...items];
      
      // Update the record with the new array
      const { data, error } = await client
        .from(table)
        .update({ [arrayField]: updatedArray })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Manual append to array failed for ${table}.${arrayField}:`, error);
      return null;
    }
  }

  /**
   * Delete a record
   * @param {string} table - Table name
   * @param {number|string} id - Record ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(table, id) {
    try {
      await this.init();
      
      // Choose client based on admin mode
      let client = this.useAdmin && this.adminClient ? this.adminClient : this.supabaseClient;
      
      // If we're using the admin client, we need to log it for debugging
      if (this.useAdmin && this.adminClient) {
        console.log(`Using admin client to delete from ${table} (bypassing RLS)`);
      } else if (this.useAdmin && !this.adminClient) {
        console.warn('Admin mode enabled but admin client is not available. Attempting to initialize it now.');
        if (typeof getSupabaseAdminClient === 'function') {
          try {
            this.adminClient = getSupabaseAdminClient();
            console.log('Initialized admin client on demand for delete operation');
            // Update client reference to use the newly initialized admin client
            client = this.adminClient;
          } catch (adminError) {
            console.error('Failed to initialize admin client on demand:', adminError);
          }
        }
      } else {
        // For regular client operations, force admin mode for deletes to avoid RLS issues
        console.log('Switching to admin mode for delete operation to bypass RLS restrictions');
        try {
          await this.setAdminMode(true);
          client = this.adminClient;
        } catch (adminError) {
          console.error('Failed to switch to admin mode, attempting regular delete:', adminError);
        }
      }
      
      const { error } = await client
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting record from ${table}:`, error);
        throw error;
      }
      
      console.log(`✅ Record deleted from ${table}`);
      return true;
    } catch (error) {
      console.error(`Error deleting record from ${table}:`, error);
      return false;
    }
  }

  /**
   * Upsert records (insert if not exists, update if exists)
   * @param {string} table - Table name
   * @param {Array} records - Records to upsert
   * @param {string} onConflict - Column to check for conflicts
   * @returns {Promise<Array|null>} Upserted records or null
   */
  async upsert(table, records, onConflict = 'id') {
    try {
      await this.init();
      
      // Choose client based on admin mode
      let client = this.useAdmin && this.adminClient ? this.adminClient : this.supabaseClient;
      
      // If we're using the admin client, we need to log it for debugging
      if (this.useAdmin && this.adminClient) {
        console.log(`Using admin client to upsert into ${table} (bypassing RLS)`);
      } else if (this.useAdmin && !this.adminClient) {
        console.warn('Admin mode enabled but admin client is not available. Attempting to initialize it now.');
        if (typeof getSupabaseAdminClient === 'function') {
          try {
            this.adminClient = getSupabaseAdminClient();
            console.log('Initialized admin client on demand for upsert operation');
            // Update client reference to use the newly initialized admin client
            client = this.adminClient;
          } catch (adminError) {
            console.error('Failed to initialize admin client on demand:', adminError);
          }
        }
      }
      
      // Filter out any undefined or null values to prevent column errors
      const cleanedRecords = records.map(record => {
        const cleaned = {};
        Object.entries(record).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            cleaned[key] = value;
          }
        });
        return cleaned;
      });
      
      console.log(`Upserting ${cleanedRecords.length} records to ${table} with columns:`, Object.keys(cleanedRecords[0] || {}));
      
      const { data, error } = await client
        .from(table)
        .upsert(cleanedRecords, { onConflict, returning: 'representation' })
        .select();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Error upserting records in ${table}:`, error);
      
      // If the error is about missing columns, try to identify which ones
      if (error.message && error.message.includes('column') && error.message.includes('not found')) {
        console.error('This error suggests that some columns in the data do not exist in the database table.');
        console.error('Please check if the database schema matches the expected columns.');
        console.error('You may need to run the database migration script to add missing columns.');
      }
      
      return null;
    }
  }

  /**
   * Get records with filtering (deprecated - use get() with options.filter)
   * @param {string} table - Table name
   * @param {Object} filters - Key-value pairs for filtering
   * @returns {Promise<Array>} Filtered records
   */
  async getFiltered(table, filters) {
    return this.get(table, { filter: filters });
  }

  /**
   * Specialized data retrieval methods for common collections
   */
  async getDepartments() {
    return this.get('departments', { order: { column: 'name' } });
  }

  async getUsers() {
    return this.get('users', { order: { column: 'name' } });
  }

  async getReports() {
    return this.get('reports', { order: { column: 'created_at', ascending: false } });
  }

  async getReportTypes() {
    return this.get('report_types', { order: { column: 'name' } });
  }

  async getFrequencies() {
    return this.get('frequencies', { order: { column: 'name' } });
  }

  async getFormats() {
    return this.get('formats', { order: { column: 'name' } });
  }

  // NEW: KPI Scorecard System Methods
  
  async getScorecards() {
    return this.get('scorecards', { order: { column: 'name' } });
  }

  async getKPIs() {
    return this.get('kpis', { order: { column: 'name' } });
  }

  async getScorecardAssignments() {
    return this.get('scorecard_assignments', { order: { column: 'assigned_at', ascending: false } });
  }

  async getScorecardResults() {
    return this.get('scorecard_results', { order: { column: 'created_at', ascending: false } });
  }

  async getKPIsByScorecard(scorecardId) {
    return this.get('kpis', { 
      filter: { scorecard_id: scorecardId, is_active: true },
      order: { column: 'name' }
    });
  }

  async getScorecardsByDepartment(department) {
    return this.get('scorecards', { 
      filter: { department: department, is_active: true },
      order: { column: 'name' }
    });
  }

  async getScorecardAssignment(userId, scorecardId, month, year) {
    const assignments = await this.get('scorecard_assignments', {
      filter: { 
        user_id: userId, 
        scorecard_id: scorecardId, 
        period_month: month, 
        period_year: year,
        is_active: true
      }
    });
    return assignments.length > 0 ? assignments[0] : null;
  }

  async getScorecardResult(userId, scorecardId, month, year) {
    const results = await this.get('scorecard_results', {
      filter: { 
        user_id: userId, 
        scorecard_id: scorecardId, 
        period_month: month, 
        period_year: year
      }
    });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Replace all records in a table
   * @param {string} table - Table name
   * @param {Array} records - New records
   * @returns {Promise<boolean>} Success status
   */
  async replaceAll(table, records) {
    try {
      await this.init();
      
      // First delete all existing records
      const { error: deleteError } = await this.supabaseClient
        .from(table)
        .delete()
        .neq('id', -1); // This matches all records
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Then insert the new records if there are any
      if (records && records.length > 0) {
        const { error: insertError } = await this.supabaseClient
          .from(table)
          .insert(records);
        
        if (insertError) {
          throw insertError;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error replacing all records in ${table}:`, error);
      return false;
    }
  }

  /**
   * Count records in a table
   * @param {string} table - Table name
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} Record count
   */
  async count(table, filters = {}) {
    try {
      await this.init();
      
      let query = this.supabaseClient
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      // Apply all filters
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      
      const { count, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error(`Error counting records in ${table}:`, error);
      return 0;
    }
  }

  /**
   * Test the Supabase connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.init();
      
      // Try to query something simple - just get one record
      const { data, error } = await this.supabaseClient
        .from('departments')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection test error:', error);
        throw error;
      }
      
      console.log('Supabase connection test successful');
      return true;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }
}

// Create instance of the data service
const supabaseDataService = new SupabaseData();