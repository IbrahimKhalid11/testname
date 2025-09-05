// Minimal KPI Auto-Refresh - Surgical Fix
// This script only makes the "Load Period" button action trigger automatically

let isInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for the page to fully load
    setTimeout(() => {
        if (!isInitialized) {
            setupAutoLoadPeriod();
            isInitialized = true;
        }
    }, 1000);
});

function setupAutoLoadPeriod() {
    console.log('🔄 Setting up automatic Load Period functionality...');
    
    // Add event listeners to month and year inputs
    const monthInput = document.getElementById('period-month');
    const yearInput = document.getElementById('period-year');
    
    if (monthInput) {
        monthInput.addEventListener('change', function() {
            console.log('📅 Month changed to:', this.value);
            triggerLoadPeriod();
        });
    }
    
    if (yearInput) {
        yearInput.addEventListener('input', function() {
            console.log('📅 Year changed to:', this.value);
            triggerLoadPeriod();
        });
        yearInput.addEventListener('change', function() {
            console.log('📅 Year changed to:', this.value);
            triggerLoadPeriod();
        });
    }
    
    console.log('✅ Automatic Load Period setup complete');
}

function triggerLoadPeriod() {
    console.log('🔄 Triggering Load Period...');
    
    // Method 1: Try to call the functions that exist in the main page
    if (typeof window.loadKpiDataForPeriod === 'function') {
        console.log('✅ Calling loadKpiDataForPeriod function');
        window.loadKpiDataForPeriod();
        return;
    }
    
    // Method 2: Try to call loadRelatedReports
    if (typeof window.loadRelatedReports === 'function') {
        console.log('✅ Calling loadRelatedReports function');
        window.loadRelatedReports();
        return;
    }
    
    // Method 3: Try to find and click the Load Period button
    const loadPeriodBtn = document.querySelector('button[onclick*="loadPeriod"]');
    if (loadPeriodBtn) {
        console.log('✅ Clicking Load Period button');
        loadPeriodBtn.click();
        return;
    }
    
    // Method 4: Try to find button by text content
    const buttons = document.querySelectorAll('button');
    for (let btn of buttons) {
        if (btn.textContent.includes('Load Period')) {
            console.log('✅ Clicking Load Period button (found by text)');
            btn.click();
            return;
        }
    }
    
    // Method 5: Try to call loadPeriod function directly
    if (typeof window.loadPeriod === 'function') {
        console.log('✅ Calling loadPeriod function directly');
        window.loadPeriod();
        return;
    }
    
    // Method 6: Try to find any function that contains "load" and "period"
    for (let key in window) {
        if (typeof window[key] === 'function' && 
            key.toLowerCase().includes('load') && 
            key.toLowerCase().includes('period')) {
            console.log('✅ Calling function:', key);
            window[key]();
            return;
        }
    }
    
    console.log('⚠️ Could not find Load Period functionality');
} 

// Surgical Fix: Add Year and Month to Immediate KPI Table Update Logic
// This script adds year and month filters to the same logic as scorecard filter

document.addEventListener('DOMContentLoaded', function() {
    // Wait for the page to fully load
    setTimeout(() => {
        setupYearMonthFilters();
    }, 1000);
});

function setupYearMonthFilters() {
    console.log('🔄 Setting up year and month filter logic...');
    
    // Add event listeners to year and month inputs
    const monthInput = document.getElementById('period-month');
    const yearInput = document.getElementById('period-year');
    
    if (monthInput) {
        monthInput.addEventListener('change', function() {
            console.log('📅 Month changed to:', this.value);
            triggerKpiTableUpdate();
        });
    }
    
    if (yearInput) {
        yearInput.addEventListener('input', function() {
            console.log('📅 Year changed to:', this.value);
            triggerKpiTableUpdate();
        });
        yearInput.addEventListener('change', function() {
            console.log('📅 Year changed to:', this.value);
            triggerKpiTableUpdate();
        });
    }
    
    console.log('✅ Year and month filter logic setup complete');
}

function triggerKpiTableUpdate() {
    console.log('🔄 Triggering KPI table update for year/month change...');
    
    // Method 1: Try to trigger the same logic as scorecard filter
    const scorecardFilter = document.getElementById('scorecard-filter');
    if (scorecardFilter && scorecardFilter.value) {
        console.log('✅ Triggering scorecard filter change event');
        // Create and dispatch a change event on the scorecard filter
        const event = new Event('change', { bubbles: true });
        scorecardFilter.dispatchEvent(event);
        return;
    }
    
    // Method 2: Try to find and trigger the existing KPI loading function
    if (typeof window.loadKpiData === 'function') {
        console.log('✅ Calling loadKpiData function');
        window.loadKpiData();
        return;
    }
    
    // Method 3: Try to find any function that updates KPI table
    const possibleFunctions = ['updateKpiTable', 'refreshKpiData', 'loadPeriod', 'renderKpiEntries'];
    for (let funcName of possibleFunctions) {
        if (typeof window[funcName] === 'function') {
            console.log('✅ Calling function:', funcName);
            window[funcName]();
            return;
        }
    }
    
    // Method 4: Try to find and click any "Load" or "Update" button
    const buttons = document.querySelectorAll('button');
    for (let btn of buttons) {
        const btnText = btn.textContent.toLowerCase();
        if (btnText.includes('load') || btnText.includes('update') || btnText.includes('refresh')) {
            console.log('✅ Clicking button:', btn.textContent);
            btn.click();
            return;
        }
    }
    
    console.log('⚠️ Could not find KPI table update functionality');
} 