// Calendar functionality
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.currentView = 'month';
        this.selectedDepartment = null;
        this.selectedTaskType = null;
        this.events = [];
        this.plannedEvents = [];
        this.scorecardTasks = [];
        this.generatedMonths = []; // Track which months have been generated
        
        this.init();
    }
    
    async init() {
        console.log('=== Calendar Initialization ===');
        
        // Check current user at initialization
        const currentUser = this.getCurrentUser();
        console.log('Current user at calendar init:', currentUser);
        
        if (currentUser) {
            console.log(`User: ${currentUser.name}, Role: ${currentUser.role}, Department: ${currentUser.department}`);
            if (currentUser.departments) {
                console.log('Additional departments:', currentUser.departments);
            }
            if (currentUser.permissions) {
                console.log('Permissions:', currentUser.permissions);
            }
        } else {
            console.log('No current user detected');
        }
        
        await this.loadEvents();
        await this.generatePlannedReports();
        // Clear any existing scorecard tasks to prevent duplication
        this.clearScorecardTasks();
        // Generate tasks for current month only (performance optimization)
        await this.generateTasksForMonth(this.currentDate.getMonth() + 1, this.currentDate.getFullYear());
        this.setupEventListeners();
        this.renderCalendar();
        this.populateDepartmentFilter();
        
        console.log('=== Calendar Initialization Complete ===');
    }
    
    async loadEvents() {
        try {
            // Try to load from Supabase first, fallback to local data
            let reports = [];
            
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    reports = await supabaseDataService.getReports();
                    console.log('Loaded reports from Supabase:', reports.length);
                } catch (error) {
                    console.warn('Failed to load reports from Supabase, using local data:', error);
                    reports = DB.get('reports') || [];
                }
            } else {
                reports = DB.get('reports') || [];
            }
            
            // Load report types first
            let reportTypes = [];
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    reportTypes = await supabaseDataService.getReportTypes();
                } catch (error) {
                    console.warn('Failed to load report types from Supabase:', error);
                    reportTypes = DB.get('reportTypes') || [];
                }
            } else {
                reportTypes = DB.get('reportTypes') || [];
            }
            
            this.events = reports.map(report => {
                // Find report type by ID
                const reportType = reportTypes.find(rt => rt.id === (report.report_type_id || report.reportTypeId));
                
                return {
                    id: report.id,
                    title: reportType ? reportType.name : report.name,
                    department: report.department,
                    date: report.date,
                    status: report.status,
                    assigned: report.submitter,
                    type: 'report',
                    reportTypeId: report.report_type_id || report.reportTypeId,
                    reportUrl: report.report_url || report.url, // Add report URL
                    isSubmitted: true,
                    taskType: 'reports'
                };
            });
        } catch (error) {
            console.error('Error loading events:', error);
            this.events = [];
        }
    }
    
    async generatePlannedReports() {
        try {
            // Try to load from Supabase first, fallback to local data
            let reportTypes = [];
            
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    reportTypes = await supabaseDataService.getReportTypes();
                    console.log('Loaded report types from Supabase:', reportTypes.length);
                } catch (error) {
                    console.warn('Failed to load report types from Supabase, using local data:', error);
                    reportTypes = DB.get('reportTypes') || [];
                }
            } else {
                reportTypes = DB.get('reportTypes') || [];
            }
            
            const currentDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3); // Plan 3 months ahead
            
            reportTypes.forEach(reportType => {
                // Get the last submitted report for this report type
                const lastSubmittedReport = this.events
                    .filter(event => event.reportTypeId === reportType.id && event.isSubmitted)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                
                // Calculate planned dates based on the last submission date
                const plannedDates = this.calculatePlannedDatesFromLastSubmission(reportType, lastSubmittedReport, currentDate, endDate);
                
                plannedDates.forEach(date => {
                    // Check if there's already a submitted report for this date and report type
                    const existingReport = this.events.find(event => 
                        event.reportTypeId === reportType.id && 
                        event.date === date.toISOString().split('T')[0] &&
                        event.isSubmitted
                    );
                    
                    // Check if there's already a planned event for this date and report type
                    const existingPlannedEvent = this.plannedEvents.find(event => 
                        event.reportTypeId === reportType.id && 
                        event.date === date.toISOString().split('T')[0]
                    );
                    
                    if (!existingReport && !existingPlannedEvent) {
                        this.plannedEvents.push({
                            id: `planned_${reportType.id}_${date.toISOString().split('T')[0]}`,
                            title: reportType.name,
                            department: reportType.department,
                            date: date.toISOString().split('T')[0],
                            status: 'Planned',
                            assigned: this.getResponsiblePerson(reportType.department),
                            type: 'planned_report',
                            reportTypeId: reportType.id,
                            frequency: reportType.frequency,
                            format: reportType.format,
                            taskType: 'reports'
                        });
                    }
                });
            });
        } catch (error) {
            console.error('Error generating planned reports:', error);
        }
    }
    
    calculatePlannedDates(reportType, startDate, endDate) {
        const dates = [];
        const currentDate = new Date(startDate);
        
        // Get the next due date based on frequency
        let nextDueDate = this.getNextDueDate(reportType.frequency, currentDate);
        
        while (nextDueDate <= endDate) {
            dates.push(new Date(nextDueDate));
            nextDueDate = this.getNextDueDate(reportType.frequency, nextDueDate);
        }
        
        return dates;
    }
    
    calculatePlannedDatesFromLastSubmission(reportType, lastSubmittedReport, currentDate, endDate) {
        const dates = [];
        
        if (!lastSubmittedReport) {
            // If no previous submission, start from current date
            console.log(`No previous submission found for ${reportType.name}, starting from current date`);
            return this.calculatePlannedDates(reportType, currentDate, endDate);
        }
        
        // Get the last submission date
        const lastSubmissionDate = new Date(lastSubmittedReport.date);
        console.log(`Last submission for ${reportType.name}: ${lastSubmissionDate.toISOString().split('T')[0]}`);
        
        // Calculate the next due date based on the last submission
        let nextDueDate = this.getNextDueDate(reportType.frequency, lastSubmissionDate);
        
        // Only include dates that are in the future and within our planning window
        while (nextDueDate <= endDate) {
            // Only add if it's in the future (not in the past)
            if (nextDueDate > currentDate) {
                dates.push(new Date(nextDueDate));
            }
            nextDueDate = this.getNextDueDate(reportType.frequency, nextDueDate);
        }
        
        console.log(`Generated ${dates.length} planned dates for ${reportType.name} based on last submission`);
        return dates;
    }
    
    getNextDueDate(frequency, fromDate) {
        const date = new Date(fromDate);
        
        switch (frequency.toLowerCase()) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'annually':
                date.setFullYear(date.getFullYear() + 1);
                break;
            default:
                date.setDate(date.getDate() + 1);
        }
        
        return date;
    }
    
    async generateScorecardTasks() {
        try {
            // Try to load from Supabase first, fallback to local data
            let scorecards = [], users = [], departments = [], scorecardAssignments = [];
            
            if (typeof supabaseDataService !== 'undefined') {
                console.log('Supabase service is available, attempting to load data...');
                console.log('Supabase service object:', supabaseDataService);
                console.log('Supabase service initialized:', supabaseDataService.initialized);
                try {
                    await supabaseDataService.init();
                    console.log('Supabase service initialized successfully');
                    
                    // Load all data in parallel
                    console.log('Loading data from Supabase...');
                    [scorecards, users, departments, scorecardAssignments] = await Promise.all([
                        supabaseDataService.getScorecards(),
                        supabaseDataService.getUsers(),
                        supabaseDataService.getDepartments(),
                        supabaseDataService.getScorecardAssignments()
                    ]);
                    
                    console.log('Loaded from Supabase:', {
                        scorecards: scorecards.length,
                        users: users.length,
                        departments: departments.length,
                        assignments: scorecardAssignments.length
                    });
                    
                    // Debug: Log the actual scorecard data
                    console.log('Scorecards from Supabase:', scorecards);
                    console.log('Users from Supabase:', users);
                    console.log('Departments from Supabase:', departments);
                    console.log('Assignments from Supabase:', scorecardAssignments);
                    
                    // Check if we have the new scorecards
                    const newScorecards = scorecards.filter(s => s.name === 'Test 1' || s.name === 'tset2' || s.name === 'test 3');
                    console.log('New scorecards found:', newScorecards);
                } catch (error) {
                    console.warn('Failed to load from Supabase, using local data:', error);
                    scorecards = DB.get('scorecards') || [];
                    users = DB.get('users') || [];
                    departments = DB.get('departments') || [];
                    scorecardAssignments = DB.get('scorecard_assignments') || [];
                    
                    console.log('Using local data as fallback:', {
                        scorecards: scorecards.length,
                        users: users.length,
                        departments: departments.length,
                        assignments: scorecardAssignments.length
                    });
                    
                    // Check if we have the new scorecards in local data
                    const newScorecardsLocal = scorecards.filter(s => s.name === 'Test 1' || s.name === 'tset2' || s.name === 'test 3');
                    console.log('New scorecards in local data:', newScorecardsLocal);
                }
            } else {
                scorecards = DB.get('scorecards') || [];
                users = DB.get('users') || [];
                departments = DB.get('departments') || [];
                scorecardAssignments = DB.get('scorecard_assignments') || [];
                
                console.log('Supabase service not available, using local data:', {
                    scorecards: scorecards.length,
                    users: users.length,
                    departments: departments.length,
                    assignments: scorecardAssignments.length
                });
                
                // Check if we have the new scorecards in local data
                const newScorecardsLocal = scorecards.filter(s => s.name === 'Test 1' || s.name === 'tset2' || s.name === 'test 3');
                console.log('New scorecards in local data (no Supabase):', newScorecardsLocal);
            }
            
            // Generate tasks for current month only (performance optimization)
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            
            console.log('Generating tasks for current month only:', { currentMonth, currentYear });
            
            // Only process current month to avoid duplication and improve performance
            const actualMonth = currentMonth;
            const targetYear = currentYear;
            
            console.log(`Processing month ${actualMonth}/${targetYear}`);
                
                for (const scorecard of scorecards) {
                    console.log(`Processing scorecard: ${scorecard.name} (ID: ${scorecard.id})`);
                    
                    // PRIORITY 1: Check if scorecard has responsible_person directly (primary method)
                    let responsibleUser = null;
                    let assignment = null;
                    
                    if (scorecard.responsible_person) {
                        console.log(`Scorecard has responsible_person: ${scorecard.responsible_person}`);
                        
                        // Find user by responsible_person name
                        responsibleUser = users.find(user => user.name === scorecard.responsible_person);
                        console.log(`Looking for user by name: ${scorecard.responsible_person}`, responsibleUser);
                        
                        if (responsibleUser) {
                            // Create a virtual assignment using the responsible_person
                            assignment = {
                                scorecard_id: scorecard.id,
                                user_id: responsibleUser.id,
                                department: scorecard.department,
                                is_active: true
                            };
                        }
                    }
                    
                    // PRIORITY 2: Fallback to scorecard_assignments table (if no responsible_person)
                    if (!responsibleUser && scorecardAssignments.length > 0) {
                        console.log('No responsible_person found, checking scorecard_assignments table...');
                        
                        assignment = scorecardAssignments.find(assignment => 
                            assignment.scorecard_id === scorecard.id && 
                            assignment.is_active
                        );
                        
                        console.log(`Found assignment in assignments table:`, assignment);
                        
                        if (assignment && assignment.user_id) {
                            // Fix: Map assignment user_id (1,2,3) to user by index (0,1,2)
                            // Since assignment.user_id is 1-based and array is 0-based, subtract 1
                            const userIndex = assignment.user_id - 1;
                            responsibleUser = users[userIndex];
                            
                            // Fallback: Try with string conversion if index mapping fails
                            if (!responsibleUser) {
                                responsibleUser = users.find(user => String(user.id) === String(assignment.user_id));
                            }
                        }
                    }
                    
                    if (responsibleUser) {
                        console.log(`Using responsible user: ${responsibleUser.name} (${responsibleUser.department})`);
                        
                        // A. Fill task for responsible person (goes to responsible person's department)
                        const taskDate = this.getScorecardDueDate(actualMonth, targetYear);
                        const isPast = new Date(taskDate) < new Date();
                        
                        const fillTask = {
                            id: `scorecard_fill_${scorecard.id}_${responsibleUser.id}_${actualMonth}_${targetYear}`,
                            title: `Fill ${scorecard.name}`,
                            department: responsibleUser.department, // Use responsible person's department
                            date: taskDate,
                            status: isPast ? 'Late' : 'Pending',
                            assigned: responsibleUser.name,
                            type: 'scorecard_fill',
                            scorecardId: scorecard.id,
                            responsibleUserId: responsibleUser.id,
                            description: scorecard.description,
                            taskType: 'scorecards',
                            periodMonth: actualMonth,
                            periodYear: targetYear
                        };
                        
                        this.scorecardTasks.push(fillTask);
                        console.log(`Created fill task:`, fillTask);
                        
                        // B. Submit task for department manager (use scorecard's department, not user's department)
                        const departmentManager = await this.getResponsiblePerson(scorecard.department);
                        if (departmentManager && departmentManager !== 'Unassigned') {
                            const taskDate = this.getScorecardDueDate(actualMonth, targetYear, 2); // 2 days after fill
                            const isPast = new Date(taskDate) < new Date();
                            
                            this.scorecardTasks.push({
                                id: `scorecard_submit_${scorecard.id}_${departmentManager}_${actualMonth}_${targetYear}`,
                                title: `Submit ${scorecard.name}`,
                                department: scorecard.department, // Use scorecard's department field
                                date: taskDate,
                                status: isPast ? 'Late' : 'Pending',
                                assigned: departmentManager,
                                type: 'scorecard_submit',
                                scorecardId: scorecard.id,
                                managerName: departmentManager,
                                description: `Review and submit ${scorecard.name}`,
                                taskType: 'scorecards',
                                periodMonth: actualMonth,
                                periodYear: targetYear
                            });
                        }
                        
                        // C. Approve task for HR department (not a specific person)
                        const hrDepartment = departments.find(dept => dept.name === 'HR');
                        console.log(`Found HR department:`, hrDepartment);
                        
                        if (hrDepartment) {
                            const taskDate = this.getScorecardDueDate(actualMonth, targetYear, 5); // 5 days after submit
                            const isPast = new Date(taskDate) < new Date();
                            
                            const approveTask = {
                                id: `scorecard_approve_${scorecard.id}_hr_${actualMonth}_${targetYear}`,
                                title: `Approve ${scorecard.name}`,
                                department: 'HR', // Use HR department
                                date: taskDate,
                                status: isPast ? 'Late' : 'Pending',
                                assigned: 'HR Department', // Generic assignment to HR department
                                type: 'scorecard_approve',
                                scorecardId: scorecard.id,
                                description: `Final review and approval of ${scorecard.name}`,
                                taskType: 'scorecards',
                                periodMonth: actualMonth,
                                periodYear: targetYear
                            };
                            
                            this.scorecardTasks.push(approveTask);
                            console.log(`Created approve task:`, approveTask);
                        }
                    } else {
                        console.log(`No responsible user found for scorecard: ${scorecard.name}`);
                    }
                }
        } catch (error) {
            console.error('Error generating scorecard tasks:', error);
        }
        
        console.log(`Total scorecard tasks generated: ${this.scorecardTasks.length}`);
        console.log('Sample tasks:', this.scorecardTasks.slice(0, 3));
    }
    
    getScorecardDueDate(month, year, daysOffset = 0) {
        const date = new Date(year, month - 1, 15); // Due on 15th of each month
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    }
    
    async generateTasksForMonth(month, year) {
        // Check if tasks for this month are already generated
        const monthKey = `${month}-${year}`;
        if (this.generatedMonths && this.generatedMonths.includes(monthKey)) {
            console.log(`Tasks for ${month}/${year} already generated, skipping...`);
            return;
        }
        
        console.log(`Generating tasks for month ${month}/${year}...`);
        
        // Initialize generatedMonths array if not exists
        if (!this.generatedMonths) {
            this.generatedMonths = [];
        }
        
        // Add this month to generated list
        this.generatedMonths.push(monthKey);
        
        // Generate tasks for this specific month
        await this.generateScorecardTasksForMonth(month, year);
    }
    
    clearScorecardTasks() {
        // Remove all scorecard tasks to prevent duplication
        this.scorecardTasks = [];
        console.log('Cleared all scorecard tasks');
    }
    
    async generateScorecardTasksForMonth(month, year) {
        try {
            let scorecards = [], users = [], departments = [], scorecardResults = [];
            
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    [scorecards, users, departments, scorecardResults] = await Promise.all([
                        supabaseDataService.getScorecards(),
                        supabaseDataService.getUsers(),
                        supabaseDataService.getDepartments(),
                        supabaseDataService.getScorecardResults()
                    ]);
                } catch (error) {
                    console.warn('Failed to load from Supabase, using local data:', error);
                    scorecards = DB.get('scorecards') || [];
                    users = DB.get('users') || [];
                    departments = DB.get('departments') || [];
                    scorecardResults = DB.get('scorecard_results') || [];
                }
            } else {
                scorecards = DB.get('scorecards') || [];
                users = DB.get('users') || [];
                departments = DB.get('departments') || [];
                scorecardResults = DB.get('scorecard_results') || [];
            }
            
            for (const scorecard of scorecards) {
                let responsibleUser = null;
                
                if (scorecard.responsible_person) {
                    responsibleUser = users.find(user => user.name === scorecard.responsible_person);
                }
                
                if (responsibleUser) {
                    console.log(`👤 Responsible user for scorecard ${scorecard.id}:`, {
                        id: responsibleUser.id,
                        name: responsibleUser.name,
                        department: responsibleUser.department,
                        idType: typeof responsibleUser.id
                    });
                    
                    // Check if user has permission to see this scorecard
                    const canEnter = this.canEnterKpiValues(scorecard);
                    const canSubmit = this.canSubmitScorecard(scorecard);
                    const canApprove = this.canApproveScorecard(scorecard);
                    
                    console.log(`🔐 Permissions for scorecard ${scorecard.name}:`, { canEnter, canSubmit, canApprove });
                    
                    // Only create tasks if user has any relevant permissions
                    if (!canEnter && !canSubmit && !canApprove) {
                        console.log(`❌ User has no permissions for scorecard ${scorecard.name}, skipping tasks`);
                        continue;
                    }
                    
                    // A. Fill task - only if user can enter KPI values
                    if (canEnter) {
                        const taskDate = this.getScorecardDueDate(month, year);
                        const fillTaskStatus = this.getScorecardTaskStatus(scorecard.id, responsibleUser.id, month, year, 'fill', scorecardResults);
                        
                        const fillTaskId = `scorecard_fill_${scorecard.id}_${responsibleUser.id}_${month}_${year}`;
                        
                        // Check if this task already exists to prevent duplication
                        if (!this.scorecardTasks.find(task => task.id === fillTaskId)) {
                            const fillTask = {
                                id: fillTaskId,
                                title: `Fill ${scorecard.name}`,
                                department: responsibleUser.department,
                                date: taskDate,
                                status: fillTaskStatus,
                                assigned: responsibleUser.name,
                                type: 'scorecard_fill',
                                scorecardId: scorecard.id,
                                responsibleUserId: responsibleUser.id,
                                description: scorecard.description,
                                taskType: 'scorecards',
                                periodMonth: month,
                                periodYear: year
                            };
                            
                            this.scorecardTasks.push(fillTask);
                            console.log(`Created fill task: ${fillTask.title} with status: ${fillTaskStatus}`);
                        } else {
                            console.log(`Fill task already exists: ${fillTaskId}`);
                        }
                    }
                    
                    // B. Submit task - always create for department manager (regardless of current user)
                    const departmentManager = await this.getResponsiblePerson(scorecard.department);
                    if (departmentManager && departmentManager !== 'Unassigned') {
                        const submitTaskDate = this.getScorecardDueDate(month, year, 2);
                        const submitTaskStatus = this.getScorecardTaskStatus(scorecard.id, responsibleUser.id, month, year, 'submit', scorecardResults);
                        
                        const submitTaskId = `scorecard_submit_${scorecard.id}_${departmentManager}_${month}_${year}`;
                        
                        // Check if this task already exists to prevent duplication
                        if (!this.scorecardTasks.find(task => task.id === submitTaskId)) {
                            this.scorecardTasks.push({
                                id: submitTaskId,
                                title: `Submit ${scorecard.name}`,
                                department: scorecard.department,
                                date: submitTaskDate,
                                status: submitTaskStatus,
                                assigned: departmentManager,
                                type: 'scorecard_submit',
                                scorecardId: scorecard.id,
                                managerName: departmentManager,
                                description: `Review and submit ${scorecard.name}`,
                                taskType: 'scorecards',
                                periodMonth: month,
                                periodYear: year
                            });
                            console.log(`Created submit task: Submit ${scorecard.name} with status: ${submitTaskStatus}`);
                        } else {
                            console.log(`Submit task already exists: ${submitTaskId}`);
                        }
                    }
                    
                    // C. Approve task - always create for HR Manager (regardless of current user)
                    const hrDepartment = departments.find(dept => dept.name === 'HR');
                    if (hrDepartment) {
                        const approveTaskDate = this.getScorecardDueDate(month, year, 5);
                        const approveTaskStatus = this.getScorecardTaskStatus(scorecard.id, responsibleUser.id, month, year, 'approve', scorecardResults);
                        
                        const approveTaskId = `scorecard_approve_${scorecard.id}_hr_${month}_${year}`;
                        
                        // Check if this task already exists to prevent duplication
                        if (!this.scorecardTasks.find(task => task.id === approveTaskId)) {
                            this.scorecardTasks.push({
                                id: approveTaskId,
                                title: `Approve ${scorecard.name}`,
                                department: 'HR',
                                date: approveTaskDate,
                                status: approveTaskStatus,
                                assigned: 'HR Department',
                                type: 'scorecard_approve',
                                scorecardId: scorecard.id,
                                description: `Final review and approval of ${scorecard.name}`,
                                taskType: 'scorecards',
                                periodMonth: month,
                                periodYear: year
                            });
                            console.log(`Created approve task: Approve ${scorecard.name} with status: ${approveTaskStatus}`);
                        } else {
                            console.log(`Approve task already exists: ${approveTaskId}`);
                        }
                    }
                }
            }
            
            console.log(`Generated ${scorecards.length * 3} tasks for ${month}/${year}`);
        } catch (error) {
            console.error('Error generating tasks for month:', error);
        }
    }
    
    async getResponsiblePerson(department) {
        try {
            let departments = [];
            
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    departments = await supabaseDataService.getDepartments();
                } catch (error) {
                    console.warn('Failed to load departments from Supabase, using local data:', error);
                    departments = DB.get('departments') || [];
                }
            } else {
                departments = DB.get('departments') || [];
            }
            
            const dept = departments.find(d => d.name === department);
            return dept ? dept.manager : 'Unassigned';
        } catch (error) {
            console.error('Error getting responsible person:', error);
            return 'Unassigned';
        }
    }

    getScorecardTaskStatus(scorecardId, userId, month, year, taskType, scorecardResults) {
        console.log(`🔍 Looking for scorecard result:`, {
            scorecardId,
            userId,
            month,
            year,
            taskType,
            totalResults: scorecardResults.length
        });
        
        // Debug: Show first few results to understand data structure
        if (scorecardResults.length > 0) {
            console.log(`📊 Sample scorecard results:`, scorecardResults.slice(0, 3));
        }
        
        // Use the same logic as kpi-data-entry.html: find by scorecard + period only
        // This handles both UUID/integer mismatch and the fact that scorecard results
        // are typically associated with the scorecard, not specific users
        const result = scorecardResults.find(r => 
            r.scorecard_id === scorecardId && 
            r.period_month === month && 
            r.period_year === year
        );

        if (!result) {
            console.log(`❌ No scorecard result found for: scorecardId=${scorecardId}, month=${month}, year=${year}`);
            // No result exists yet - task is pending
            return 'Pending';
        }

        console.log(`✅ Found scorecard result:`, result);
        
        // Handle missing status column - if status doesn't exist, infer from submitted_at
        let status = result.status;
        if (!status && result.submitted_at) {
            // If no status column but has submitted_at, consider it submitted
            status = 'submitted';
            console.log(`📝 Inferred status 'submitted' from submitted_at timestamp`);
        } else if (!status) {
            // If no status and no submitted_at, consider it draft
            status = 'draft';
            console.log(`📝 No status found, defaulting to 'draft'`);
        }
        
        // Map the database status to calendar display status
        switch (status) {
            case 'draft':
                return 'Pending';
            case 'submitted':
                return 'Submitted';
            case 'approved':
                return 'Approved';
            default:
                return 'Pending';
        }
    }

    // Permission checking functions (copied from kpi-data-entry.html)
    canEnterKpiValues(scorecard) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !scorecard) return false;
        
        console.log('🔐 Checking KPI entry permissions for user:', currentUser.name, 'role:', currentUser.role);
        console.log('📊 Scorecard:', scorecard.name, 'department:', scorecard.department, 'responsible:', scorecard.responsible_person);
        
        // 1. User added to scorecard in scorecard setup (responsible_person)
        if (scorecard.responsible_person === currentUser.name) {
            console.log('✅ User is responsible person for this scorecard');
            return true;
        }
        
        // 2. Department Manager of the department setup on the scorecards
        if (currentUser.role === 'Manager') {
            let departments = [];
            // Use local DB for departments since this is called synchronously
            departments = DB.get('departments') || [];
            
            const department = departments.find(dept => dept.name === scorecard.department);
            console.log('🔍 Checking department:', department);
            if (department && department.manager) {
                // Check for exact match or partial match (first name)
                const managerName = department.manager.toLowerCase();
                const userName = currentUser.name.toLowerCase();
                const userNameParts = userName.split(' ');
                const managerNameParts = managerName.split(' ');
                
                // Check exact match
                if (managerName === userName) {
                    console.log('✅ User is department manager for this scorecard (exact match)');
                    return true;
                }
                
                // Check first name match
                if (userNameParts[0] === managerNameParts[0]) {
                    console.log('✅ User is department manager for this scorecard (first name match)');
                    return true;
                }
                
                // Check if user's name is contained in manager name or vice versa
                if (managerName.includes(userName) || userName.includes(managerName)) {
                    console.log('✅ User is department manager for this scorecard (partial match)');
                    return true;
                }
            }
        }
        
        // 3. HR Manager - can view all scorecards
        if (currentUser.role === 'HR Manager') {
            console.log('✅ User is HR manager, can view all scorecards');
            return true;
        }
        
        // 3.5. Special case: Users who manage HR department should be treated as HR Manager
        if (currentUser.role === 'Manager' && currentUser.department === 'HR') {
            console.log('✅ User is HR department manager, treating as HR Manager');
            return true;
        }
        
        // 4. Admin - can view all scorecards
        if (currentUser.role === 'Admin') {
            console.log('✅ User is admin, can view all scorecards');
            return true;
        }
        
        console.log('❌ User does not have permission to enter KPI values');
        return false;
    }

    canSubmitScorecard(scorecard) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !scorecard) return false;
        
        console.log('🔐 Checking submit permissions for user:', currentUser.name, 'role:', currentUser.role);
        
        // Only Department Manager of the department added to scorecard in settings
        if (currentUser.role === 'Manager') {
            let departments = [];
            // Use local DB for departments since this is called synchronously
            departments = DB.get('departments') || [];
            
            const department = departments.find(dept => dept.name === scorecard.department);
            console.log('🔍 Checking department for submit:', department);
            if (department && department.manager) {
                // Check for exact match or partial match (first name)
                const managerName = department.manager.toLowerCase();
                const userName = currentUser.name.toLowerCase();
                const userNameParts = userName.split(' ');
                const managerNameParts = managerName.split(' ');
                
                // Check exact match
                if (managerName === userName) {
                    console.log('✅ User is department manager, can submit scorecard (exact match)');
                    return true;
                }
                
                // Check first name match
                if (userNameParts[0] === managerNameParts[0]) {
                    console.log('✅ User is department manager, can submit scorecard (first name match)');
                    return true;
                }
                
                // Check if user's name is contained in manager name or vice versa
                if (managerName.includes(userName) || userName.includes(managerName)) {
                    console.log('✅ User is department manager, can submit scorecard (partial match)');
                    return true;
                }
            }
        }
        
        // Responsible person can also submit their own scorecard
        if (scorecard.responsible_person === currentUser.name) {
            console.log('✅ User is responsible person, can submit scorecard');
            return true;
        }
        
        // Admin can submit any scorecard
        if (currentUser.role === 'Admin') {
            console.log('✅ User is admin, can submit any scorecard');
            return true;
        }
        
        console.log('❌ User does not have permission to submit scorecard');
        return false;
    }

    canApproveScorecard(scorecard) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !scorecard) return false;
        
        console.log('🔐 Checking approval permissions for user:', currentUser.name, 'role:', currentUser.role);
        
        // Only HR Manager can approve all scorecards
        if (currentUser.role === 'HR Manager') {
            console.log('✅ User is HR manager, can approve scorecard');
            return true;
        }
        
        // Special case: Users who manage HR department should be treated as HR Manager
        if (currentUser.role === 'Manager' && currentUser.department === 'HR') {
            console.log('✅ User is HR department manager, can approve scorecard');
            return true;
        }
        
        console.log('❌ User does not have permission to approve scorecard');
        return false;
    }

    isScorecardLocked(scorecardResult) {
        if (!scorecardResult) return false;
        
        // Scorecard is locked if it's approved OR submitted (users can't edit submitted scorecards)
        const isLocked = scorecardResult.status === 'approved' || scorecardResult.status === 'submitted';
        console.log('🔒 Scorecard locked status:', isLocked, 'Status:', scorecardResult.status);
        return isLocked;
    }
    
    /**
     * Convert UUID user ID to integer for scorecard_results table
     * @param {string} userId - UUID user ID
     * @returns {number} Integer user ID
     */
    convertUserIdToInteger(userId) {
        if (!userId) {
            console.log('No user ID provided, using default user ID: 1');
            return 1; // Default to admin user
        }
        
        if (typeof userId === 'number') {
            console.log('User ID is already an integer:', userId);
            return userId;
        }
        
        if (typeof userId === 'string') {
            // Check if it's already a numeric string
            if (!isNaN(parseInt(userId))) {
                const intUserId = parseInt(userId);
                console.log('Converted numeric string user ID to integer:', intUserId);
                return intUserId;
            }
            
            // It's a UUID - we need to convert it to an integer
            // For now, we'll use a hash-based approach or default to user ID 1
            console.log('UUID user ID detected:', userId);
            console.log('Converting UUID to integer user ID: 1 (default)');
            return 1; // Default to admin user for now
        }
        
        console.log('Unknown user ID type, using default user ID: 1');
        return 1; // Default to admin user
    }
    
    setupEventListeners() {
        // Prevent duplicate event listeners
        if (this.eventListenersSetup) {
            console.log('Event listeners already setup, skipping...');
            return;
        }
        
        console.log('Setting up event listeners...');
        
        // Calendar navigation
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                console.log('Previous month clicked');
                this.navigateMonth(-1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('Next month clicked');
                this.navigateMonth(1);
            });
        }
        
        // View controls
        document.querySelectorAll('.view-controls .action-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setView(e.target.dataset.view);
            });
        });
        
        // Department filter
        document.getElementById('department-filter')?.addEventListener('change', (e) => {
            this.filterByDepartment(e.target.value);
        });
        
        // Task type filter
        document.getElementById('task-type-filter')?.addEventListener('change', (e) => {
            this.filterByTaskType(e.target.value);
        });
        
        // Modal close
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeEventModal();
        });
        
        // Close modal when clicking outside
        document.getElementById('event-details-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'event-details-modal') {
                this.closeEventModal();
            }
        });
        
        // Mark event listeners as setup
        this.eventListenersSetup = true;
        console.log('Event listeners setup completed');
    }
    
    async navigateMonth(direction) {
        console.log(`navigateMonth called with direction: ${direction}`);
        console.log(`Current date before: ${this.currentDate.toDateString()}`);
        
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        
        console.log(`Current date after: ${this.currentDate.toDateString()}`);
        
        // Generate tasks for the new month if not already generated
        await this.generateTasksForMonth(this.currentDate.getMonth() + 1, this.currentDate.getFullYear());
        
        this.renderCalendar();
    }
    
    setView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-controls .action-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
        
        this.renderCalendar();
    }
    
    filterByDepartment(department) {
        this.selectedDepartment = department;
        this.renderCalendar();
    }
    
    filterByTaskType(taskType) {
        this.selectedTaskType = taskType;
        this.renderCalendar();
    }
    
    renderCalendar() {
        if (this.currentView === 'month') {
            this.renderMonthView();
        } else if (this.currentView === 'week') {
            this.renderWeekView();
        } else if (this.currentView === 'day') {
            this.renderDayView();
        }
    }
    
    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update calendar title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) return;
        
        // Clear existing days (keep headers)
        const headers = Array.from(calendarGrid.querySelectorAll('.calendar-day-header'));
        calendarGrid.innerHTML = '';
        headers.forEach(header => calendarGrid.appendChild(header));
        
        // Generate calendar days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = this.createDayElement(currentDate, today, month);
            calendarGrid.appendChild(dayElement);
        }
    }
    
    createDayElement(date, today, currentMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);
        
        // Check if date is in current month
        if (date.getMonth() !== currentMonth) {
            dayElement.classList.add('inactive');
        }
        
        // Check if it's today
        if (date.getTime() === today.getTime()) {
            dayElement.classList.add('today');
        }
        
        // Check if it's selected
        if (date.toDateString() === this.selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }
        
        // Add events for this day (show only first 3, add "more..." if more exist)
        const dayEvents = this.getEventsForDate(date);
        const eventsToShow = dayEvents.slice(0, 3);
        const hasMoreEvents = dayEvents.length > 3;
        
        eventsToShow.forEach(event => {
            const eventElement = this.createEventElement(event);
            dayElement.appendChild(eventElement);
        });
        
        // Add "more..." indicator if there are more than 3 events
        if (hasMoreEvents) {
            const moreElement = document.createElement('div');
            moreElement.className = 'day-event more-events';
            moreElement.textContent = `+${dayEvents.length - 3} more...`;
            moreElement.title = `Click to view all ${dayEvents.length} events`;
            dayElement.appendChild(moreElement);
        }
        
        // Add click handler
        dayElement.addEventListener('click', () => {
            this.selectDate(date);
        });
        
        return dayElement;
    }
    
    createEventElement(event) {
        const eventElement = document.createElement('div');
        
        // Create indicator element for color coding
        const indicator = document.createElement('span');
        indicator.className = 'event-indicator';
        
        // Add scorecard class if it's a scorecard event
        if (event.type && event.type.includes('scorecard')) {
            indicator.classList.add('scorecard');
        }
        
        // Set indicator color based on status
        const status = event.status ? event.status.toLowerCase() : 'planned';
        indicator.classList.add(status);
        
        // Determine the CSS class based on event type and status
        let cssClass = `day-event ${status}`;
        if (event.type && event.type.includes('scorecard')) {
            cssClass += ' scorecard';
        }
        
        eventElement.className = cssClass;
        
        // Add indicator and title
        eventElement.appendChild(indicator);
        const titleSpan = document.createElement('span');
        titleSpan.textContent = event.title;
        eventElement.appendChild(titleSpan);
        
        eventElement.title = `${event.title} - ${event.department} (${event.status})`;
        
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEventDetails(event);
        });
        
        return eventElement;
    }
    
    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        
        console.log(`Getting events for date: ${dateStr}`);
        console.log(`Total events: ${this.events.length}, planned: ${this.plannedEvents.length}, scorecard: ${this.scorecardTasks.length}`);
        
        let allEvents = [
            ...this.events.filter(event => event.date === dateStr),
            ...this.plannedEvents.filter(event => event.date === dateStr),
            ...this.scorecardTasks.filter(event => event.date === dateStr)
        ];
        
        console.log(`Events on ${dateStr}:`, allEvents);
        
        // Get current user and determine allowed departments
        const currentUser = this.getCurrentUser();
        console.log('Current user for filtering:', currentUser);
        
        if (currentUser) {
            // Determine allowed departments based on user role and permissions
            let allowedDepartments = [];
            
            if (currentUser.role === 'Admin') {
                // Admin can see all departments
                allowedDepartments = ['all'];
                console.log('Admin user - can see all departments');
            } else {
                // Regular users can only see their assigned departments
                if (currentUser.department) {
                    allowedDepartments.push(currentUser.department);
                    console.log(`Added primary department: ${currentUser.department}`);
                }
                
                // Add additional departments if any
                if (currentUser.departments && Array.isArray(currentUser.departments)) {
                    currentUser.departments.forEach(dept => {
                        if (!allowedDepartments.includes(dept)) {
                            allowedDepartments.push(dept);
                            console.log(`Added additional department: ${dept}`);
                        }
                    });
                }
                
                // Check permissions for additional access
                if (currentUser.permissions && currentUser.permissions.canView) {
                    if (currentUser.permissions.canView.includes('all')) {
                        allowedDepartments = ['all'];
                        console.log('User has "all" permission - can see all departments');
                    }
                }
            }
            
            console.log(`User ${currentUser.name} allowed departments:`, allowedDepartments);
            
            // Filter events based on allowed departments
            if (allowedDepartments.length > 0 && !allowedDepartments.includes('all')) {
                allEvents = allEvents.filter(event => {
                    const eventDepartment = event.department;
                    const hasAccess = allowedDepartments.includes(eventDepartment);
                    console.log(`Event "${event.title}" department: ${eventDepartment}, has access: ${hasAccess}`);
                    return hasAccess;
                });
                console.log(`Events after department filtering:`, allEvents);
            }
        }
        
        // Apply department filter (manual selection)
        if (this.selectedDepartment) {
            console.log(`Filtering by selected department: ${this.selectedDepartment}`);
            allEvents = allEvents.filter(event => event.department === this.selectedDepartment);
            console.log(`Events after manual department filter:`, allEvents);
        }
        
        // Apply task type filter
        if (this.selectedTaskType) {
            console.log(`Filtering by task type: ${this.selectedTaskType}`);
            allEvents = allEvents.filter(event => event.taskType === this.selectedTaskType);
            console.log(`Events after task type filter:`, allEvents);
        }
        
        // Sort events: submitted first, then pending, then late, then planned
        allEvents.sort((a, b) => {
            const statusOrder = { 'Submitted': 1, 'Pending': 2, 'Late': 3, 'Planned': 4 };
            return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
        });
        
        const result = allEvents; // Return all events, limit is handled in display
        console.log(`Final events for ${dateStr}:`, result);
        
        return result;
    }
    
    getCurrentUser() {
        // Try multiple methods to get current user
        let currentUser = null;
        
        // Method 1: Try window.DB.getCurrentUser()
        if (window.DB && window.DB.getCurrentUser) {
            currentUser = window.DB.getCurrentUser();
            console.log('🔒 Method 1 - DB.getCurrentUser():', currentUser);
        }
        
        // Method 2: Try localStorage reportrepo_db
        if (!currentUser) {
            const localData = localStorage.getItem('reportrepo_db');
            if (localData) {
                const data = JSON.parse(localData);
                currentUser = data.currentUser;
                console.log('🔒 Method 2 - localStorage currentUser:', currentUser);
            }
        }
        
        // Method 3: Try user_data from localStorage
        if (!currentUser) {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                currentUser = JSON.parse(userData);
                console.log('🔒 Method 3 - user_data from localStorage:', currentUser);
            }
        }
        
        // Method 4: Try Supabase auth
        if (!currentUser && typeof supabaseAuth !== 'undefined' && supabaseAuth.getUserData) {
            currentUser = supabaseAuth.getUserData();
            console.log('🔒 Method 4 - Supabase auth getUserData():', currentUser);
        }
        
        return currentUser;
    }
    
    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
        this.showDayEvents(date);
    }
    
    showDayEvents(date) {
        const dateStr = date.toISOString().split('T')[0];
        const events = this.getEventsForDate(date);
        
        console.log(`showDayEvents called for ${dateStr}, found ${events.length} events:`, events);
        
        // Update selected date display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const selectedDateElement = document.getElementById('selected-date');
        if (selectedDateElement) {
            selectedDateElement.textContent = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        }
        
        // Update events list
        const eventsList = document.getElementById('events-list');
        if (!eventsList) {
            console.error('events-list element not found!');
            return;
        }
        
        eventsList.innerHTML = '';
        
        if (events.length === 0) {
            eventsList.innerHTML = '<p style="color: #777; text-align: center; padding: 1rem;">No events for this day</p>';
            console.log('No events found, showing "No events" message');
            return;
        }
        
        console.log(`Creating ${events.length} event list items`);
        events.forEach((event, index) => {
            console.log(`Creating event item ${index + 1}:`, event);
            const eventItem = this.createEventListItem(event);
            eventsList.appendChild(eventItem);
        });
        
        console.log('showDayEvents completed');
    }
    
    createEventListItem(event) {
        const eventItem = document.createElement('div');
        eventItem.className = 'day-event-item';
        
        const indicator = document.createElement('div');
        indicator.className = 'event-indicator';
        
        // Add scorecard class if it's a scorecard event
        if (event.type && event.type.includes('scorecard')) {
            indicator.classList.add('scorecard');
        }
        
        // Set indicator color based on status
        const status = event.status ? event.status.toLowerCase() : 'planned';
        indicator.classList.add(status);
        
        const details = document.createElement('div');
        details.className = 'event-details';
        
        let eventTypeLabel = '';
        if (event.type === 'planned_report') {
            eventTypeLabel = '📅 Planned Report';
        } else if (event.type === 'scorecard_fill') {
            eventTypeLabel = '📊 Fill Scorecard';
        } else if (event.type === 'scorecard_submit') {
            eventTypeLabel = '📤 Submit Scorecard';
        } else if (event.type === 'scorecard_approve') {
            eventTypeLabel = '🎯 Approve Scorecard';
        } else {
            eventTypeLabel = '📄 Report';
        }
        
        details.innerHTML = `
            <h4>${event.title}</h4>
            <p>${eventTypeLabel} • ${event.department} • ${event.assigned}</p>
        `;
        
        const time = document.createElement('div');
        time.className = 'event-time';
        time.textContent = this.formatTime(event.date);
        
        eventItem.appendChild(indicator);
        eventItem.appendChild(details);
        eventItem.appendChild(time);
        
        eventItem.addEventListener('click', () => {
            this.showEventDetails(event);
        });
        
        return eventItem;
    }
    
    showEventDetails(event) {
        const modal = document.getElementById('event-details-modal');
        if (!modal) return;
        
        // Populate modal with event details
        document.getElementById('event-title').textContent = event.title;
        document.getElementById('event-department').textContent = event.department;
        document.getElementById('event-due-date').textContent = this.formatDate(event.date);
        document.getElementById('event-status').textContent = event.status;
        document.getElementById('event-assigned').textContent = event.assigned;
        
        // Set up action buttons based on event type
        const viewBtn = document.getElementById('view-report-btn');
        const uploadBtn = document.getElementById('upload-report-btn');
        
        if (event.type === 'report') {
            viewBtn.style.display = 'inline-block';
            uploadBtn.style.display = 'inline-block';
            viewBtn.textContent = 'View Report';
            uploadBtn.textContent = 'Upload New Version';
            viewBtn.onclick = () => this.viewReport(event.reportUrl || event.id);
            uploadBtn.onclick = () => this.uploadReport(event.id);
        } else if (event.type === 'planned_report') {
            viewBtn.style.display = 'inline-block';
            uploadBtn.style.display = 'inline-block';
            viewBtn.textContent = 'View Report Type';
            uploadBtn.textContent = 'Create Report';
            viewBtn.onclick = async () => await this.openReportModal(event.reportTypeId, 'view');
            uploadBtn.onclick = () => this.createNewReportFromPlanned(event);
        } else if (event.type === 'scorecard_fill') {
            viewBtn.style.display = 'inline-block';
            uploadBtn.style.display = 'inline-block';
            viewBtn.textContent = 'View Scorecard';
            uploadBtn.textContent = 'Fill Scorecard';
            viewBtn.onclick = async () => await this.openScorecardModal(event.scorecardId, 'view');
            uploadBtn.onclick = async () => await this.openScorecardModal(event.scorecardId, 'edit');
        } else if (event.type === 'scorecard_submit') {
            viewBtn.style.display = 'inline-block';
            uploadBtn.style.display = 'inline-block';
            viewBtn.textContent = 'View Scorecard';
            uploadBtn.textContent = 'Submit Scorecard';
            viewBtn.onclick = async () => await this.openScorecardModal(event.scorecardId, 'view');
            uploadBtn.onclick = async () => await this.openScorecardModal(event.scorecardId, 'submit');
        } else if (event.type === 'scorecard_approve') {
            viewBtn.style.display = 'inline-block';
            uploadBtn.style.display = 'inline-block';
            viewBtn.textContent = 'View Scorecard';
            uploadBtn.textContent = 'Approve Scorecard';
            viewBtn.onclick = async () => await this.openScorecardModal(event.scorecardId, 'view');
            uploadBtn.onclick = async () => await this.openScorecardModal(event.scorecardId, 'approve');
        } else {
            viewBtn.style.display = 'inline-block';
            uploadBtn.style.display = 'none';
            viewBtn.textContent = 'View Details';
            viewBtn.onclick = async () => await this.openScorecardModal(event.scorecardId, 'view');
        }
        
        modal.style.display = 'block';
    }
    
    closeEventModal() {
        const modal = document.getElementById('event-details-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    viewReport(reportIdOrUrl) {
        // Check if it's a URL (starts with http or https)
        if (reportIdOrUrl && (reportIdOrUrl.startsWith('http://') || reportIdOrUrl.startsWith('https://'))) {
            // Open the file URL directly in a new tab
            window.open(reportIdOrUrl, '_blank');
        } else {
            // Fallback to the reports page
            window.location.href = `reports.html?report=${reportIdOrUrl}`;
        }
    }
    
    uploadReport(reportId) {
        // Get report details to find the report type
        const report = DB.getById('reports', reportId);
        if (!report) {
            console.error('Report not found:', reportId);
            alert('Report not found');
            return;
        }
        
        // Close the event modal
        this.closeEventModal();
        
        // Redirect to reports page with the report type context
        // This will open the reports page with the proper upload context
        window.location.href = `reports.html?reportType=${report.report_type_id}&upload=true`;
    }
    
    createNewReport(event) {
        // Navigate to reports page with pre-filled report type
        window.location.href = `reports.html?reportType=${event.reportTypeId}&date=${event.date}`;
    }
    
    createNewReportFromPlanned(event) {
        // Close the event modal
        this.closeEventModal();
        
        // Redirect to reports page with the report type context to trigger upload modal
        // This will open the reports page and auto-open the upload modal
        window.location.href = `reports.html?reportType=${event.reportTypeId}&upload=true`;
    }
    
    async openScorecardModal(scorecardId, mode) {
        try {
            let scorecard = null;
            
            // Try to load from Supabase first, fallback to local data
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    scorecard = await supabaseDataService.getById('scorecards', scorecardId);
                } catch (error) {
                    console.warn('Failed to load scorecard from Supabase, using local data:', error);
                    scorecard = DB.getById('scorecards', scorecardId);
                }
            } else {
                scorecard = DB.getById('scorecards', scorecardId);
            }
            
            if (!scorecard) {
                console.error('Scorecard not found:', scorecardId);
                return;
            }
            
            const modal = document.getElementById('scorecard-modal');
            const title = document.getElementById('scorecard-title');
            const content = document.getElementById('scorecard-content');
            const actionBtn = document.getElementById('action-scorecard-btn');
            
            title.textContent = scorecard.name;
            
            // Add approval mode class for styling
            if (mode === 'approve') {
                modal.classList.add('approval-mode');
            } else {
                modal.classList.remove('approval-mode');
            }
            
            // Load scorecard content
            await this.loadScorecardContent(scorecard, content, mode);
            
            // Set up action button based on mode
            if (mode === 'view') {
                actionBtn.style.display = 'none';
            } else if (mode === 'edit') {
                actionBtn.textContent = 'Save Draft';
                actionBtn.onclick = () => this.saveScorecardDraft(scorecardId);
            } else if (mode === 'submit') {
                actionBtn.textContent = 'Submit for Approval';
                actionBtn.onclick = () => this.submitScorecard(scorecardId);
            } else if (mode === 'approve') {
                actionBtn.textContent = 'Approve Scorecard';
                actionBtn.onclick = () => this.approveScorecard(scorecardId);
            }
            
            // Set up close button
            const closeBtn = document.getElementById('close-scorecard-btn');
            if (mode === 'edit') {
                closeBtn.textContent = 'Save & Close';
                closeBtn.onclick = () => {
                    this.saveScorecardValues(scorecardId);
                    modal.style.display = 'none';
                };
            } else {
                closeBtn.textContent = 'Close';
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }
            
            // Close modal when clicking outside
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            };
            
            modal.style.display = 'block';
            this.closeEventModal();
        } catch (error) {
            console.error('Error opening scorecard modal:', error);
            alert('Error loading scorecard data!');
        }
    }
    
    async openReportModal(reportTypeId, mode) {
        try {
            let reportType = null;
            
            // Try to load from Supabase first, fallback to local data
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    reportType = await supabaseDataService.getById('report_types', reportTypeId);
                } catch (error) {
                    console.warn('Failed to load report type from Supabase, using local data:', error);
                    reportType = DB.getById('reportTypes', reportTypeId);
                }
            } else {
                reportType = DB.getById('reportTypes', reportTypeId);
            }
            
            if (!reportType) {
                console.error('Report type not found:', reportTypeId);
                return;
            }
            
            const modal = document.getElementById('report-modal');
            const title = document.getElementById('report-title');
            const content = document.getElementById('report-content');
            const actionBtn = document.getElementById('action-report-btn');
            
            title.textContent = reportType.name;
            
            // Load report content
            await this.loadReportContent(reportType, content, mode);
            
            // Set up action button based on mode
            if (mode === 'view') {
                actionBtn.style.display = 'none';
            } else if (mode === 'create') {
                actionBtn.textContent = 'Upload Report';
                actionBtn.onclick = () => {
                    // Close the modal and redirect to reports page
                    modal.style.display = 'none';
                    window.location.href = `reports.html?reportType=${reportTypeId}&upload=true`;
                };
            }
            
            // Set up close button
            document.getElementById('close-report-btn').onclick = () => {
                modal.style.display = 'none';
            };
            
            // Close modal when clicking outside
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            };
            
            modal.style.display = 'block';
            this.closeEventModal();
        } catch (error) {
            console.error('Error opening report modal:', error);
            alert('Error loading report data!');
        }
    }
    
    async loadScorecardContent(scorecard, contentElement, mode) {
        try {
            let kpis = [], scorecardResults = [];
            
            // Try to load from Supabase first, fallback to local data
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    
                    // Load KPIs and scorecard results in parallel
                    [kpis, scorecardResults] = await Promise.all([
                        supabaseDataService.getKPIsByScorecard(scorecard.id),
                        supabaseDataService.getScorecardResults()
                    ]);
                    
                    // Filter scorecard results for this specific scorecard
                    scorecardResults = scorecardResults.filter(result => result.scorecard_id === scorecard.id);
                    
                    console.log('Loaded from Supabase:', {
                        kpis: kpis.length,
                        scorecardResults: scorecardResults.length
                    });
                    console.log('Scorecard ID being loaded:', scorecard.id);
                    console.log('KPIs found:', kpis);
                    console.log('Scorecard results found:', scorecardResults);
                } catch (error) {
                    console.warn('Failed to load from Supabase, using local data:', error);
                    kpis = DB.get('kpis').filter(kpi => kpi.scorecard_id === scorecard.id && kpi.is_active);
                    scorecardResults = DB.get('scorecard_results').filter(result => result.scorecard_id === scorecard.id);
                }
            } else {
                kpis = DB.get('kpis').filter(kpi => kpi.scorecard_id === scorecard.id && kpi.is_active);
                scorecardResults = DB.get('scorecard_results').filter(result => result.scorecard_id === scorecard.id);
            }
            
            let html = `
                <div class="scorecard-info">
                    <h4>${scorecard.name}</h4>
                    <p><strong>Department:</strong> ${scorecard.department}</p>
                    <p><strong>Description:</strong> ${scorecard.description}</p>
                    <p><strong>Status:</strong> ${scorecard.is_active ? 'Active' : 'Inactive'}</p>
                </div>
            `;
            
            // Add approval mode notice
            if (mode === 'approve') {
                html += `
                    <div class="alert alert-info" style="margin: 10px 0; padding: 10px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; color: #0c5460;">
                        <strong>📋 Review Mode:</strong> You are reviewing this scorecard for approval. KPI values are read-only and cannot be modified during the approval process.
                    </div>
                `;
            }
            
            if (kpis.length > 0) {
                html += `
                    <div class="kpi-list">
                        <h4>KPIs</h4>
                        <table class="kpi-table">
                            <thead>
                                <tr>
                                    <th>KPI Name</th>
                                    <th>Target</th>
                                    <th>Unit</th>
                                    <th>Weight</th>
                                    ${mode !== 'view' ? '<th>Current Value</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                kpis.forEach(kpi => {
                    const result = scorecardResults.find(r => r.kpi_values && r.kpi_values[kpi.id]);
                    const currentValue = result ? result.kpi_values[kpi.id] : '';
                    
                    // Disable editing for approvers - they should only review, not edit values
                    const isReadOnly = mode === 'view' || mode === 'approve';
                    
                    html += `
                        <tr>
                            <td>${kpi.name}</td>
                            <td>${kpi.target}</td>
                            <td>${kpi.unit}</td>
                            <td>${kpi.weight}%</td>
                            ${mode !== 'view' ? `<td><input type="number" class="kpi-input" data-kpi-id="${kpi.id}" value="${currentValue}" ${isReadOnly ? 'readonly' : ''}></td>` : ''}
                        </tr>
                    `;
                });
                
                html += `
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                html += `
                    <div class="kpi-list">
                        <h4>KPIs</h4>
                        <div class="alert alert-warning">
                            <p><strong>No KPIs found for this scorecard.</strong></p>
                            <p>This scorecard (ID: ${scorecard.id}) doesn't have any KPIs defined. You need to add KPIs to this scorecard before you can enter values.</p>
                            <p>Please contact your administrator to add KPIs to this scorecard.</p>
                        </div>
                    </div>
                `;
            }
            
            contentElement.innerHTML = html;
        } catch (error) {
            console.error('Error loading scorecard content:', error);
            contentElement.innerHTML = '<p>Error loading scorecard data. Please try again.</p>';
        }
    }
    
    async loadReportContent(reportType, contentElement, mode) {
        try {
            let reports = [];
            
            // Try to load from Supabase first, fallback to local data
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    reports = await supabaseDataService.getReports();
                    
                    // Filter reports for this specific report type
                    reports = reports.filter(report => report.report_type_id === reportType.id);
                    
                    console.log('Loaded reports from Supabase:', reports.length);
                } catch (error) {
                    console.warn('Failed to load reports from Supabase, using local data:', error);
                    reports = DB.get('reports').filter(report => report.reportTypeId === reportType.id);
                }
            } else {
                reports = DB.get('reports').filter(report => report.reportTypeId === reportType.id);
            }
            
            let html = `
                <div class="report-info">
                    <h4>${reportType.name}</h4>
                    <p><strong>Department:</strong> ${reportType.department}</p>
                    <p><strong>Frequency:</strong> ${reportType.frequency}</p>
                    <p><strong>Format:</strong> ${reportType.format}</p>
                    <p><strong>Description:</strong> ${reportType.description}</p>
                </div>
            `;
            
            if (reports.length > 0) {
                html += `
                    <div class="report-versions">
                        <h4>Report Versions</h4>
                        <div class="version-list">
                `;
                
                reports.forEach(report => {
                    html += `
                        <div class="version-item">
                            <div class="version-info">
                                <strong>${report.name || report.title}</strong>
                                <span class="version-date">${report.date}</span>
                                <span class="version-status ${report.status.toLowerCase()}">${report.status}</span>
                            </div>
                            <div class="version-actions">
                                <button class="action-button secondary" onclick="window.open('${report.report_url || report.url}', '_blank')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            if (mode === 'create') {
                html += `
                    <div class="upload-section">
                        <h4>Upload New Report</h4>
                        <div class="upload-form">
                            <div class="form-group">
                                <label>Report File:</label>
                                <input type="file" id="report-file" accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.gif,.pptx,.ppt">
                            </div>
                            <div class="form-group">
                                <label>Notes:</label>
                                <textarea id="report-notes" rows="3" placeholder="Add any notes about this report..."></textarea>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            contentElement.innerHTML = html;
        } catch (error) {
            console.error('Error loading report content:', error);
            contentElement.innerHTML = '<p>Error loading report data. Please try again.</p>';
        }
    }
    
    async saveScorecardDraft(scorecardId) {
        // Implementation for saving scorecard draft
        console.log('Saving scorecard draft:', scorecardId);
        
        // Call the actual save method
        await this.saveScorecardValues(scorecardId);
        
        // Don't close the modal - let user continue editing
        console.log('Scorecard draft saved successfully!');
    }
    


    async saveScorecardValues(scorecardId) {
        try {
            // Get all KPI input values
            const kpiInputs = document.querySelectorAll('.kpi-input');
            const kpiValues = {};
            
            kpiInputs.forEach(input => {
                const kpiId = input.dataset.kpiId;
                const value = input.value;
                if (kpiId && value !== '') {
                    kpiValues[kpiId] = parseFloat(value);
                }
            });
            
            // Check if we have any KPI values to save
            if (Object.keys(kpiValues).length === 0) {
                console.warn('No KPI values to save - no KPI inputs found');
                alert('No KPI values to save. This scorecard may not have any KPIs defined.');
                return;
            }
            
            // Get current calendar month and year for the period
            const currentMonth = this.currentDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
            const currentYear = this.currentDate.getFullYear();
            
            console.log('Saving scorecard values:', {
                scorecardId,
                currentMonth,
                currentYear,
                kpiValues
            });
            
            // Ensure scorecardId is an integer
            const numericScorecardId = parseInt(scorecardId);
            if (isNaN(numericScorecardId)) {
                console.error('Invalid scorecard ID:', scorecardId);
                alert('Error: Invalid scorecard ID');
                return;
            }
            
            // Save to Supabase or local storage
            if (typeof supabaseDataService !== 'undefined') {
                // Save to Supabase using upsert logic
                const currentUser = this.getCurrentUser();
                
                // For now, use null for user_id since we can't easily convert UUID to integer
                // The database schema expects INTEGER but Supabase auth uses UUIDs
                // This is a temporary workaround until the schema is updated
                const userId = null;
                
                // Check if record already exists
                const existingResults = await supabaseDataService.get('scorecard_results', {
                    filter: {
                        scorecard_id: numericScorecardId,
                        period_month: currentMonth,
                        period_year: currentYear
                    }
                });
                
                const scorecardResult = {
                    scorecard_id: numericScorecardId,
                    user_id: this.convertUserIdToInteger(currentUser.id), // Convert UUID to integer
                    period_month: currentMonth,
                    period_year: currentYear,
                    kpi_values: kpiValues,
                    submitted_at: new Date().toISOString(),
                    status: 'draft'
                };
                
                if (existingResults && existingResults.length > 0) {
                    // Update existing record
                    const existingResult = existingResults[0];
                    console.log('Updating existing scorecard result:', existingResult.id);
                    
                    // Ensure ID is properly formatted for the database
                    let recordId = existingResult.id;
                    console.log('Original record ID:', recordId, 'Type:', typeof recordId);
                    
                    if (typeof recordId === 'string') {
                        // Check if it's a numeric string
                        if (!isNaN(parseInt(recordId))) {
                            recordId = parseInt(recordId);
                            console.log('Converted string ID to integer:', recordId);
                        } else {
                            // This is likely a UUID - we need to handle it differently
                            console.log('⚠️ UUID detected in existing record ID:', recordId);
                            console.log('This should not happen with existing records from the database');
                            // For UUIDs, we should use the UUID as-is since the database expects it
                        }
                    }
                    
                    // Final validation - ensure we're not passing a UUID to an integer field
                    if (typeof recordId === 'string' && recordId.includes('-')) {
                        console.error('❌ Attempting to use UUID as integer ID - this will fail');
                        console.error('UUID detected:', recordId);
                        console.error('This suggests a data inconsistency in the database');
                        // Try to insert a new record instead of updating with invalid ID
                        console.log('Attempting to insert new record instead of invalid update');
                        const { id, ...scorecardResultWithoutId } = scorecardResult;
                        await supabaseDataService.insert('scorecard_results', scorecardResultWithoutId);
                        console.log('Scorecard submitted to Supabase successfully (inserted new record due to invalid ID)');
                        return;
                    }
                    
                    try {
                        await supabaseDataService.update('scorecard_results', recordId, scorecardResult);
                        console.log('Scorecard values updated in Supabase');
                    } catch (updateError) {
                        console.error('Error updating scorecard result:', updateError);
                        
                        // Check if it's an ID type error
                        if (updateError.message && updateError.message.includes('invalid input syntax for type integer')) {
                            console.log('ID type error detected - attempting to insert new record instead');
                            // If update fails due to ID type, try to insert a new record
                            const { id, ...scorecardResultWithoutId } = scorecardResult;
                            await supabaseDataService.insert('scorecard_results', scorecardResultWithoutId);
                            console.log('Scorecard submitted to Supabase successfully (inserted new record)');
                        } else {
                            // Re-throw other errors
                            throw updateError;
                        }
                    }
                } else {
                    // Insert new record (don't include ID - let Supabase auto-generate)
                    console.log('Inserting new scorecard result');
                    
                    // Remove any ID field to let Supabase auto-generate
                    const { id, ...scorecardResultWithoutId } = scorecardResult;
                    
                    // Debug: Log what we're about to insert
                    console.log('Scorecard result object before insert:', scorecardResult);
                    console.log('Scorecard result object after removing ID:', scorecardResultWithoutId);
                    
                    await supabaseDataService.insert('scorecard_results', scorecardResultWithoutId);
                    console.log('Scorecard values saved to Supabase');
                }
                
                alert('KPI values saved successfully!');
            } else {
                // Save to local storage
                const currentUser = this.getCurrentUser();
                const existingResults = DB.get('scorecard_results') || [];
                
                // Check if record already exists
                const existingResult = existingResults.find(r => 
                    r.scorecard_id === numericScorecardId && 
                    r.period_month === currentMonth && 
                    r.period_year === currentYear
                );
                
                if (existingResult) {
                    // Update existing record
                    existingResult.kpi_values = kpiValues;
                    existingResult.submitted_at = new Date().toISOString();
                    existingResult.status = 'draft';
                    DB.set('scorecard_results', existingResults);
                    console.log('Scorecard values updated in local storage');
                } else {
                    // Insert new record
                    const newResult = {
                        scorecard_id: numericScorecardId,
                        user_id: currentUser ? this.convertUserIdToInteger(currentUser.id) : 1,
                        period_month: currentMonth,
                        period_year: currentYear,
                        kpi_values: kpiValues,
                        submitted_at: new Date().toISOString(),
                        status: 'draft'
                    };
                    
                    // Let DB.add generate the ID to avoid conflicts
                    const addedResult = DB.add('scorecard_results', newResult);
                    console.log('Scorecard values saved to local storage with ID:', addedResult.id);
                }
                
                alert('KPI values saved successfully!');
            }
        } catch (error) {
            console.error('Error saving scorecard values:', error);
            alert('Error saving values. Please try again.');
        }
    }
    
    async submitScorecard(scorecardId) {
        console.log('Submitting scorecard:', scorecardId);
        
        try {
            // Get current user and scorecard
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                alert('You must be logged in to submit a scorecard.');
                return;
            }
            
            let scorecard = null;
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    scorecard = await supabaseDataService.getById('scorecards', scorecardId);
                } catch (error) {
                    console.warn('Failed to load scorecard from Supabase:', error);
                    scorecard = DB.getById('scorecards', scorecardId);
                }
            } else {
                scorecard = DB.getById('scorecards', scorecardId);
            }
            
            if (!scorecard) {
                alert('Scorecard not found!');
                return;
            }
            
            // Check if user can submit this scorecard
            if (!this.canSubmitScorecard(scorecard)) {
                alert('You do not have permission to submit this scorecard.');
                return;
            }
            
            // Get current month and year
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            
            // Get KPI values from the form
            const kpiInputs = document.querySelectorAll('.kpi-input');
            const kpiValues = {};
            
            kpiInputs.forEach(input => {
                const kpiId = input.dataset.kpiId;
                const value = input.value;
                if (kpiId && value !== '') {
                    kpiValues[kpiId] = parseFloat(value);
                }
            });
            
            // Check if we have any KPI values to save
            if (Object.keys(kpiValues).length === 0) {
                alert('No KPI values to submit. Please enter values before submitting.');
                return;
            }
            
            // Create or update scorecard result with submitted status
            const scorecardResult = {
                scorecard_id: scorecardId,
                user_id: this.convertUserIdToInteger(currentUser.id), // Convert UUID to integer
                period_month: currentMonth,
                period_year: currentYear,
                kpi_values: kpiValues,
                submitted_at: new Date().toISOString(),
                status: 'submitted'
                // Removed submitted_by to match database schema
            };
            
            // Save to database
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    // Check if record already exists
                    const existingResults = await supabaseDataService.getScorecardResults();
                    const existingResult = existingResults.find(result => 
                        result.scorecard_id === scorecardId && 
                        result.period_month === currentMonth && 
                        result.period_year === currentYear
                    );
                    
                    if (existingResult) {
                        // Update existing record
                        console.log('Updating existing scorecard result for submission');
                        console.log('Existing result ID:', existingResult.id, 'Type:', typeof existingResult.id);
                        
                        // Ensure ID is properly formatted for the database
                        let recordId = existingResult.id;
                        if (typeof recordId === 'string') {
                            // Check if it's a numeric string
                            if (!isNaN(parseInt(recordId))) {
                                recordId = parseInt(recordId);
                                console.log('Converted string ID to integer:', recordId);
                            } else {
                                // This is likely a UUID - we need to handle it differently
                                console.log('UUID detected, using as string ID:', recordId);
                                // For UUIDs, we should use the UUID as-is since the database expects it
                            }
                        }
                        
                        try {
                            await supabaseDataService.update('scorecard_results', recordId, scorecardResult);
                            console.log('Scorecard submitted to Supabase successfully');
                        } catch (updateError) {
                            console.error('Error updating scorecard result:', updateError);
                            
                            // Check if it's an ID type error
                            if (updateError.message && updateError.message.includes('invalid input syntax for type integer')) {
                                console.log('ID type error detected - attempting to insert new record instead');
                                // If update fails due to ID type, try to insert a new record
                                const { id, ...scorecardResultWithoutId } = scorecardResult;
                                await supabaseDataService.insert('scorecard_results', scorecardResultWithoutId);
                                console.log('Scorecard submitted to Supabase successfully (inserted new record)');
                            } else {
                                // Re-throw other errors
                                throw updateError;
                            }
                        }
                    } else {
                        // Insert new record (don't include ID - let Supabase auto-generate)
                        console.log('Inserting new scorecard result for submission');
                        const { id, ...scorecardResultWithoutId } = scorecardResult;
                        await supabaseDataService.insert('scorecard_results', scorecardResultWithoutId);
                    }
                    console.log('Scorecard submitted to Supabase successfully');
                } catch (error) {
                    console.error('Error submitting scorecard to Supabase:', error);
                    alert('Error submitting scorecard. Please try again.');
                    return;
                }
            } else {
                // Local storage fallback
                const existingResults = DB.get('scorecard_results') || [];
                const existingResultIndex = existingResults.findIndex(result => 
                    result.scorecard_id === scorecardId && 
                    result.period_month === currentMonth && 
                    result.period_year === currentYear
                );
                
                if (existingResultIndex !== -1) {
                    existingResults[existingResultIndex] = {
                        ...existingResults[existingResultIndex],
                        ...scorecardResult
                    };
                } else {
                    existingResults.push({
                        id: Date.now(),
                        ...scorecardResult
                    });
                }
                
                DB.set('scorecard_results', existingResults);
                console.log('Scorecard submitted to local storage successfully');
            }
            
            alert('Scorecard submitted for approval successfully!');
            document.getElementById('scorecard-modal').style.display = 'none';
            
            // Refresh the calendar to show updated status
            this.renderCalendar();
            
        } catch (error) {
            console.error('Error submitting scorecard:', error);
            alert('Error submitting scorecard. Please try again.');
        }
    }
    
    async approveScorecard(scorecardId) {
        console.log('Approving scorecard:', scorecardId);
        
        try {
            // Get current user and scorecard
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                alert('You must be logged in to approve a scorecard.');
                return;
            }
            
            let scorecard = null;
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    scorecard = await supabaseDataService.getById('scorecards', scorecardId);
                } catch (error) {
                    console.warn('Failed to load scorecard from Supabase:', error);
                    scorecard = DB.getById('scorecards', scorecardId);
                }
            } else {
                scorecard = DB.getById('scorecards', scorecardId);
            }
            
            if (!scorecard) {
                alert('Scorecard not found!');
                return;
            }
            
            // Check if user can approve this scorecard
            if (!this.canApproveScorecard(scorecard)) {
                alert('You do not have permission to approve this scorecard.');
                return;
            }
            
            // Get current month and year
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            
            // Find the submitted scorecard result
            let existingResult = null;
            
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    const existingResults = await supabaseDataService.getScorecardResults();
                    existingResult = existingResults.find(result => 
                        result.scorecard_id === scorecardId && 
                        result.period_month === currentMonth && 
                        result.period_year === currentYear &&
                        result.status === 'submitted'
                    );
                } catch (error) {
                    console.error('Error finding submitted scorecard result:', error);
                }
            } else {
                const existingResults = DB.get('scorecard_results') || [];
                existingResult = existingResults.find(result => 
                    result.scorecard_id === scorecardId && 
                    result.period_month === currentMonth && 
                    result.period_year === currentYear &&
                    result.status === 'submitted'
                );
            }
            
            if (!existingResult) {
                alert('No submitted scorecard found for approval. The scorecard must be submitted first.');
                return;
            }
            
            // Update the scorecard result with approved status
            const updatedResult = {
                ...existingResult,
                status: 'approved'
                // Removed approved_at and approved_by to match database schema
            };
            
            // Save to database
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    console.log('Approving scorecard result:', existingResult.id);
                    console.log('Existing result ID:', existingResult.id, 'Type:', typeof existingResult.id);
                    
                    // Ensure ID is properly formatted for the database
                    let recordId = existingResult.id;
                    if (typeof recordId === 'string') {
                        // Check if it's a numeric string
                        if (!isNaN(parseInt(recordId))) {
                            recordId = parseInt(recordId);
                            console.log('Converted string ID to integer:', recordId);
                        } else {
                            // This is likely a UUID - we need to handle it differently
                            console.log('UUID detected, using as string ID:', recordId);
                            // For UUIDs, we should use the UUID as-is since the database expects it
                        }
                    }
                    
                    try {
                        await supabaseDataService.update('scorecard_results', recordId, updatedResult);
                        console.log('Scorecard approved in Supabase successfully');
                    } catch (updateError) {
                        console.error('Error updating scorecard result for approval:', updateError);
                        
                        // Check if it's an ID type error
                        if (updateError.message && updateError.message.includes('invalid input syntax for type integer')) {
                            console.log('ID type error detected during approval - this should not happen with existing records');
                            alert('Error: Invalid record ID format. Please contact support.');
                        } else {
                            alert('Error approving scorecard. Please try again.');
                        }
                        return;
                    }
                } catch (error) {
                    console.error('Error approving scorecard in Supabase:', error);
                    alert('Error approving scorecard. Please try again.');
                    return;
                }
            } else {
                // Local storage fallback
                const existingResults = DB.get('scorecard_results') || [];
                const existingResultIndex = existingResults.findIndex(result => result.id === existingResult.id);
                
                if (existingResultIndex !== -1) {
                    existingResults[existingResultIndex] = updatedResult;
                    DB.set('scorecard_results', existingResults);
                    console.log('Scorecard approved in local storage successfully');
                }
            }
            
            alert('Scorecard approved successfully!');
            document.getElementById('scorecard-modal').style.display = 'none';
            
            // Refresh the calendar to show updated status
            this.renderCalendar();
            
        } catch (error) {
            console.error('Error approving scorecard:', error);
            alert('Error approving scorecard. Please try again.');
        }
    }
    

    
    viewScorecard(scorecardId) {
        window.location.href = `kpi-data-entry.html?scorecard=${scorecardId}`;
    }
    
    fillScorecard(scorecardId) {
        window.location.href = `kpi-data-entry.html?scorecard=${scorecardId}&mode=edit`;
    }
    
    async populateDepartmentFilter() {
        try {
            let departments = [];
            
            if (typeof supabaseDataService !== 'undefined') {
                try {
                    await supabaseDataService.init();
                    departments = await supabaseDataService.getDepartments();
                } catch (error) {
                    console.warn('Failed to load departments from Supabase, using local data:', error);
                    departments = DB.get('departments') || [];
                }
            } else {
                departments = DB.get('departments') || [];
            }
            
            const filter = document.getElementById('department-filter');
            if (!filter) return;
            
            // Clear existing options
            filter.innerHTML = '<option value="">All Departments</option>';
            
            // Get current user to determine which departments to show
            const currentUser = this.getCurrentUser();
            console.log('Current user for department filter:', currentUser);
            
            let allowedDepartments = [];
            
            if (currentUser) {
                if (currentUser.role === 'Admin') {
                    // Admin can see all departments
                    allowedDepartments = departments.map(dept => dept.name);
                    console.log('Admin user - showing all departments');
                } else {
                    // Regular users can only see their assigned departments
                    if (currentUser.department) {
                        allowedDepartments.push(currentUser.department);
                        console.log(`Added primary department: ${currentUser.department}`);
                    }
                    
                    // Add additional departments if any
                    if (currentUser.departments && Array.isArray(currentUser.departments)) {
                        currentUser.departments.forEach(dept => {
                            if (!allowedDepartments.includes(dept)) {
                                allowedDepartments.push(dept);
                                console.log(`Added additional department: ${dept}`);
                            }
                        });
                    }
                    
                    // Check permissions for additional access
                    if (currentUser.permissions && currentUser.permissions.canView) {
                        if (currentUser.permissions.canView.includes('all')) {
                            allowedDepartments = departments.map(dept => dept.name);
                            console.log('User has "all" permission - showing all departments');
                        }
                    }
                }
            } else {
                // No user logged in, show all departments
                allowedDepartments = departments.map(dept => dept.name);
                console.log('No user logged in - showing all departments');
            }
            
            console.log(`User ${currentUser ? currentUser.name : 'None'} allowed departments for filter:`, allowedDepartments);
            
            // Add department options based on user permissions
            departments.forEach(dept => {
                if (allowedDepartments.includes(dept.name)) {
                    const option = document.createElement('option');
                    option.value = dept.name;
                    option.textContent = dept.name;
                    filter.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error populating department filter:', error);
        }
    }
    
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    formatTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }
    
    renderWeekView() {
        // TODO: Implement week view
        console.log('Week view not implemented yet');
    }
    
    renderDayView() {
        // TODO: Implement day view
        console.log('Day view not implemented yet');
    }
    
    // Debug method to help troubleshoot filtering issues
    debugFiltering() {
        console.log('=== Calendar Filtering Debug ===');
        
        const currentUser = this.getCurrentUser();
        console.log('Current user:', currentUser);
        
        if (currentUser) {
            let allowedDepartments = [];
            
            if (currentUser.role === 'Admin') {
                allowedDepartments = ['all'];
                console.log('Admin user - can see all departments');
            } else {
                if (currentUser.department) {
                    allowedDepartments.push(currentUser.department);
                }
                
                if (currentUser.departments && Array.isArray(currentUser.departments)) {
                    currentUser.departments.forEach(dept => {
                        if (!allowedDepartments.includes(dept)) {
                            allowedDepartments.push(dept);
                        }
                    });
                }
                
                if (currentUser.permissions && currentUser.permissions.canView) {
                    if (currentUser.permissions.canView.includes('all')) {
                        allowedDepartments = ['all'];
                    }
                }
            }
            
            console.log('Allowed departments:', allowedDepartments);
            
            // Show all tasks and their departments
            console.log('All events:', this.events.length);
            console.log('All planned events:', this.plannedEvents.length);
            console.log('All scorecard tasks:', this.scorecardTasks.length);
            
            // Show sample tasks with their departments
            const allTasks = [...this.events, ...this.plannedEvents, ...this.scorecardTasks];
            const departmentCounts = {};
            
            allTasks.forEach(task => {
                const dept = task.department || 'No Department';
                departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
            });
            
            console.log('Tasks by department:', departmentCounts);
            
            // Show what would be filtered
            if (allowedDepartments.length > 0 && !allowedDepartments.includes('all')) {
                const filteredTasks = allTasks.filter(task => {
                    const eventDepartment = task.department;
                    return allowedDepartments.includes(eventDepartment);
                });
                
                console.log('Tasks after filtering:', filteredTasks.length);
                console.log('Sample filtered tasks:', filteredTasks.slice(0, 5));
            }
        }
        
        console.log('=== End Debug ===');
    }
}

// Calendar initialization is now handled in calendar.html 