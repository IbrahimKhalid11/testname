// Authentication Integration Manager
// This service coordinates authentication between multiple backends

class AuthIntegrationManager {
  constructor() {
    this.currentAuthProvider = null;
    this.authProviders = {
      backendless: null,
      supabase: null
    };
    
    this.initialized = false;
    this.userTokenKey = 'auth_user_token';
    this.userIdKey = 'auth_user_id';
    this.userDataKey = 'auth_user_data';
    this.authProviderKey = 'auth_provider';
  }

  /**
   * Initialize the authentication manager
   */
  async init() {
    try {
      if (!this.initialized) {
        console.log('Initializing Authentication Integration Manager...');
        
        // Initialize Backendless auth if available
        if (typeof backendlessAuth !== 'undefined') {
          this.authProviders.backendless = backendlessAuth;
          console.log('Backendless auth provider registered');
        }
        
        // Initialize Supabase auth if available
        if (typeof supabaseAuth !== 'undefined') {
          this.authProviders.supabase = supabaseAuth;
          await supabaseAuth.init();
          console.log('Supabase auth provider registered');
        }
        
        // Determine the current auth provider based on stored preference
        const storedProvider = localStorage.getItem(this.authProviderKey);
        if (storedProvider && this.authProviders[storedProvider]) {
          this.currentAuthProvider = this.authProviders[storedProvider];
          console.log(`Using stored auth provider: ${storedProvider}`);
        } else {
          // Default to Supabase if available, otherwise Backendless
          this.currentAuthProvider = this.authProviders.supabase || this.authProviders.backendless;
          const providerName = this.currentAuthProvider === this.authProviders.supabase ? 'supabase' : 'backendless';
          localStorage.setItem(this.authProviderKey, providerName);
          console.log(`Defaulting to auth provider: ${providerName}`);
        }
        
        this.initialized = true;
      }
      
      return true;
    } catch (error) {
      console.error('Auth Integration Manager initialization error:', error);
      return false;
    }
  }

  /**
   * Set the current authentication provider
   * @param {string} providerName - The name of the provider ('backendless' or 'supabase')
   */
  setAuthProvider(providerName) {
    if (!this.authProviders[providerName]) {
      throw new Error(`Auth provider ${providerName} is not available`);
    }
    
    this.currentAuthProvider = this.authProviders[providerName];
    localStorage.setItem(this.authProviderKey, providerName);
    console.log(`Auth provider set to: ${providerName}`);
  }

  /**
   * Get the current authentication provider name
   * @returns {string} - The name of the current provider ('backendless' or 'supabase')
   */
  getAuthProviderName() {
    if (this.currentAuthProvider === this.authProviders.backendless) {
      return 'backendless';
    } else if (this.currentAuthProvider === this.authProviders.supabase) {
      return 'supabase';
    } else {
      return 'none';
    }
  }

  /**
   * Login a user with the current authentication provider
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Promise with the login result
   */
  async login(email, password) {
    await this.init();
    
    if (!this.currentAuthProvider) {
      throw new Error('No authentication provider available');
    }
    
    const userData = await this.currentAuthProvider.login(email, password);
    
    // Store the user data in a consistent format
    this.storeUserData(userData);
    
    return userData;
  }

  /**
   * Logout the current user
   * @returns {Promise} - Promise with the logout result
   */
  async logout() {
    await this.init();
    
    if (!this.currentAuthProvider) {
      throw new Error('No authentication provider available');
    }
    
    const result = await this.currentAuthProvider.logout();
    
    // Clear our unified storage
    localStorage.removeItem(this.userTokenKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.userDataKey);
    
    return result;
  }

  /**
   * Register a new user with the current authentication provider
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User's name (optional)
   * @param {string} department - User's department (optional)
   * @param {string} role - User's role (optional)
   * @returns {Promise} - Promise with the registration result
   */
  async register(email, password, name = '', department = 'General', role = 'User') {
    await this.init();
    
    if (!this.currentAuthProvider) {
      throw new Error('No authentication provider available');
    }
    
    const userData = await this.currentAuthProvider.register(email, password, name, department, role);
    
    // Store the user data in a consistent format
    this.storeUserData(userData);
    
    return userData;
  }

  /**
   * Check if a user is currently logged in
   * @returns {boolean} - True if logged in, false otherwise
   */
  isLoggedIn() {
    // First check our unified storage
    if (localStorage.getItem(this.userTokenKey)) {
      return true;
    }
    
    // Then check individual providers if available
    if (this.authProviders.backendless && this.authProviders.backendless.isLoggedIn()) {
      return true;
    }
    
    if (this.authProviders.supabase && this.authProviders.supabase.isLoggedIn()) {
      return true;
    }
    
    return false;
  }

  /**
   * Get the current user data
   * @returns {Object|null} - User data or null if not logged in
   */
  getUserData() {
    // Check our unified storage first
    const userData = localStorage.getItem(this.userDataKey);
    if (userData) {
      return JSON.parse(userData);
    }
    
    // Try to get from current provider
    if (this.currentAuthProvider) {
      const providerData = this.currentAuthProvider.getUserData();
      if (providerData) {
        // Store it in our unified storage
        this.storeUserData(providerData);
        return providerData;
      }
    }
    
    // Try each provider
    if (this.authProviders.supabase) {
      const supabaseData = this.authProviders.supabase.getUserData();
      if (supabaseData) {
        this.storeUserData(supabaseData);
        return supabaseData;
      }
    }
    
    if (this.authProviders.backendless) {
      const backendlessData = this.authProviders.backendless.getUserData();
      if (backendlessData) {
        this.storeUserData(backendlessData);
        return backendlessData;
      }
    }
    
    return null;
  }

  /**
   * Store user data in a consistent format
   * @param {Object} userData - The user data to store
   */
  storeUserData(userData) {
    if (!userData) return;
    
    // Extract user ID - different providers have different fields
    let userId = userData.id || userData.objectId || userData.user_id;
    
    // Extract token - different providers store this differently
    let token = userData.token || userData['user-token'] || userData.access_token;
    
    localStorage.setItem(this.userIdKey, userId);
    localStorage.setItem(this.userTokenKey, token);
    localStorage.setItem(this.userDataKey, JSON.stringify(userData));
  }

  /**
   * Create a mock session for testing
   * @returns {Promise<boolean>} Success status
   */
  async createMockSession() {
    await this.init();
    
    if (this.authProviders.supabase) {
      return await this.authProviders.supabase.createMockSession();
    } else {
      // Create our own mock session if no provider has this capability
      const mockUser = {
        id: 'mock-user-id',
        email: 'admin@reportrepo.com',
        name: 'Admin User (Mock)',
        role: 'Admin',
        department: 'IT',
        permissions: {
          canView: ['all'],
          canAdd: ['all'],
          canEdit: ['all'],
          canDelete: ['all']
        },
        token: 'mock-token'
      };
      
      this.storeUserData(mockUser);
      console.log('Created mock session');
      
      // Update the DB current user if available
      if (typeof DB !== 'undefined' && typeof DB.setCurrentUser === 'function') {
        DB.setCurrentUser(mockUser);
      }
      
      return true;
    }
  }
}

// Create an instance of the Authentication Integration Manager
const authManager = new AuthIntegrationManager();

// Auto-initialize when loaded
(async function() {
  try {
    await authManager.init();
    console.log('Auth Integration Manager initialized');
  } catch (error) {
    console.error('Failed to initialize Auth Integration Manager:', error);
  }
})();