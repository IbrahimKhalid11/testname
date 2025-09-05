# Supabase Integration Testing Guide

This guide provides step-by-step instructions for testing the Supabase integration. Follow these procedures to verify that each component is working correctly.

## 1. Initial Setup Testing

### 1.1. Configuration Verification
**Option A: Using the dedicated configuration check page**
1. **Open `test-configuration-check.html` in your browser**
2. The page will automatically run a configuration check
3. Verify all green checkmarks for:
   - SUPABASE_CONFIG found
   - URL matches expected value
   - Project ID matches expected value
   - Storage bucket matches expected value

**Option B: Manual verification in test page**
1. **Open `test-supabase-integration.html` in your browser**
2. Wait for scripts to load completely (you'll see initial log messages)
3. Open browser console and run:
   ```javascript
   // Check if SUPABASE_CONFIG exists
   if (typeof SUPABASE_CONFIG !== 'undefined') {
     console.log('✅ SUPABASE_CONFIG found:', SUPABASE_CONFIG);
     console.log('✅ URL:', SUPABASE_CONFIG.URL);
     console.log('✅ Project ID:', SUPABASE_CONFIG.PROJECT_ID);
     console.log('✅ Storage Bucket:', SUPABASE_CONFIG.STORAGE_BUCKET);
   } else {
     console.error('❌ SUPABASE_CONFIG is not defined');
   }
   ```
4. Verify the output shows correct values:
   - URL: `https://pvfmdczitmjtvbgewurc.supabase.co`
   - Project ID: `pvfmdczitmjtvbgewurc`
   - Storage bucket: `reports-files`

### 1.2. Supabase Client Loading
1. Ensure you have `test-supabase-integration.html` open
2. Check browser console for "Supabase client script loaded" message
3. Verify `supabase` object exists by running in console:
   ```javascript
   if (typeof supabase !== 'undefined') {
     console.log('✅ Supabase client available:', typeof supabase.createClient);
   } else {
     console.error('❌ Supabase client not loaded');
   }
   ```

## 2. Authentication Testing

### 2.1. Connection Test
1. Click "Test Connection" button
2. Verify "All connection tests passed" in log
3. Check status shows "All connections successful"

### 2.2. Integration Initialization
1. Click "Initialize Full Integration" button
2. Verify "Full integration system initialized successfully" in log
3. Check status shows "Full integration ready"

### 2.3. Admin User Creation
1. Check browser console for admin user creation success messages
2. Verify admin user exists in Supabase Auth and public.users table

## 3. Data Synchronization Testing

### 3.1. Departments Sync
1. Click "Sync Departments" button
2. Verify sync completion message in log with count of synced items
3. Check "departments-data" display shows department list
4. Verify departments in Supabase table match local storage

### 3.2. Users Sync
1. Click "Sync Users" button
2. Verify sync completion message in log with count of synced items
3. Check "users-data" display shows user list
4. Verify users in Supabase table match local storage

### 3.3. Report Types Sync
1. Click "Sync Report Types" button
2. Verify sync completion message in log
3. Check "reportTypes-data" display shows report type list
4. Verify report types in Supabase table match local storage

### 3.4. Reports Sync
1. Click "Sync Reports" button
2. Verify sync completion message in log
3. Check "reports-data" display shows reports list
4. Verify reports in Supabase table match local storage

### 3.5. Frequencies and Formats Sync
1. Click "Sync Frequencies" button
2. Click "Sync Formats" button
3. Verify sync completion messages in log
4. Check data displays show current items
5. Verify Supabase tables match local storage

## 4. Data Creation Testing

### 4.1. Department Creation
1. Click "Create Test Dept" button
2. Verify "Test department created" message in log
3. Check department appears in "departments-data" display
4. Verify department exists in Supabase `departments` table

### 4.2. Report Type Creation
1. Click "Create Test Type" button
2. Verify "Test report type created" message in log
3. Check report type appears in "reportTypes-data" display
4. Verify report type exists in Supabase `report_types` table

### 4.3. Report Creation
1. Click "Create Test Report" button
2. Verify "Test report created" message in log
3. Check report appears in "reports-data" display
4. Verify report exists in Supabase `reports` table

## 5. File Storage Testing

### 5.1. File Upload
1. Select a file using the file input
2. Click "Test File Upload" button
3. Verify "File uploaded successfully" message in log
4. Check "file-test-result" display shows file details and URL
5. Verify file exists in Supabase Storage bucket
6. Verify file metadata was added to the report's files array

## 6. Full System Testing

### 6.1. Full Sync Operation
1. Click "Full Sync" button
2. Verify "Full sync completed successfully" message in log
3. Check all data displays are updated
4. Verify all data is consistent between local storage and Supabase

### 6.2. System Status Check
1. Open browser console
2. Check `supabaseIntegrationManager.getSyncStatus()` results
3. Verify `isInitialized` is true
4. Verify `syncInProgress` is false
5. Verify `lastFullSyncTime` has a recent timestamp

## 7. Error Handling Testing

### 7.1. Offline Mode Testing
1. Disconnect from internet (or use browser network tab to simulate offline)
2. Attempt operations and verify appropriate error messages
3. Check that local operations still function
4. Reconnect to internet and verify sync can resume

### 7.2. Error Recovery
1. Export test results using "Export Results" button
2. Verify exported JSON file contains all test data
3. Clear browser local storage
4. Refresh page and initialize integration
5. Verify data is restored from Supabase during sync

## 8. Integration Completion

After successfully completing all tests, the Supabase integration is verified and ready for use in the main application. Update the main HTML files to use the Supabase integration components instead of Backendless.