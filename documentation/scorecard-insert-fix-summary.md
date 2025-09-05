# Scorecard Insert Fix Summary

## Problem
When trying to fill KPI values from the calendar page, users were getting a duplicate key error:

```
Error inserting record into scorecard_results: 
Object { code: "23505", details: "Key (id)=(13) already exists.", hint: null, message: 'duplicate key value violates unique constraint "scorecard_results_pkey"' }
```

## Root Cause
The issue was caused by the code trying to insert a new scorecard result with an ID that already existed in the database. This happened because:

1. **Local storage data sync**: When local storage data was synced to Supabase, the existing scorecard_results with IDs 1, 2, and 3 were preserved
2. **ID conflicts**: When creating new scorecard results, the code was either:
   - Explicitly including an ID field that conflicted with existing records
   - Using data from local storage that contained hardcoded IDs

## Solution Applied

### 1. Fixed Calendar.js (`assets/js/calendar.js`)
**Lines 1800-1810**: Modified the `saveScorecardValues` method to remove any ID field before inserting:

```javascript
// Remove any ID field to let Supabase auto-generate
const { id, ...scorecardResultWithoutId } = scorecardResult;

// Debug: Log what we're about to insert
console.log('Scorecard result object before insert:', scorecardResult);
console.log('Scorecard result object after removing ID:', scorecardResultWithoutId);

await supabaseDataService.insert('scorecard_results', scorecardResultWithoutId);
```

**Lines 1830-1840**: Also fixed the local storage version to use `DB.add()` which generates IDs automatically:

```javascript
// Let DB.add generate the ID to avoid conflicts
const addedResult = DB.add('scorecard_results', newResult);
console.log('Scorecard values saved to local storage with ID:', addedResult.id);
```

### 2. Fixed Integration Manager (`assets/js/supabase/integration-manager.js`)
**Lines 360-370**: Modified the `createRecord` method to automatically remove ID fields for tables that should auto-generate IDs:

```javascript
// For tables that should auto-generate IDs, remove the ID field to avoid conflicts
if (['scorecard_results', 'reports'].includes(table) && record.id) {
    console.log(`Removing ID field for ${table} to let Supabase auto-generate`);
    console.log(`Original record ID: ${record.id}`);
    const { id, ...recordWithoutId } = record;
    record = recordWithoutId;
    console.log(`Record after ID removal:`, record);
}
```

## Testing
Created `test-scorecard-insert-fix.html` to verify the fix works:

1. **Test 1**: Direct Supabase insert (simulates calendar.js method)
2. **Test 2**: Integration manager insert (simulates kpi-data-entry.html method)
3. **Test 3**: Check existing data to see what's already in the database
4. **Test 4**: Clean up test data

## Files Modified
1. `assets/js/calendar.js` - Fixed saveScorecardValues method
2. `assets/js/supabase/integration-manager.js` - Fixed createRecord method
3. `test-scorecard-insert-fix.html` - Created test page (new file)

## Expected Result
- ✅ No more duplicate key errors when filling KPI values from calendar
- ✅ No more duplicate key errors when creating scorecard results via integration manager
- ✅ Supabase will auto-generate unique IDs for new scorecard results
- ✅ Local storage will use DB.add() to generate unique IDs

## How to Test
1. Open `calendar.html`
2. Navigate to a day with a scorecard task
3. Click on the scorecard task
4. Fill in KPI values
5. Click "Save" - should work without errors
6. Check console for debug logs showing ID removal

## Additional Notes
- The fix is backward compatible
- Existing data is not affected
- The fix applies to both Supabase and local storage operations
- Debug logging has been added to help identify any future issues 