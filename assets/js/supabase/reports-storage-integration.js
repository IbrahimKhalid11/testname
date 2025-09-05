// Supabase Reports & Storage Integration
// Handles synchronization between local storage and Supabase for reports, report types,
// frequencies, formats, and file storage

class ReportsStorageIntegration {
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
          console.log('Reports & Storage integration initialized');
          
          // Initialize dependencies
          await supabaseDataService.init();
          await supabaseFilesService.init();
          
          this.initialized = true;
        } else if (!this.supabaseClient) {
          console.error('Supabase client not available');
          throw new Error('Supabase client not available');
        }
      }
      return true;
    } catch (error) {
      console.error('Reports & Storage integration initialization error:', error);
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
      const dataConnection = await supabaseDataService.testConnection();
      const storageConnection = await supabaseFilesService.testConnection();
      return dataConnection && storageConnection;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }

  /**
   * Synchronize all reports-related data
   * @param {string} direction - 'toSupabase', 'fromSupabase', or 'bidirectional'
   * @returns {Promise<Object>} Sync results
   */
  async syncAllReportsData(direction = 'bidirectional') {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    this.syncInProgress = true;
    console.log(`Starting reports data sync (${direction})...`);

    try {
      // Sync in order: report types, frequencies, formats, then reports
      const reportTypesResult = await this.syncReportTypes(direction);
      const frequenciesResult = await this.syncFrequencies(direction);
      const formatsResult = await this.syncFormats(direction);
      const reportsResult = await this.syncReports(direction);
      
      this.lastSyncTime = new Date();
      
      return {
        success: true,
        reportTypes: reportTypesResult,
        frequencies: frequenciesResult,
        formats: formatsResult,
        reports: reportsResult,
        timestamp: this.lastSyncTime
      };
    } catch (error) {
      console.error('Reports data sync error:', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Synchronize report types
   * @param {string} direction - 'toSupabase', 'fromSupabase', or 'bidirectional'
   * @returns {Promise<Object>} Sync results
   */
  async syncReportTypes(direction = 'bidirectional') {
    try {
      await this.init();
      
      // Get report types from local storage
      const localReportTypes = DB.get('reportTypes') || [];
      
      // Get report types from Supabase
      const supabaseReportTypes = await supabaseDataService.getAll('report_types');
      
      let result = { total: 0, synced: 0 };
      
      if (direction === 'toSupabase' || direction === 'bidirectional') {
        // Update Supabase with local report types
        const reportTypesToUpsert = localReportTypes.map(rt => ({
          id: rt.id,
          name: rt.name,
          department: rt.department,
          frequency: rt.frequency,
          format: rt.format,
          description: rt.description,
          updated_at: new Date().toISOString()
        }));
        
        if (reportTypesToUpsert.length > 0) {
          await supabaseDataService.upsert('report_types', reportTypesToUpsert);
          result.synced += reportTypesToUpsert.length;
        }
      }
      
      if (direction === 'fromSupabase' || direction === 'bidirectional') {
        // Update local storage with Supabase report types
        const localUpdates = supabaseReportTypes.map(rt => ({
          id: rt.id,
          name: rt.name,
          department: rt.department,
          frequency: rt.frequency,
          format: rt.format,
          description: rt.description
        }));
        
        // Update local DB
        if (localUpdates.length > 0) {
          DB.set('reportTypes', localUpdates);
        }
      }
      
      result.total = Math.max(localReportTypes.length, supabaseReportTypes.length);
      return result;
    } catch (error) {
      console.error('Report types sync error:', error);
      throw error;
    }
  }

  /**
   * Synchronize frequencies
   * @param {string} direction - 'toSupabase', 'fromSupabase', or 'bidirectional'
   * @returns {Promise<Object>} Sync results
   */
  async syncFrequencies(direction = 'bidirectional') {
    try {
      await this.init();
      
      // Get frequencies from local storage
      const localFrequencies = DB.get('frequencies') || [];
      
      // Get frequencies from Supabase
      const supabaseFrequencies = await supabaseDataService.getAll('frequencies');
      
      let result = { total: 0, synced: 0 };
      
      if (direction === 'toSupabase' || direction === 'bidirectional') {
        // Update Supabase with local frequencies
        const frequenciesToUpsert = localFrequencies.map(freq => ({
          id: freq.id,
          name: freq.name,
          description: freq.description
        }));
        
        if (frequenciesToUpsert.length > 0) {
          await supabaseDataService.upsert('frequencies', frequenciesToUpsert);
          result.synced += frequenciesToUpsert.length;
        }
      }
      
      if (direction === 'fromSupabase' || direction === 'bidirectional') {
        // Update local storage with Supabase frequencies
        const localUpdates = supabaseFrequencies.map(freq => ({
          id: freq.id,
          name: freq.name,
          description: freq.description
        }));
        
        // Update local DB
        if (localUpdates.length > 0) {
          DB.set('frequencies', localUpdates);
        }
      }
      
      result.total = Math.max(localFrequencies.length, supabaseFrequencies.length);
      return result;
    } catch (error) {
      console.error('Frequencies sync error:', error);
      throw error;
    }
  }

  /**
   * Synchronize formats
   * @param {string} direction - 'toSupabase', 'fromSupabase', or 'bidirectional'
   * @returns {Promise<Object>} Sync results
   */
  async syncFormats(direction = 'bidirectional') {
    try {
      await this.init();
      
      // Get formats from local storage
      const localFormats = DB.get('formats') || [];
      
      // Get formats from Supabase
      const supabaseFormats = await supabaseDataService.getAll('formats');
      
      let result = { total: 0, synced: 0 };
      
      if (direction === 'toSupabase' || direction === 'bidirectional') {
        // Update Supabase with local formats
        const formatsToUpsert = localFormats.map(format => ({
          id: format.id,
          name: format.name,
          description: format.description,
          extensions: format.extensions
        }));
        
        if (formatsToUpsert.length > 0) {
          await supabaseDataService.upsert('formats', formatsToUpsert);
          result.synced += formatsToUpsert.length;
        }
      }
      
      if (direction === 'fromSupabase' || direction === 'bidirectional') {
        // Update local storage with Supabase formats
        const localUpdates = supabaseFormats.map(format => ({
          id: format.id,
          name: format.name,
          description: format.description,
          extensions: format.extensions
        }));
        
        // Update local DB
        if (localUpdates.length > 0) {
          DB.set('formats', localUpdates);
        }
      }
      
      result.total = Math.max(localFormats.length, supabaseFormats.length);
      return result;
    } catch (error) {
      console.error('Formats sync error:', error);
      throw error;
    }
  }

  /**
   * Synchronize reports
   * @param {string} direction - 'toSupabase', 'fromSupabase', or 'bidirectional'
   * @returns {Promise<Object>} Sync results
   */
  async syncReports(direction = 'bidirectional') {
    try {
      await this.init();
      
      // Get reports from local storage
      const localReports = DB.get('reports') || [];
      
      // Get reports from Supabase
      const supabaseReports = await supabaseDataService.getAll('reports');
      
      let result = { total: 0, synced: 0 };
      
      if (direction === 'toSupabase' || direction === 'bidirectional') {
        // Update Supabase with local reports
        const reportsToUpsert = localReports.map(report => ({
          id: report.id,
          name: report.name,
          department: report.department,
          submitter: report.submitter,
          submitter_id: report.submitterId,
          date: report.date,
          status: report.status,
          format: report.format,
          frequency: report.frequency,
          report_type_id: report.reportTypeId,
          updated_at: new Date().toISOString()
        }));
        
        if (reportsToUpsert.length > 0) {
          await supabaseDataService.upsert('reports', reportsToUpsert);
          result.synced += reportsToUpsert.length;
        }
      }
      
      if (direction === 'fromSupabase' || direction === 'bidirectional') {
        // Update local storage with Supabase reports
        const localUpdates = supabaseReports.map(report => ({
          id: report.id,
          name: report.name,
          department: report.department,
          submitter: report.submitter,
          submitterId: report.submitter_id,
          date: report.date,
          status: report.status,
          format: report.format,
          frequency: report.frequency,
          reportTypeId: report.report_type_id
        }));
        
        // Update local DB
        if (localUpdates.length > 0) {
          DB.set('reports', localUpdates);
        }
      }
      
      result.total = Math.max(localReports.length, supabaseReports.length);
      return result;
    } catch (error) {
      console.error('Reports sync error:', error);
      throw error;
    }
  }

  /**
   * Create a new report
   * @param {Object} reportData - Report data
   * @param {File[]} files - Optional array of files to upload
   * @returns {Promise<Object>} Created report
   */
  async createReport(reportData, files = []) {
    try {
      await this.init();
      
      // First create the report without files
      const reportToCreate = {
        name: reportData.name,
        department: reportData.department,
        submitter: reportData.submitter,
        submitter_id: reportData.submitterId,
        date: reportData.date || new Date().toISOString().split('T')[0],
        status: reportData.status || 'Pending',
        format: reportData.format,
        frequency: reportData.frequency,
        department_id: reportData.departmentId, // Add this
        report_type_id: reportData.reportTypeId // Add this
      };
      
      // Create in Supabase
      const newReport = await supabaseDataService.insert('reports', reportToCreate);
      
      if (!newReport) {
        throw new Error('Failed to create report in Supabase');
      }
      
      let fileData = [];
      
      // Upload files if provided
      if (files && files.length > 0) {
        for (const file of files) {
          const uploadedFile = await this.uploadReportFile(newReport.id, file, reportData.notes);
          if (uploadedFile) {
            fileData.push(uploadedFile);
          }
        }
        
        // Update the report with file information
        if (fileData.length > 0) {
          await supabaseDataService.update('reports', newReport.id, {
            report_url: fileData[0].url // Store first file's URL
          });
          
          newReport.report_url = fileData[0].url;
        }
      }
      
      // Add to local storage
      const localReport = {
        id: newReport.id,
        name: newReport.name,
        department: newReport.department,
        submitter: newReport.submitter,
        submitterId: newReport.submitter_id,
        date: newReport.date,
        status: newReport.status,
        format: newReport.format,
        frequency: newReport.frequency,
        reportTypeId: newReport.report_type_id
      };
      
      DB.add('reports', localReport);
      
      return localReport;
    } catch (error) {
      console.error('Create report error:', error);
      throw error;
    }
  }

  /**
   * Upload a file to a report
   * @param {number} reportId - Report ID
   * @param {File} file - File to upload
   * @param {string} notes - Notes about the file
   * @returns {Promise<Object>} File metadata
   */
  async uploadReportFile(reportId, file, notes = '') {
    try {
      await this.init();
      
      // Upload the file
      const fileData = await supabaseFilesService.uploadReportFile(reportId, file, notes);
      
      if (!fileData) {
        throw new Error('File upload failed');
      }
      
      // Get current report
      const report = await supabaseDataService.getById('reports', reportId);
      
      if (!report) {
        throw new Error('Report not found');
      }
      
      // Update report with new file
      await supabaseDataService.update('reports', reportId, {
        report_url: fileData.url,
        updated_at: new Date().toISOString()
      });
      
      // Update local storage
      DB.addReportFile(reportId, fileData);
      
      return fileData;
    } catch (error) {
      console.error('Upload report file error:', error);
      throw error;
    }
  }

  /**
   * Update a report
   * @param {number} id - Report ID
   * @param {Object} updates - Report updates
   * @returns {Promise<Object>} Updated report
   */
  async updateReport(id, updates) {
    try {
      await this.init();
      
      // Update in Supabase
      const supabaseUpdates = { ...updates };
      
      // Convert reportTypeId to report_type_id for Supabase
      if (updates.reportTypeId !== undefined) {
        supabaseUpdates.report_type_id = updates.reportTypeId;
        delete supabaseUpdates.reportTypeId;
      }
      
      // Convert submitterId to submitter_id for Supabase
      if (updates.submitterId !== undefined) {
        supabaseUpdates.submitter_id = updates.submitterId;
        delete supabaseUpdates.submitterId;
      }
      
      supabaseUpdates.updated_at = new Date().toISOString();
      
      const updatedReport = await supabaseDataService.update('reports', id, supabaseUpdates);
      
      if (!updatedReport) {
        throw new Error('Failed to update report in Supabase');
      }
      
      // Update in local storage
      const localUpdates = { ...updates };
      const localReport = DB.update('reports', id, localUpdates);
      
      return localReport;
    } catch (error) {
      console.error('Update report error:', error);
      throw error;
    }
  }

  /**
   * Delete a report
   * @param {number} id - Report ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteReport(id) {
    try {
      await this.init();
      
      // Get report for file deletion
      const report = await supabaseDataService.getById('reports', id);
      
      if (report && report.report_url) {
        // Delete the file associated with the report
        // Extract path from URL for deletion (this would need proper path extraction)
        console.log('File deletion would be handled here for:', report.report_url);
      }
      
      // Delete from Supabase
      const success = await supabaseDataService.delete('reports', id);
      
      if (!success) {
        throw new Error('Failed to delete report from Supabase');
      }
      
      // Delete from local storage
      DB.delete('reports', id);
      
      return true;
    } catch (error) {
      console.error('Delete report error:', error);
      throw error;
    }
  }

  /**
   * Create a new report type
   * @param {Object} reportTypeData - Report type data
   * @returns {Promise<Object>} Created report type
   */
  async createReportType(reportTypeData) {
    try {
      await this.init();
      
      // Create in Supabase
      const newReportType = await supabaseDataService.insert('report_types', {
        name: reportTypeData.name,
        department: reportTypeData.department,
        frequency: reportTypeData.frequency,
        format: reportTypeData.format,
        description: reportTypeData.description
      });
      
      if (!newReportType) {
        throw new Error('Failed to create report type in Supabase');
      }
      
      // Add to local storage
      const localReportType = {
        id: newReportType.id,
        name: newReportType.name,
        department: newReportType.department,
        frequency: newReportType.frequency,
        format: newReportType.format,
        description: newReportType.description
      };
      
      DB.add('reportTypes', localReportType);
      
      return localReportType;
    } catch (error) {
      console.error('Create report type error:', error);
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
const reportsStorageIntegration = new ReportsStorageIntegration();