// Reports, ReportTypes and File Storage Integration with Backendless
class ReportsStorageIntegration {
    constructor() {
        this.isInitialized = false;
        this.syncInProgress = false;
        this.lastSyncTime = null;
    }

    /**
     * Initialize reports and storage integration
     */
    async init() {
        console.log('🚀 Initializing Reports and Storage integration...');
        
        try {
            // Test connection with reports table
            await this.testConnection();
            
            this.isInitialized = true;
            console.log('✅ Reports and Storage integration initialized');
            
            return true;
        } catch (error) {
            console.error('❌ Reports and Storage integration failed:', error);
            return false;
        }
    }

    /**
     * Test Backendless connection with Reports table
     */
    async testConnection() {
        try {
            // Try to fetch a small amount of data from Reports table
            await backendlessData.find('Reports', null, ['name'], 1);
            console.log('✅ Reports table connection test passed');
            return true;
        } catch (error) {
            console.warn('⚠️ Reports table connection test failed:', error);
            throw error;
        }
    }

    /**
     * Sync all reports-related data with Backendless
     */
    async syncAllReportsData(direction = 'bidirectional') {
        if (this.syncInProgress) {
            console.log('⚠️ Sync already in progress');
            return;
        }

        this.syncInProgress = true;
        console.log(`🔄 Starting ${direction} sync for reports data...`);

        try {
            const results = {
                reportTypes: await this.syncReportTypes(direction),
                reports: await this.syncReports(direction),
                frequencies: await this.syncFrequencies(direction),
                formats: await this.syncFormats(direction)
            };

            this.lastSyncTime = new Date();
            console.log('✅ All reports data sync completed:', results);
            
            return results;
        } catch (error) {
            console.error('❌ Reports data sync failed:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync ReportTypes between local storage and Backendless
     */
    async syncReportTypes(direction = 'bidirectional') {
        console.log('📋 Syncing report types...');
        
        try {
            const localReportTypes = DB.get('reportTypes') || [];
            let backendlessReportTypes = [];
            
            try {
                backendlessReportTypes = await backendlessData.find('ReportTypes');
                if (!Array.isArray(backendlessReportTypes)) {
                    backendlessReportTypes = [];
                }
            } catch (error) {
                console.warn('Could not fetch report types from Backendless:', error);
                backendlessReportTypes = [];
            }
            
            let synced = 0;
            
            if (direction === 'toBackendless' || direction === 'bidirectional') {
                // Upload local report types to Backendless
                for (const reportType of localReportTypes) {
                    if (!reportType.objectId) {
                        try {
                            const result = await backendlessData.create('ReportTypes', {
                                name: reportType.name,
                                department: reportType.department,
                                frequency: reportType.frequency,
                                format: reportType.format,
                                description: reportType.description || '',
                                localId: reportType.id
                            });
                            
                            // Update local record with objectId
                            reportType.objectId = result.objectId;
                            synced++;
                            console.log(`✅ Report type "${reportType.name}" synced to Backendless`);
                        } catch (error) {
                            console.error(`❌ Failed to sync report type "${reportType.name}":`, error);
                        }
                    }
                }
                
                // Update local storage with objectIds
                if (typeof DB.set === 'function') {
                    DB.set('reportTypes', localReportTypes);
                } else {
                    localReportTypes.forEach(rt => {
                        if (rt.objectId && rt.id) {
                            DB.update('reportTypes', rt.id, rt);
                        }
                    });
                }
            }
            
            if (direction === 'fromBackendless' || direction === 'bidirectional') {
                // Download new report types from Backendless
                for (const backendReportType of backendlessReportTypes) {
                    const existingLocal = localReportTypes.find(rt => rt.objectId === backendReportType.objectId);
                    
                    if (!existingLocal) {
                        const newReportType = {
                            id: Math.max(...localReportTypes.map(rt => rt.id || 0), 0) + 1,
                            name: backendReportType.name,
                            department: backendReportType.department,
                            frequency: backendReportType.frequency,
                            format: backendReportType.format,
                            description: backendReportType.description || '',
                            objectId: backendReportType.objectId
                        };
                        
                        localReportTypes.push(newReportType);
                        synced++;
                        console.log(`✅ Report type "${newReportType.name}" downloaded from Backendless`);
                    }
                }
                
                // Update local storage
                if (typeof DB.set === 'function') {
                    DB.set('reportTypes', localReportTypes);
                } else {
                    const existingReportTypes = DB.get('reportTypes') || [];
                    const existingIds = existingReportTypes.map(rt => rt.objectId);
                    
                    localReportTypes.forEach(rt => {
                        if (rt.objectId && !existingIds.includes(rt.objectId)) {
                            DB.add('reportTypes', rt);
                        }
                    });
                }
            }
            
            console.log(`✅ Report types sync completed: ${synced} records processed`);
            return { synced, total: localReportTypes.length };
        } catch (error) {
            console.error('❌ Report types sync failed:', error);
            throw error;
        }
    }

    /**
     * Sync Reports between local storage and Backendless
     */
    async syncReports(direction = 'bidirectional') {
        console.log('📄 Syncing reports...');
        
        try {
            const localReports = DB.get('reports') || [];
            let backendlessReports = [];
            
            try {
                backendlessReports = await backendlessData.find('Reports');
                if (!Array.isArray(backendlessReports)) {
                    backendlessReports = [];
                }
            } catch (error) {
                console.warn('Could not fetch reports from Backendless:', error);
                backendlessReports = [];
            }
            
            let synced = 0;
            
            if (direction === 'toBackendless' || direction === 'bidirectional') {
                // Upload local reports to Backendless
                for (const report of localReports) {
                    if (!report.objectId) {
                        try {
                            // Handle file uploads if files exist
                            let fileURLs = [];
                            if (report.files && report.files.length > 0) {
                                console.log(`📎 Processing ${report.files.length} files for report "${report.name}"`);
                                // For now, just store file references - file upload will be handled separately
                                fileURLs = report.files.map(file => file.name || file.url || '');
                            }
                            
                            const result = await backendlessData.create('Reports', {
                                name: report.name,
                                department: report.department,
                                reportTypeId: report.reportTypeId,
                                submitter: report.submitter,
                                date: report.date,
                                status: report.status,
                                format: report.format,
                                frequency: report.frequency,
                                fileURLs: JSON.stringify(fileURLs),
                                files: JSON.stringify(report.files || []),
                                notes: report.notes || '',
                                localId: report.id
                            });
                            
                            // Update local record with objectId
                            report.objectId = result.objectId;
                            synced++;
                            console.log(`✅ Report "${report.name}" synced to Backendless`);
                        } catch (error) {
                            console.error(`❌ Failed to sync report "${report.name}":`, error);
                        }
                    }
                }
                
                // Update local storage with objectIds
                if (typeof DB.set === 'function') {
                    DB.set('reports', localReports);
                } else {
                    localReports.forEach(report => {
                        if (report.objectId && report.id) {
                            DB.update('reports', report.id, report);
                        }
                    });
                }
            }
            
            if (direction === 'fromBackendless' || direction === 'bidirectional') {
                // Download new reports from Backendless
                for (const backendReport of backendlessReports) {
                    const existingLocal = localReports.find(r => r.objectId === backendReport.objectId);
                    
                    if (!existingLocal) {
                        const newReport = {
                            id: Math.max(...localReports.map(r => r.id || 0), 0) + 1,
                            name: backendReport.name,
                            department: backendReport.department,
                            reportTypeId: backendReport.reportTypeId,
                            submitter: backendReport.submitter,
                            date: backendReport.date,
                            status: backendReport.status,
                            format: backendReport.format,
                            frequency: backendReport.frequency,
                            files: JSON.parse(backendReport.files || '[]'),
                            notes: backendReport.notes || '',
                            objectId: backendReport.objectId
                        };
                        
                        localReports.push(newReport);
                        synced++;
                        console.log(`✅ Report "${newReport.name}" downloaded from Backendless`);
                    }
                }
                
                // Update local storage
                if (typeof DB.set === 'function') {
                    DB.set('reports', localReports);
                } else {
                    const existingReports = DB.get('reports') || [];
                    const existingIds = existingReports.map(r => r.objectId);
                    
                    localReports.forEach(report => {
                        if (report.objectId && !existingIds.includes(report.objectId)) {
                            DB.add('reports', report);
                        }
                    });
                }
            }
            
            console.log(`✅ Reports sync completed: ${synced} records processed`);
            return { synced, total: localReports.length };
        } catch (error) {
            console.error('❌ Reports sync failed:', error);
            throw error;
        }
    }

    /**
     * Sync Frequencies between local storage and Backendless
     */
    async syncFrequencies(direction = 'bidirectional') {
        console.log('⏰ Syncing frequencies...');
        
        try {
            const localFrequencies = DB.get('frequencies') || [];
            let backendlessFrequencies = [];
            
            try {
                backendlessFrequencies = await backendlessData.find('Frequencies');
                if (!Array.isArray(backendlessFrequencies)) {
                    backendlessFrequencies = [];
                }
            } catch (error) {
                console.warn('Could not fetch frequencies from Backendless:', error);
                backendlessFrequencies = [];
            }
            
            let synced = 0;
            
            if (direction === 'toBackendless' || direction === 'bidirectional') {
                // Upload local frequencies to Backendless
                for (const freq of localFrequencies) {
                    if (!freq.objectId) {
                        try {
                            const result = await backendlessData.create('Frequencies', {
                                name: freq.name,
                                description: freq.description || '',
                                localId: freq.id
                            });
                            
                            freq.objectId = result.objectId;
                            synced++;
                            console.log(`✅ Frequency "${freq.name}" synced to Backendless`);
                        } catch (error) {
                            console.error(`❌ Failed to sync frequency "${freq.name}":`, error);
                        }
                    }
                }
                
                if (typeof DB.set === 'function') {
                    DB.set('frequencies', localFrequencies);
                }
            }
            
            if (direction === 'fromBackendless' || direction === 'bidirectional') {
                // Download new frequencies from Backendless
                for (const backendFreq of backendlessFrequencies) {
                    const existingLocal = localFrequencies.find(f => f.objectId === backendFreq.objectId);
                    
                    if (!existingLocal) {
                        const newFrequency = {
                            id: Math.max(...localFrequencies.map(f => f.id || 0), 0) + 1,
                            name: backendFreq.name,
                            description: backendFreq.description || '',
                            objectId: backendFreq.objectId
                        };
                        
                        localFrequencies.push(newFrequency);
                        synced++;
                        console.log(`✅ Frequency "${newFrequency.name}" downloaded from Backendless`);
                    }
                }
                
                if (typeof DB.set === 'function') {
                    DB.set('frequencies', localFrequencies);
                }
            }
            
            console.log(`✅ Frequencies sync completed: ${synced} records processed`);
            return { synced, total: localFrequencies.length };
        } catch (error) {
            console.error('❌ Frequencies sync failed:', error);
            throw error;
        }
    }

    /**
     * Sync Formats between local storage and Backendless
     */
    async syncFormats(direction = 'bidirectional') {
        console.log('📝 Syncing formats...');
        
        try {
            const localFormats = DB.get('formats') || [];
            let backendlessFormats = [];
            
            try {
                backendlessFormats = await backendlessData.find('Formats');
                if (!Array.isArray(backendlessFormats)) {
                    backendlessFormats = [];
                }
            } catch (error) {
                console.warn('Could not fetch formats from Backendless:', error);
                backendlessFormats = [];
            }
            
            let synced = 0;
            
            if (direction === 'toBackendless' || direction === 'bidirectional') {
                // Upload local formats to Backendless
                for (const format of localFormats) {
                    if (!format.objectId) {
                        try {
                            const result = await backendlessData.create('Formats', {
                                name: format.name,
                                description: format.description || '',
                                extensions: JSON.stringify(format.extensions || []),
                                localId: format.id
                            });
                            
                            format.objectId = result.objectId;
                            synced++;
                            console.log(`✅ Format "${format.name}" synced to Backendless`);
                        } catch (error) {
                            console.error(`❌ Failed to sync format "${format.name}":`, error);
                        }
                    }
                }
                
                if (typeof DB.set === 'function') {
                    DB.set('formats', localFormats);
                }
            }
            
            if (direction === 'fromBackendless' || direction === 'bidirectional') {
                // Download new formats from Backendless
                for (const backendFormat of backendlessFormats) {
                    const existingLocal = localFormats.find(f => f.objectId === backendFormat.objectId);
                    
                    if (!existingLocal) {
                        const newFormat = {
                            id: Math.max(...localFormats.map(f => f.id || 0), 0) + 1,
                            name: backendFormat.name,
                            description: backendFormat.description || '',
                            extensions: JSON.parse(backendFormat.extensions || '[]'),
                            objectId: backendFormat.objectId
                        };
                        
                        localFormats.push(newFormat);
                        synced++;
                        console.log(`✅ Format "${newFormat.name}" downloaded from Backendless`);
                    }
                }
                
                if (typeof DB.set === 'function') {
                    DB.set('formats', localFormats);
                }
            }
            
            console.log(`✅ Formats sync completed: ${synced} records processed`);
            return { synced, total: localFormats.length };
        } catch (error) {
            console.error('❌ Formats sync failed:', error);
            throw error;
        }
    }

    /**
     * Upload file to Backendless and link to report
     */
    async uploadReportFile(reportId, file, notes = '') {
        try {
            console.log(`📤 Uploading file "${file.name}" for report ${reportId}`);
            
            // Generate unique filename
            const timestamp = Date.now();
            const fileName = `reports/${reportId}/${timestamp}_${file.name}`;
            
            // Upload file to Backendless
            const fileResult = await backendlessFiles.upload(file, fileName);
            
            // Create file record
            const fileRecord = {
                name: file.name,
                url: fileResult.fileURL,
                uploadDate: new Date().toISOString(),
                notes: notes,
                size: file.size,
                type: file.type,
                objectId: fileResult.objectId
            };
            
            // Update the report with the new file
            const report = DB.getById('reports', reportId);
            if (report) {
                if (!report.files) {
                    report.files = [];
                }
                report.files.push(fileRecord);
                
                // Update in local storage
                DB.update('reports', reportId, report);
                
                // Update in Backendless if the report has an objectId
                if (report.objectId) {
                    await backendlessData.update('Reports', report.objectId, {
                        files: JSON.stringify(report.files)
                    });
                }
                
                console.log(`✅ File "${file.name}" uploaded and linked to report`);
                return fileRecord;
            } else {
                throw new Error('Report not found');
            }
        } catch (error) {
            console.error('❌ File upload failed:', error);
            throw error;
        }
    }

    /**
     * Create new report with file upload
     */
    async createReport(reportData, files = []) {
        try {
            console.log('📄 Creating new report:', reportData.name);
            
            // Create report in Backendless first
            const backendResult = await backendlessData.create('Reports', {
                name: reportData.name,
                department: reportData.department,
                reportTypeId: reportData.reportTypeId,
                submitter: reportData.submitter,
                date: reportData.date,
                status: reportData.status || 'Pending',
                format: reportData.format,
                frequency: reportData.frequency,
                notes: reportData.notes || '',
                files: JSON.stringify([])
            });
            
            // Add to local storage
            const localReports = DB.get('reports') || [];
            const newReport = {
                id: Math.max(...localReports.map(r => r.id || 0), 0) + 1,
                ...reportData,
                files: [],
                objectId: backendResult.objectId
            };
            
            DB.add('reports', newReport);
            
            // Upload files if provided
            if (files && files.length > 0) {
                for (const file of files) {
                    await this.uploadReportFile(newReport.id, file.file, file.notes || '');
                }
            }
            
            console.log('✅ Report created successfully:', newReport);
            return newReport;
        } catch (error) {
            console.error('❌ Failed to create report:', error);
            throw error;
        }
    }

    /**
     * Get sync status for reports and storage
     */
    getSyncStatus() {
        return {
            isInitialized: this.isInitialized,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime,
            isConnected: this.isInitialized
        };
    }
}

// Create global instance
const reportsStorageIntegration = new ReportsStorageIntegration();