// Single Supabase Authentication Manager
// This is the only auth manager - no more dual authentication

class AuthManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the authentication manager (delegates to Supabase)
   */
  async init() {
    try {
      if (!this.initialized) {
        console.log('Initializing Auth Manager...');
        
        // Initialize Supabase auth if available
        if (typeof supabaseAuth !== 'undefined') {
          await supabaseAuth.init();
          console.log('Supabase auth initialized');
          this.initialized = true;
        } else {
          throw new Error('Supabase auth service not available');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Auth Manager initialization error:', error);
      return false;
    }
  }

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Promise with the login result
   */
  async login(email, password) {
    await this.init();
    return await supabaseAuth.login(email, password);
  }

  /**
   * Logout the current user
   * @returns {Promise} - Promise with the logout result
   */
  async logout() {
    await this.init();
    return await supabaseAuth.logout();
  }

  /**
   * Check if a user is currently logged in
   * @returns {boolean} - True if logged in, false otherwise
   */
  isLoggedIn() {
    if (typeof supabaseAuth !== 'undefined') {
      return supabaseAuth.isLoggedIn();
    }
    return false;
  }

  /**
   * Get the current user data
   * @returns {Object|null} - User data or null if not logged in
   */
  getUserData() {
    if (typeof supabaseAuth !== 'undefined') {
      return supabaseAuth.getUserData();
    }
    return null;
  }

  /**
   * Get the current user session
   * @returns {Promise} - Promise with the user session
   */
  async getSession() {
    await this.init();
    return await supabaseAuth.getSession();
  }

  /**
   * Get the current user from Supabase auth
   * @returns {Promise} - Promise with the user data
   */
  async getUser() {
    await this.init();
    return await supabaseAuth.getUser();
  }

  /**
   * Update user profile in public.users table
   * @param {Object} userData - User data to update
   * @returns {Promise<boolean>} - Success status
   */
  async updateUserProfile(userData) {
    await this.init();
    return await supabaseAuth.updateUserProfile(userData);
  }
}

// Create an instance of the Authentication Manager
const authManager = new AuthManager();

// Auto-initialize when loaded
(async function() {
  try {
    await authManager.init();
    console.log('Auth Manager initialized');
  } catch (error) {
    console.error('Failed to initialize Auth Manager:', error);
  }
})();