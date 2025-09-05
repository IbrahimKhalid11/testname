// Supabase Departments & Users Integration
// Handles synchronization between local storage and Supabase for departments and users

class DepartmentsUsersIntegration {
  constructor() {
    this.supabaseClient = null;
    this.initialized = false;
    this.syncInProgress = false;
    this.lastSyncTime = null;
  }

  /**
   * Initialize the integration
   */
  async init() {
    try {
      if (!this.initialized) {
        // Initialize the Supabase client if not already done
        if (!this.supabaseClient && typeof supabase !== 'undefined') {
          this.supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.ANON_KEY
          );
          console.log('Departments & Users integration initialized');
          
          // Initialize the data service
          await supabaseDataService.init();
          
          // Initialize auth service and ensure admin user exists
          await supabaseAuth.init();
          await supabaseAuth.createAdminSession();
          
          this.initialized = true;
        } else if (!this.supabaseClient) {
          console.error('Supabase client not available');
          throw new Error('Supabase client not available');
        }
      }
      return true;
    } catch (error) {
      console.error('Departments & Users integration initialization error:', error);
      return false;
    }
  }

  /**
   * Test the connection to Supabase
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.init();
      return await supabaseDataService.testConnection();
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }

  /**
   * Synchronize departments and users
   * @param {string} direction - 'toSupabase', 'fromSupabase', or 'bidirectional'
   * @returns {Promise<Object>} Sync results
   */
  async syncDepartmentsAndUsers(direction = 'bidirectional') {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    this.syncInProgress = true;
    console.log(`Starting departments and users sync (${direction})...`);

    try {
      // Sync departments first
      const departmentsResult = await this.syncDepartmentsOnly(direction);
      
      // Then sync users
      const usersResult = await this.syncUsersOnly(direction);
      
      this.lastSyncTime = new Date();
      
      return {
        success: true,
        departments: departmentsResult,
        users: usersResult,
        timestamp: this.lastSyncTime
      };
    } catch (error) {
      console.error('Departments and users sync error:', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Synchronize only departments
   * @param {string} direction - 'toSupabase', 'fromSupabase', or 'bidirectional'
   * @returns {Promise<Object>} Sync results
   */
  async syncDepartmentsOnly(direction = 'bidirectional') {
    try {
      await this.init();
      
      // Get departments from local storage
      const localDepartments = DB.get('departments') || [];
      
      // Get departments from Supabase
      const supabaseDepartments = await supabaseDataService.getAll('departments');
      
      let result = { total: 0, synced: 0 };
      
      if (direction === 'toSupabase' || direction === 'bidirectional') {
        // Update Supabase with local departments
        const departmentsToUpsert = localDepartments.map(dept => ({
          id: dept.id,
          name: dept.name,
          manager: dept.manager,
          reports: dept.reports || 0,
          on_time_rate: dept.onTimeRate || '0%',
          updated_at: new Date().toISOString()
        }));
        
        if (departmentsToUpsert.length > 0) {
          await supabaseDataService.upsert('departments', departmentsToUpsert);
          result.synced += departmentsToUpsert.length;
        }
      }
      
      if (direction === 'fromSupabase' || direction === 'bidirectional') {
        // Update local storage with Supabase departments
        const localUpdates = supabaseDepartments.map(dept => ({
          id: dept.id,
          name: dept.name,
          manager: dept.manager,
          reports: dept.reports || 0,
          onTimeRate: dept.on_time_rate || '0%'
        }));
        
        // Update local DB
        if (localUpdates.length > 0) {
          DB.set('departments', localUpdates);
        }
      }
      
      result.total = Math.max(localDepartments.length, supabaseDepartments.length);
      return result;
    } catch (error) {
      console.error('Departments sync error:', error);
      throw error;
    }
  }

  /**
   * Synchronize only users
   * @param {string} direction - 'toSupabase', 'fromSupabase', or 'bidirectional'
   * @returns {Promise<Object>} Sync results
   */
  async syncUsersOnly(direction = 'bidirectional') {
    try {
      await this.init();
      
      // Get users from local storage
      const localUsers = DB.get('users') || [];
      
      // Get users from Supabase public.users table
      const supabaseUsers = await supabaseDataService.getAll('users');
      
      let result = { total: 0, synced: 0 };
      
      if (direction === 'toSupabase' || direction === 'bidirectional') {
        // For each local user, check if they exist in auth.users (by email)
        for (const localUser of localUsers) {
          const existingUser = supabaseUsers.find(u => u.email === localUser.email);
          
          if (existingUser) {
            // Update existing user
            await supabaseDataService.update('users', existingUser.id, {
              name: localUser.name,
              department: localUser.department,
              departments: localUser.departments || [],
              role: localUser.role,
              permissions: localUser.permissions || {},
              updated_at: new Date().toISOString()
            });
          } else {
            // New user - create in auth (would normally happen through registration)
            // For sync purposes, we're just adding to the users table with a generated ID
            await supabaseDataService.insert('users', {
              id: crypto.randomUUID(), // Generate a UUID for new users
              name: localUser.name,
              email: localUser.email,
              department: localUser.department,
              departments: localUser.departments || [],
              role: localUser.role,
              permissions: localUser.permissions || {},
              last_login: localUser.lastLogin || null
            });
          }
          
          result.synced++;
        }
      }
      
      if (direction === 'fromSupabase' || direction === 'bidirectional') {
        // Update local storage with Supabase users
        const localUpdates = supabaseUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          departments: user.departments || [],
          role: user.role,
          lastLogin: user.last_login,
          permissions: user.permissions || {}
        }));
        
        // Update local DB
        if (localUpdates.length > 0) {
          DB.set('users', localUpdates);
        }
      }
      
      result.total = Math.max(localUsers.length, supabaseUsers.length);
      return result;
    } catch (error) {
      console.error('Users sync error:', error);
      throw error;
    }
  }

  /**
   * Create a new department
   * @param {Object} departmentData - Department data
   * @returns {Promise<Object>} Created department
   */
  async createDepartment(departmentData) {
    try {
      await this.init();
      
      // Create in Supabase
      const newDepartment = await supabaseDataService.insert('departments', {
        name: departmentData.name,
        manager: departmentData.manager,
        reports: 0,
        on_time_rate: '0%'
      });
      
      if (!newDepartment) {
        throw new Error('Failed to create department in Supabase');
      }
      
      // Add to local storage
      const localDepartment = {
        id: newDepartment.id,
        name: newDepartment.name,
        manager: newDepartment.manager,
        reports: 0,
        onTimeRate: '0%'
      };
      
      DB.add('departments', localDepartment);
      
      return localDepartment;
    } catch (error) {
      console.error('Create department error:', error);
      throw error;
    }
  }

  /**
   * Update a department
   * @param {number} id - Department ID
   * @param {Object} updates - Department updates
   * @returns {Promise<Object>} Updated department
   */
  async updateDepartment(id, updates) {
    try {
      await this.init();
      
      // Update in Supabase
      const supabaseUpdates = {
        ...updates
      };
      
      // Convert onTimeRate to on_time_rate for Supabase
      if (updates.onTimeRate !== undefined) {
        supabaseUpdates.on_time_rate = updates.onTimeRate;
        delete supabaseUpdates.onTimeRate;
      }
      
      const updatedDepartment = await supabaseDataService.update('departments', id, supabaseUpdates);
      
      if (!updatedDepartment) {
        throw new Error('Failed to update department in Supabase');
      }
      
      // Update in local storage
      const localUpdates = {
        ...updates,
        onTimeRate: updatedDepartment.on_time_rate
      };
      
      const localDepartment = DB.update('departments', id, localUpdates);
      
      return localDepartment;
    } catch (error) {
      console.error('Update department error:', error);
      throw error;
    }
  }

  /**
   * Delete a department
   * @param {number} id - Department ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteDepartment(id) {
    try {
      await this.init();
      
      // Delete from Supabase
      const success = await supabaseDataService.delete('departments', id);
      
      if (!success) {
        throw new Error('Failed to delete department from Supabase');
      }
      
      // Delete from local storage
      DB.delete('departments', id);
      
      return true;
    } catch (error) {
      console.error('Delete department error:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      await this.init();
      
      // Register user through auth service
      const newUser = await supabaseAuth.register(
        userData.email,
        userData.password || 'defaultpassword123', // A default password, user should change it
        userData.name,
        userData.department,
        userData.role
      );
      
      if (!newUser) {
        throw new Error('Failed to create user');
      }
      
      // Add additional data
      const userPermissions = userData.permissions || {
        canView: ['department'],
        canAdd: ['department'],
        canEdit: ['own'],
        canDelete: ['none']
      };
      
      // Update user with additional data
      await supabaseDataService.update('users', newUser.id, {
        departments: userData.departments || [userData.department],
        permissions: userPermissions
      });
      
      // Add to local storage
      const localUser = {
        id: newUser.id,
        name: userData.name,
        email: userData.email,
        department: userData.department,
        departments: userData.departments || [userData.department],
        role: userData.role,
        lastLogin: new Date().toISOString(),
        permissions: userPermissions
      };
      
      DB.add('users', localUser);
      
      return localUser;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   * @returns {Object} Sync status
   */
  getSyncStatus() {
    return {
      initialized: this.initialized,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime
    };
  }
}

// Create instance of the integration
const departmentsUsersIntegration = new DepartmentsUsersIntegration();