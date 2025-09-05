// Departments and Users Integration with Backendless
class DepartmentsUsersIntegration {
    constructor() {
        this.isInitialized = false;
        this.syncInProgress = false;
        this.lastSyncTime = null;
    }

    /**
     * Initialize departments and users integration
     */
    async init() {
        console.log('🚀 Initializing Departments and Users integration...');
        
        try {
            // Test connection with departments table
            await this.testConnection();
            
            this.isInitialized = true;
            console.log('✅ Departments and Users integration initialized');
            
            return true;
        } catch (error) {
            console.error('❌ Departments and Users integration failed:', error);
            return false;
        }
    }

    /**
     * Test Backendless connection with Departments table
     */
    async testConnection() {
        try {
            // Try to fetch a small amount of data from Departments table
            await backendlessData.find('Departments', null, ['name'], 1);
            console.log('✅ Departments table connection test passed');
            return true;
        } catch (error) {
            console.warn('⚠️ Departments table connection test failed:', error);
            throw error;
        }
    }

    /**
     * Sync departments and users with Backendless
     */
    async syncDepartmentsAndUsers(direction = 'bidirectional') {
        if (this.syncInProgress) {
            console.log('⚠️ Sync already in progress');
            return;
        }

        this.syncInProgress = true;
        console.log(`🔄 Starting ${direction} sync for departments and users...`);

        try {
            const results = {
                departments: await this.syncDepartments(direction),
                users: await this.syncUsers(direction)
            };

            this.lastSyncTime = new Date();
            console.log('✅ Departments and Users sync completed:', results);
            
            return results;
        } catch (error) {
            console.error('❌ Departments and Users sync failed:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync Departments between local storage and Backendless
     */
    async syncDepartments(direction = 'bidirectional') {
        console.log('🏢 Syncing departments...');
        
        try {
            const localDepartments = DB.get('departments') || [];
            let backendlessDepartments = [];
            
            try {
                backendlessDepartments = await backendlessData.find('Departments');
                if (!Array.isArray(backendlessDepartments)) {
                    backendlessDepartments = [];
                }
            } catch (error) {
                console.warn('Could not fetch departments from Backendless:', error);
                backendlessDepartments = [];
            }
            
            let synced = 0;
            
            if (direction === 'toBackendless' || direction === 'bidirectional') {
                // Upload local departments to Backendless
                for (const dept of localDepartments) {
                    if (!dept.objectId) {
                        try {
                            const result = await backendlessData.create('Departments', {
                                name: dept.name,
                                manager: dept.manager,
                                description: dept.description || '',
                                localId: dept.id
                            });
                            
                            // Update local record with objectId
                            dept.objectId = result.objectId;
                            synced++;
                            console.log(`✅ Department "${dept.name}" synced to Backendless`);
                        } catch (error) {
                            console.error(`❌ Failed to sync department "${dept.name}":`, error);
                        }
                    }
                }
                
                // Update local storage with objectIds
                if (typeof DB.set === 'function') {
                    DB.set('departments', localDepartments);
                } else {
                    // Fallback: update each department individually
                    console.warn('DB.set not available, using fallback method');
                    localDepartments.forEach(dept => {
                        if (dept.objectId && dept.id) {
                            DB.update('departments', dept.id, dept);
                        }
                    });
                }
            }
            
            if (direction === 'fromBackendless' || direction === 'bidirectional') {
                // Download new departments from Backendless
                for (const backendDept of backendlessDepartments) {
                    const existingLocal = localDepartments.find(d => d.objectId === backendDept.objectId);
                    
                    if (!existingLocal) {
                        const newDept = {
                            id: Math.max(...localDepartments.map(d => d.id || 0), 0) + 1,
                            name: backendDept.name,
                            manager: backendDept.manager,
                            description: backendDept.description || '',
                            objectId: backendDept.objectId,
                            reports: 0, // Default value
                            onTimeRate: 100 // Default value
                        };
                        
                        localDepartments.push(newDept);
                        synced++;
                        console.log(`✅ Department "${newDept.name}" downloaded from Backendless`);
                    }
                }
                
                // Update local storage
                if (typeof DB.set === 'function') {
                    DB.set('departments', localDepartments);
                } else {
                    // Fallback: add new departments individually
                    console.warn('DB.set not available, using fallback method');
                    const existingDepartments = DB.get('departments') || [];
                    const existingIds = existingDepartments.map(d => d.objectId);
                    
                    localDepartments.forEach(dept => {
                        if (dept.objectId && !existingIds.includes(dept.objectId)) {
                            DB.add('departments', dept);
                        }
                    });
                }
            }
            
            console.log(`✅ Departments sync completed: ${synced} records processed`);
            return { synced, total: localDepartments.length };
        } catch (error) {
            console.error('❌ Departments sync failed:', error);
            throw error;
        }
    }

    /**
     * Sync Users between local storage and Backendless
     */
    async syncUsers(direction = 'bidirectional') {
        console.log('👥 Syncing users...');
        
        try {
            const localUsers = DB.get('users') || [];
            let backendlessUsers = [];
            
            try {
                backendlessUsers = await backendlessData.find('Users');
                if (!Array.isArray(backendlessUsers)) {
                    backendlessUsers = [];
                }
            } catch (error) {
                console.warn('Could not fetch users from Backendless:', error);
                backendlessUsers = [];
            }
            
            let synced = 0;
            
            if (direction === 'toBackendless' || direction === 'bidirectional') {
                // Upload local users to Backendless (excluding sensitive data)
                for (const user of localUsers) {
                    if (!user.objectId && user.id !== 1) { // Skip default admin user
                        try {
                            const result = await backendlessData.create('Users', {
                                name: user.name,
                                email: user.email,
                                department: user.department,
                                role: user.role,
                                permissions: JSON.stringify(user.permissions || {}),
                                localId: user.id
                            });
                            
                            // Update local record with objectId
                            user.objectId = result.objectId;
                            synced++;
                            console.log(`✅ User "${user.name}" synced to Backendless`);
                        } catch (error) {
                            console.error(`❌ Failed to sync user "${user.name}":`, error);
                        }
                    }
                }
                
                // Update local storage with objectIds
                if (typeof DB.set === 'function') {
                    DB.set('users', localUsers);
                } else {
                    // Fallback: update each user individually
                    console.warn('DB.set not available, using fallback method');
                    localUsers.forEach(user => {
                        if (user.objectId && user.id) {
                            DB.update('users', user.id, user);
                        }
                    });
                }
            }
            
            if (direction === 'fromBackendless' || direction === 'bidirectional') {
                // Download new users from Backendless
                for (const backendUser of backendlessUsers) {
                    const existingLocal = localUsers.find(u => u.objectId === backendUser.objectId);
                    
                    if (!existingLocal) {
                        const newUser = {
                            id: Math.max(...localUsers.map(u => u.id || 0), 0) + 1,
                            name: backendUser.name,
                            email: backendUser.email,
                            department: backendUser.department,
                            role: backendUser.role,
                            permissions: JSON.parse(backendUser.permissions || '{}'),
                            objectId: backendUser.objectId
                        };
                        
                        localUsers.push(newUser);
                        synced++;
                        console.log(`✅ User "${newUser.name}" downloaded from Backendless`);
                    }
                }
                
                // Update local storage
                if (typeof DB.set === 'function') {
                    DB.set('users', localUsers);
                } else {
                    // Fallback: add new users individually
                    console.warn('DB.set not available, using fallback method');
                    const existingUsers = DB.get('users') || [];
                    const existingIds = existingUsers.map(u => u.objectId);
                    
                    localUsers.forEach(user => {
                        if (user.objectId && !existingIds.includes(user.objectId)) {
                            DB.add('users', user);
                        }
                    });
                }
            }
            
            console.log(`✅ Users sync completed: ${synced} records processed`);
            return { synced, total: localUsers.length };
        } catch (error) {
            console.error('❌ Users sync failed:', error);
            throw error;
        }
    }

    /**
     * Create new department in both local and Backendless
     */
    async createDepartment(departmentData) {
        try {
            console.log('🏢 Creating new department:', departmentData.name);
            
            // Create in Backendless first
            const backendResult = await backendlessData.create('Departments', {
                name: departmentData.name,
                manager: departmentData.manager,
                description: departmentData.description || ''
            });
            
            // Add to local storage
            const localDepartments = DB.get('departments') || [];
            const newDept = {
                id: Math.max(...localDepartments.map(d => d.id || 0), 0) + 1,
                name: departmentData.name,
                manager: departmentData.manager,
                description: departmentData.description || '',
                reports: 0,
                onTimeRate: 100,
                objectId: backendResult.objectId
            };
            
            localDepartments.push(newDept);
            DB.set('departments', localDepartments);
            
            console.log('✅ Department created successfully:', newDept);
            return newDept;
        } catch (error) {
            console.error('❌ Failed to create department:', error);
            throw error;
        }
    }

    /**
     * Update department in both local and Backendless
     */
    async updateDepartment(departmentId, updateData) {
        try {
            console.log('🏢 Updating department:', departmentId);
            
            const localDepartments = DB.get('departments') || [];
            const dept = localDepartments.find(d => d.id == departmentId);
            
            if (!dept) {
                throw new Error('Department not found locally');
            }
            
            // Update in Backendless if it has an objectId
            if (dept.objectId) {
                await backendlessData.update('Departments', dept.objectId, updateData);
            }
            
            // Update local storage
            Object.assign(dept, updateData);
            DB.set('departments', localDepartments);
            
            console.log('✅ Department updated successfully:', dept);
            return dept;
        } catch (error) {
            console.error('❌ Failed to update department:', error);
            throw error;
        }
    }

    /**
     * Delete department from both local and Backendless
     */
    async deleteDepartment(departmentId) {
        try {
            console.log('🗑️ Deleting department:', departmentId);
            
            const localDepartments = DB.get('departments') || [];
            const dept = localDepartments.find(d => d.id == departmentId);
            
            if (!dept) {
                throw new Error('Department not found locally');
            }
            
            // Delete from Backendless if it has an objectId
            if (dept.objectId) {
                await backendlessData.delete('Departments', dept.objectId);
            }
            
            // Remove from local storage
            const filteredDepartments = localDepartments.filter(d => d.id != departmentId);
            DB.set('departments', filteredDepartments);
            
            console.log('✅ Department deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to delete department:', error);
            throw error;
        }
    }

    /**
     * Get sync status for departments and users
     */
    getSyncStatus() {
        return {
            isInitialized: this.isInitialized,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime,
            isConnected: this.isInitialized
        };
    }

    /**
     * Manual sync trigger for departments only
     */
    async syncDepartmentsOnly(direction = 'bidirectional') {
        if (this.syncInProgress) {
            console.log('⚠️ Sync already in progress');
            return;
        }

        this.syncInProgress = true;
        console.log(`🔄 Starting ${direction} sync for departments only...`);

        try {
            const result = await this.syncDepartments(direction);
            this.lastSyncTime = new Date();
            console.log('✅ Departments sync completed:', result);
            return result;
        } catch (error) {
            console.error('❌ Departments sync failed:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Manual sync trigger for users only
     */
    async syncUsersOnly(direction = 'bidirectional') {
        if (this.syncInProgress) {
            console.log('⚠️ Sync already in progress');
            return;
        }

        this.syncInProgress = true;
        console.log(`🔄 Starting ${direction} sync for users only...`);

        try {
            const result = await this.syncUsers(direction);
            this.lastSyncTime = new Date();
            console.log('✅ Users sync completed:', result);
            return result;
        } catch (error) {
            console.error('❌ Users sync failed:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }
}

// Create global instance
const departmentsUsersIntegration = new DepartmentsUsersIntegration();