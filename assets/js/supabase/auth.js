// Supabase Authentication Service
// Works with Supabase auth.users and public.users tables

class SupabaseAuth {
  constructor() {
    this.userTokenKey = 'user_token';
    this.userIdKey = 'user_id';
    this.userDataKey = 'user_data';
    this.supabaseClient = null;
    this.initialized = false;
    this.adminEmail = 'supa4@iravin.com';
    this.adminPassword = 'Admin123!';
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
          console.log('Supabase Auth service initialized');
          this.initialized = true;
        } else {
          console.error('getSupabaseClient function not available');
          throw new Error('getSupabaseClient function not available');
        }
      }
      return true;
    } catch (error) {
      console.error('Supabase initialization error:', error);
      throw error;
    }
  }

  /**
   * Login a user with Supabase using existing email/password from auth.users
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Promise with the login result
   */
  async login(email, password) {
    try {
      await this.init();
      
      console.log(`Attempting login for ${email}...`);
      
      const { data, error } = await this.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      if (!data || !data.user) {
        console.error('Supabase auth returned no user data');
        throw new Error('Authentication returned no user data');
      }

      console.log('Successfully authenticated with Supabase');

      // Get user profile from the public.users table
      let profileData = null;
      try {
        const { data: profile, error: profileError } = await this.supabaseClient
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.warn('Could not fetch user profile from public.users:', profileError);
          // Try to find user by email if ID lookup fails
          const { data: profileByEmail, error: emailError } = await this.supabaseClient
            .from('users')
            .select('*')
            .eq('email', data.user.email)
            .single();
          
          if (!emailError && profileByEmail) {
            profileData = profileByEmail;
            console.log('User profile found by email in public.users');
          }
        } else {
          profileData = profile;
          console.log('User profile found by ID in public.users');
        }
      } catch (profileError) {
        console.warn('Error fetching user profile:', profileError);
      }

      // Create a merged user object using auth data and profile data
      const userData = {
        id: data.user.id,
        email: data.user.email,
        // Use profile data if available, otherwise use defaults or auth metadata
        name: profileData?.name || data.user.user_metadata?.name || data.user.email.split('@')[0],
        role: profileData?.role || data.user.user_metadata?.role || 'User',
        department: profileData?.department || data.user.user_metadata?.department || 'General',
        permissions: profileData?.permissions || {
          canView: ['all'],
          canAdd: ['all'],
          canEdit: ['all'],
          canDelete: ['all']
        },
        // Include all other profile data if available
        ...(profileData || {}),
        // Store auth-specific data
        auth_id: data.user.id,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      };

      console.log('Processed user data:', userData);

      // Store user data in localStorage
      localStorage.setItem(this.userTokenKey, data.session.access_token);
      localStorage.setItem(this.userIdKey, data.user.id);
      localStorage.setItem(this.userDataKey, JSON.stringify(userData));

      // Try to update last login time in public.users if the record exists
      try {
        if (profileData) {
          const { error: updateError } = await this.supabaseClient
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', profileData.id);
  
          if (updateError) {
            console.warn('Failed to update last login time:', updateError);
          }
        }
      } catch (err) {
        console.warn('Could not update last login time:', err);
      }

      // Update the global DB current user if that function exists
      if (typeof DB !== 'undefined' && typeof DB.setCurrentUser === 'function') {
        DB.setCurrentUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          permissions: userData.permissions
        });
      }

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout the current user
   * @returns {Promise} - Promise with the logout result
   */
  async logout() {
    try {
      await this.init();
      
      const { error } = await this.supabaseClient.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear user data from localStorage
      localStorage.removeItem(this.userTokenKey);
      localStorage.removeItem(this.userIdKey);
      localStorage.removeItem(this.userDataKey);

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get the current user session from Supabase
   * @returns {Promise} - Promise with the user session
   */
  async getSession() {
    try {
      await this.init();
      
      const { data, error } = await this.supabaseClient.auth.getSession();
      
      if (error) {
        throw error;
      }

      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get the current auth user from Supabase
   * @returns {Promise} - Promise with the user data
   */
  async getUser() {
    try {
      await this.init();
      
      const { data, error } = await this.supabaseClient.auth.getUser();
      
      if (error) {
        throw error;
      }

      return data.user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Get the current user data from localStorage
   * @returns {Object|null} - User data or null if not logged in
   */
  getUserData() {
    const userData = localStorage.getItem(this.userDataKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if a user is currently logged in
   * @returns {boolean} - True if logged in, false otherwise
   */
  isLoggedIn() {
    const token = localStorage.getItem(this.userTokenKey);
    const userData = localStorage.getItem(this.userDataKey);
    
    // Check if we have both token and user data
    if (!token || !userData) {
      return false;
    }
    
    // Check for token expiration if set
    const expiration = localStorage.getItem('token_expiration');
    
    // Additional check with Supabase session if available
    if (this.supabaseClient && typeof this.supabaseClient.auth.getSession === 'function') {
      this.supabaseClient.auth.getSession().then(({ data, error }) => {
        if (error || !data.session) {
          console.warn('Token exists but no active session found');
          return false;
        }
      }).catch(() => {
        // Silently handle errors
        return false;
      });
    }
    if (expiration && new Date().getTime() > parseInt(expiration)) {
      // Token expired, clear session
      this.logout();
      return false;
    }
    
    return true;
  }

  /**
   * Create or update user profile in public.users table
   * @param {Object} userData - User data to store in public.users
   * @returns {Promise<boolean>} - Success status
   */
  async updateUserProfile(userData) {
    try {
      await this.init();
      
      const { error } = await this.supabaseClient
        .from('users')
        .upsert({
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          role: userData.role || 'User',
          department: userData.department || 'General',
          permissions: userData.permissions || {
            canView: ['all'],
            canAdd: ['all'],
            canEdit: ['all'],
            canDelete: ['all']
          },
          last_login: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }

      console.log('User profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  /**
   * Sign in with admin credentials for database operations
   * This is used to bypass RLS policies for admin operations
   */
  async signInAdmin() {
  try {
    await this.init();
    
    console.log('Signing in with admin credentials for database operations...');
    
    // Sign out any existing session first
    await this.supabaseClient.auth.signOut();
    
    // Sign in with admin credentials
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email: this.adminEmail,
      password: this.adminPassword
    });
    
    if (error) {
      console.error('Admin authentication failed:', error);
      return false;
    }
    
    console.log('Admin authentication successful:', data.user.email);
    return true;
  } catch (error) {
    console.error('Admin authentication error:', error);
    return false;
  }
  }

  /**
   * Reset a user's password using admin privileges
   * @param {string} email - User's email
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  async resetUserPassword(email, newPassword) {
    try {
      await this.init();
      
      // Get admin client for password reset
      const adminClient = getSupabaseAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }
      
      console.log(`Resetting password for user: ${email}`);
      
      // Update user password using admin client
      const { data, error } = await adminClient.auth.admin.updateUserById(
        email, // This should be the user ID, but we'll need to find it first
        { password: newPassword }
      );
      
      if (error) {
        console.error('Password reset error:', error);
        return false;
      }
      
      console.log('Password reset successfully');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  }

  /**
   * Generate a secure random password
   * @returns {string} - Generated password
   */
  generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

// Create an instance of the SupabaseAuth service
const supabaseAuth = new SupabaseAuth();