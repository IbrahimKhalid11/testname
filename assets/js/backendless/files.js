// Backendless File Storage Service

class BackendlessFiles {
  constructor() {
    this.baseUrl = BACKENDLESS_CONFIG.FILES_URL;
  }

  /**
   * Upload a file to Backendless
   * @param {File} file - The file to upload
   * @param {string} directory - The directory to upload to (e.g., 'reports')
   * @returns {Promise} - Promise with the upload result
   */
  async uploadFile(file, directory = '') {
    try {
      const userToken = backendlessAuth.getUserToken();
      const headers = {};
      
      if (userToken) {
        headers['user-token'] = userToken;
      }

      // Create FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Generate path based on directory and filename
      const path = directory ? `${directory}/${file.name}` : file.name;
      
      console.log("Uploading file to Backendless:", path);
      console.log("Upload URL:", `${this.baseUrl}/${path}`);
      
      const response = await fetch(`${this.baseUrl}/${path}`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'File upload failed');
      }

      console.log("File upload successful. Response:", data);
      
      // Ensure fileURL is correctly set - construct it if not provided by Backendless
      if (!data.fileURL) {
        // Backendless should always return a fileURL, but if it doesn't for some reason,
        // we'll construct one based on the Backendless configuration and file path
        data.fileURL = `${this.baseUrl}/${path}`;
        console.log("Constructed file URL:", data.fileURL);
      } else {
        console.log("Using provided file URL:", data.fileURL);
      }

      return data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Backendless
   * @param {string} fileUrl - The URL of the file to delete
   * @returns {Promise} - Promise with the delete result
   */
  async deleteFile(fileUrl) {
    try {
      const userToken = backendlessAuth.getUserToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (userToken) {
        headers['user-token'] = userToken;
      }

      // Extract file path from URL
      const filePath = fileUrl.replace(this.baseUrl + '/', '');
      
      const response = await fetch(`${this.baseUrl}/${filePath}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'File delete failed');
      }

      return true;
    } catch (error) {
      console.error('File delete error:', error);
      throw error;
    }
  }
}

// Create an instance of the BackendlessFiles service
const backendlessFiles = new BackendlessFiles();