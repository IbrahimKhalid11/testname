// Backendless Data Service

class BackendlessData {
  constructor() {
    this.baseUrl = BACKENDLESS_CONFIG.DATA_URL;
  }

  /**
   * Create a new record in a Backendless data table
   * @param {string} tableName - The name of the table
   * @param {Object} data - The data to save
   * @returns {Promise} - Promise with the create result
   */
  async create(tableName, data) {
    try {
      const userToken = backendlessAuth.getUserToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (userToken) {
        headers['user-token'] = userToken;
      }

      const response = await fetch(`${this.baseUrl}/${tableName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Create record failed');
      }

      return responseData;
    } catch (error) {
      console.error(`Create record in ${tableName} error:`, error);
      throw error;
    }
  }

  /**
   * Retrieve records from a Backendless data table
   * @param {string} tableName - The name of the table
   * @param {string} whereClause - Optional WHERE clause for filtering (e.g., "userID='123'")
   * @param {Array} properties - Optional array of properties to retrieve
   * @param {number} pageSize - Optional page size for pagination
   * @param {number} offset - Optional offset for pagination
   * @returns {Promise} - Promise with the query result
   */
  async find(tableName, whereClause = null, properties = null, pageSize = null, offset = null) {
    try {
      const userToken = backendlessAuth.getUserToken();
      const headers = {};
      
      if (userToken) {
        headers['user-token'] = userToken;
      }

      // Build query parameters
      let queryParams = [];
      
      if (whereClause) {
        queryParams.push(`where=${encodeURIComponent(whereClause)}`);
      }
      
      if (properties && Array.isArray(properties) && properties.length > 0) {
        queryParams.push(`props=${encodeURIComponent(properties.join(','))}`);
      }
      
      if (pageSize !== null) {
        queryParams.push(`pageSize=${pageSize}`);
      }
      
      if (offset !== null) {
        queryParams.push(`offset=${offset}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await fetch(`${this.baseUrl}/${tableName}${queryString}`, {
        method: 'GET',
        headers
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Find records failed');
      }

      return data;
    } catch (error) {
      console.error(`Find records in ${tableName} error:`, error);
      throw error;
    }
  }

  /**
   * Update a record in a Backendless data table
   * @param {string} tableName - The name of the table
   * @param {string} objectId - The objectId of the record to update
   * @param {Object} data - The data to update
   * @returns {Promise} - Promise with the update result
   */
  async update(tableName, objectId, data) {
    try {
      const userToken = backendlessAuth.getUserToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (userToken) {
        headers['user-token'] = userToken;
      }

      const response = await fetch(`${this.baseUrl}/${tableName}/${objectId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Update record failed');
      }

      return responseData;
    } catch (error) {
      console.error(`Update record in ${tableName} error:`, error);
      throw error;
    }
  }

  /**
   * Delete a record from a Backendless data table
   * @param {string} tableName - The name of the table
   * @param {string} objectId - The objectId of the record to delete
   * @returns {Promise} - Promise with the delete result
   */
  async delete(tableName, objectId) {
    try {
      const userToken = backendlessAuth.getUserToken();
      const headers = {};
      
      if (userToken) {
        headers['user-token'] = userToken;
      }

      const response = await fetch(`${this.baseUrl}/${tableName}/${objectId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Delete record failed');
      }

      return true;
    } catch (error) {
      console.error(`Delete record from ${tableName} error:`, error);
      throw error;
    }
  }
}

// Create an instance of the BackendlessData service
const backendlessData = new BackendlessData();