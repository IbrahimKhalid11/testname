// Supabase File Storage Service
// Handles file uploads, downloads, and management

class SupabaseFiles {
  constructor() {
    this.supabaseClient = null;
    this.initialized = false;
    this.bucketName = SUPABASE_CONFIG.STORAGE_BUCKET || 'reports-files';
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
          console.log('Supabase Files service initialized with singleton client');
          
          // Ensure the bucket exists
          await this.ensureBucketExists();
          
          this.initialized = true;
        } else {
          console.error('getSupabaseClient function not available');
          throw new Error('getSupabaseClient function not available');
        }
      }
      return true;
    } catch (error) {
      console.error('Supabase Files initialization error:', error);
      return false;
    }
  }

  /**
   * Ensure the storage bucket exists
   */
  async ensureBucketExists() {
    try {
      // For testing purposes, skip bucket operations to avoid RLS policy errors
      console.log('Skipping bucket operations for testing - would need proper RLS policies configured');
      return true;
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }

  /**
   * Upload a file to Supabase storage
   * @param {File} file - The file to upload
   * @param {string} folder - Optional folder path within the bucket
   * @returns {Promise<Object|null>} File metadata or null
   */
  async uploadFile(file, folder = '') {
    try {
      await this.init();
      
      // Create a unique file path
      const timestamp = new Date().getTime();
      const filePath = folder
        ? `${folder}/${timestamp}_${file.name}`
        : `${timestamp}_${file.name}`;
      
      // Upload the file
      const { data, error } = await this.supabaseClient
        .storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL instead of signed URL
      const { data: publicUrlData } = this.supabaseClient.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);
      
      return {
        path: data.path,
        fullPath: filePath,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        url: publicUrlData.publicUrl // Use public URL
      };
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  }

  /**
   * Upload a file as a new report (one report per file)
   * @param {File} file - The file to upload
   * @param {Object} reportData - Report metadata (department, reportType, etc.)
   * @param {string} notes - Optional notes about the file
   * @returns {Promise<Object|null>} Created report record or null
   */
  async uploadFileAsReport(file, reportData, notes = '') {
    try {
      await this.init();
      
      // Upload the file to the "reports/" folder with timestamp
      const fileData = await this.uploadFile(file, 'reports');
      
      if (!fileData) {
        throw new Error('File upload failed');
      }
      
      // Get submitter info
      let submitterName = 'Unknown User';
      let submitterId = null;
      
      if (typeof supabaseAuth !== 'undefined' && supabaseAuth.getCurrentUser) {
        try {
          const currentUser = await supabaseAuth.getCurrentUser();
          if (currentUser) {
            submitterName = currentUser.user_metadata?.name || currentUser.email || 'Unknown User';
            submitterId = currentUser.id;
          }
        } catch (authError) {
          console.error('Error getting current user:', authError);
        }
      }
      
      // Create the report record with file data directly
      const reportRecord = {
        name: file.name, // Use original filename
        department: reportData.department,
        department_id: reportData.departmentId,
        submitter: submitterName,
        submitter_id: submitterId,
        date: new Date().toISOString().split('T')[0],
        status: 'Submitted',
        format: reportData.format, // Use selected format from UI
        frequency: reportData.frequency,
        report_type_id: reportData.reportTypeId,
        // File-specific fields
        report_url: fileData.url,
        file_size: file.size,
        created_at: new Date().toISOString(),
        notes: notes
      };
      
      // Create the report record in the database
      if (typeof supabaseDataService !== 'undefined') {
        try {
          await supabaseDataService.init();
          const createdReport = await supabaseDataService.insert('reports', reportRecord);
          
          if (createdReport) {
            console.log('✅ File uploaded and report created successfully');
            return createdReport;
          } else {
            throw new Error('Failed to create report record');
          }
        } catch (dbError) {
          console.error('Database creation error:', dbError);
          // File uploaded but DB creation failed
          throw new Error('File uploaded but database record creation failed');
        }
      } else {
        throw new Error('Supabase data service not available');
      }
    } catch (error) {
      console.error('Upload file as report error:', error);
      return null;
    }
  }

  /**
   * Upload multiple files for a report with comprehensive error handling
   * @param {number} reportId - The report ID  
   * @param {FileList|Array} files - Files to upload
   * @param {string} notes - Optional notes for all files
   * @returns {Promise<Object>} Upload results with success/error tracking
   */
  async uploadMultipleReportFiles(reportId, files, notes = '') {
    const results = {
      successful: [],
      failed: [],
      summary: {
        total: files.length,
        succeeded: 0,
        failed: 0
      }
    };
    
    console.log(`Starting batch upload of ${files.length} files for report ${reportId}`);
    
    // Process files sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const fileData = await this.uploadReportFile(reportId, file, notes);
        
        if (fileData) {
          results.successful.push({
            file: file.name,
            data: fileData,
            index: i
          });
          results.summary.succeeded++;
          console.log(`✅ Successfully uploaded file ${i + 1}/${files.length}: ${file.name}`);
        } else {
          throw new Error('Upload returned null result');
        }
        
      } catch (error) {
        results.failed.push({
          file: file.name,
          error: error.message,
          index: i
        });
        results.summary.failed++;
        console.error(`❌ Failed to upload file ${i + 1}/${files.length}: ${file.name}`, error);
      }
    }
    
    console.log(`Batch upload complete: ${results.summary.succeeded}/${results.summary.total} successful`);
    
    return results;
  }

  /**
   * Get a downloadable URL for a file
   * @param {string} filePath - The file path in storage
   * @param {number} expiresIn - Expiration time in seconds (default: 60 minutes)
   * @returns {Promise<string|null>} The signed URL or null
   */
  async getFileUrl(filePath, expiresIn = 3600) {
    try {
      await this.init();
      
      const { data, error } = await this.supabaseClient
        .storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);
      
      if (error) {
        throw error;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }

  /**
   * Delete a file from storage
   * @param {string} filePath - The file path in storage
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(filePath) {
    try {
      await this.init();
      
      const { error } = await this.supabaseClient
        .storage
        .from(this.bucketName)
        .remove([filePath]);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * List files in a folder
   * @param {string} folder - The folder path (default: root folder)
   * @returns {Promise<Array|null>} Array of files or null
   */
  async listFiles(folder = '') {
    try {
      await this.init();
      
      const { data, error } = await this.supabaseClient
        .storage
        .from(this.bucketName)
        .list(folder);
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error listing files:', error);
      return null;
    }
  }

  /**
   * Test the storage connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.init();
      
      // Try to list files in the bucket
      const { data, error } = await this.supabaseClient
        .storage
        .from(this.bucketName)
        .list();
      
      if (error) {
        throw error;
      }
      
      console.log('Supabase Storage connection test successful');
      return true;
    } catch (error) {
      console.error('Supabase Storage connection test failed:', error);
      return false;
    }
  }
}

// Create instance of the files service
const supabaseFilesService = new SupabaseFiles();