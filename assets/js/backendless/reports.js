// Backendless Reports Service

class BackendlessReports {
  constructor() {
    // Initialize dependencies
    this.dataService = backendlessData;
    this.fileService = backendlessFiles;
  }

  /**
   * Upload a report file to Backendless
   * @param {File} file - The report file to upload
   * @returns {Promise} - Promise with the uploaded file URL and details
   */
  async uploadReportFile(file) {
    try {
      // Upload file to the reports directory
      const fileData = await this.fileService.uploadFile(file, 'reports');
      return fileData;
    } catch (error) {
      console.error('Upload report file error:', error);
      throw error;
    }
  }

  /**
   * Save report information to the Reports table
   * @param {string} fileName - The name of the file
   * @param {string} fileURL - The URL of the uploaded file
   * @param {string} userID - The objectId of the logged-in user
   * @param {string} departmentId - The department ID
   * @param {string} reportTypeId - The report type ID
   * @param {string} notes - Optional notes about the report
   * @returns {Promise} - Promise with the saved report information
   */
  async saveReportInfo(fileName, fileURL, userID, departmentId = '', reportTypeId = '', notes = '') {
    try {
      console.log(`Saving report info with userID: ${userID}`);
      
      // Get user data to store username instead of UUID
      let userName = userID; // Default to ID if lookup fails
      
      try {
        // First try to get user data from Backendless
        const userData = await this.dataService.findById('Users', userID);
        console.log('User data from Backendless:', userData);
        
        if (userData) {
          userName = userData.name || userData.email || userID;
          console.log(`Found user name: ${userName}`);
        } else {
          // If no user found in Backendless, try to get from local storage
          console.log('No user found in Backendless, checking local storage');
          const localDb = JSON.parse(localStorage.getItem('reportrepo_db'));
          if (localDb && localDb.users) {
            const localUser = localDb.users.find(u => u.id === userID);
            if (localUser) {
              userName = localUser.name || localUser.email || userID;
              console.log(`Found user name in local storage: ${userName}`);
            }
          }
        }
      } catch (userLookupError) {
        console.error('Error looking up user:', userLookupError);
        // Continue with userID as fallback
      }
      
      console.log(`Final userName to be stored: ${userName}`);
      
      // Create report record in Reports table
      const reportData = {
        fileName,
        fileURL,
        userID,        // Keep original UUID for references
        userName,      // Store actual user name
        departmentId,
        reportTypeId,
        notes
      };
      
      console.log('Saving report data to Backendless:', reportData);
      const result = await this.dataService.create('Reports', reportData);
      console.log('Report saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Save report info error:', error);
      throw error;
    }
  }

  /**
   * Get reports for a specific user
   * @param {string} userID - The objectId of the user
   * @returns {Promise} - Promise with the list of reports
   */
  async getUserReports(userID) {
    try {
      // Find reports for the specified user
      return await this.dataService.find('Reports', `userID='${userID}'`);
    } catch (error) {
      console.error('Get user reports error:', error);
      throw error;
    }
  }

  /**
   * Get all reports (admin only)
   * @returns {Promise} - Promise with the list of all reports
   */
  async getAllReports() {
    try {
      // Find all reports - sort by created date in descending order to get newest first
      return await this.dataService.find('Reports', null, null, 100, 0);
    } catch (error) {
      console.error('Get all reports error:', error);
      throw error;
    }
  }

  /**
   * Update an existing report
   * @param {string} reportID - The objectId of the report to update
   * @param {Object} updateData - The data to update
   * @returns {Promise} - Promise with the updated report information
   */
  async updateReport(reportID, updateData) {
    try {
      return await this.dataService.update('Reports', reportID, updateData);
    } catch (error) {
      console.error('Update report error:', error);
      throw error;
    }
  }

  /**
   * Delete a report and its associated file
   * @param {string} reportID - The objectId of the report to delete
   * @param {string} fileURL - The URL of the file to delete
   * @returns {Promise} - Promise with the delete result
   */
  async deleteReport(reportID, fileURL) {
    try {
      // Delete the report record
      await this.dataService.delete('Reports', reportID);
      
      // Delete the associated file
      await this.fileService.deleteFile(fileURL);
      
      return true;
    } catch (error) {
      console.error('Delete report error:', error);
      throw error;
    }
  }
}

// Create an instance of the BackendlessReports service
const backendlessReports = new BackendlessReports();