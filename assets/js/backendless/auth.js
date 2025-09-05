// Backendless Authentication Service

class BackendlessAuth {
  constructor() {
    this.userTokenKey = 'backendless_user_token';
    this.userObjectIdKey = 'backendless_user_objectId';
    this.userDataKey = 'backendless_user_data';
  }

  /**
   * Register a new user with Backendless
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User's name (optional)
   * @param {string} department - User's department (optional)
   * @param {string} role - User's role (optional)
   * @returns {Promise} - Promise with the registration result
   */
  async register(email, password, name = '', department = 'General', role = 'User') {
    try {
      console.log(`Registering user: ${email}`);
      
      // Prepare user data with all necessary fields
      const userData = {
        email,
        password
      };
      
      // Add optional fields if provided
      if (name) userData.name = name;
      if (department) userData.department = department;
      if (role) userData.role = role;
      
      // Create default permissions structure
      userData.permissions = {
        canView: ['department'],
        canAdd: ['department'],
        canEdit: ['department'],
        canDelete: ['none']
      };
      
      const response = await fetch(`${BACKENDLESS_CONFIG.BASE_URL}/${BACKENDLESS_CONFIG.APP_ID}/${BACKENDLESS_CONFIG.API_KEY}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Registration failed:', data);
        throw new Error(data.message || 'Registration failed');
      }

      console.log('User registered successfully:', data);
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login a user with Backendless
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Promise with the login result
   */
  async login(email, password) {
    try {
      const response = await fetch(`${BACKENDLESS_CONFIG.BASE_URL}/${BACKENDLESS_CONFIG.APP_ID}/${BACKENDLESS_CONFIG.API_KEY}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: email,
          password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store user token and objectId in localStorage
      localStorage.setItem(this.userTokenKey, data['user-token']);
      localStorage.setItem(this.userObjectIdKey, data.objectId);
      localStorage.setItem(this.userDataKey, JSON.stringify(data));

      return data;
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
      const userToken = this.getUserToken();
      
      if (!userToken) {
        throw new Error('No active user session');
      }

      const response = await fetch(`${BACKENDLESS_CONFIG.BASE_URL}/${BACKENDLESS_CONFIG.APP_ID}/${BACKENDLESS_CONFIG.API_KEY}/users/logout`, {
        method: 'GET',
        headers: {
          'user-token': userToken
        }
      });

      // Clear user data from localStorage
      localStorage.removeItem(this.userTokenKey);
      localStorage.removeItem(this.userObjectIdKey);
      localStorage.removeItem(this.userDataKey);

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get the current user token from localStorage
   * @returns {string|null} - User token or null if not logged in
   */
  getUserToken() {
    return localStorage.getItem(this.userTokenKey);
  }

  /**
   * Get the current user objectId from localStorage
   * @returns {string|null} - User objectId or null if not logged in
   */
  getUserObjectId() {
    return localStorage.getItem(this.userObjectIdKey);
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
    return !!this.getUserToken();
  }
}

// Create an instance of the BackendlessAuth service
const backendlessAuth = new BackendlessAuth();