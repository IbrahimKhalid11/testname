# Scorecard Schema Fix Summary

## Problem Identified

The error message indicates that the `submitted_by` column doesn't exist in the `scorecard_results` table:

```
Error updating record in scorecard_results: 
Object { code: "PGRST204", details: null, hint: null, message: "Could not find the 'submitted_by' column of 'scorecard_results' in the schema cache" }
```

## Root Cause Analysis

After investigating the database schema and code, I found that the `scorecard_results` table is missing several columns that the application code expects:

### Missing Columns in Database Schema:
1. **`submitted_by`** - Name of the user who submitted the scorecard
2. **`approved_by`** - Name of the user who approved the scorecard  
3. **`approved_at`** - Timestamp when the scorecard was approved
4. **`status`** - Current status (draft, submitted, approved)

### Current Schema vs Expected Schema:

**Current Schema** (from `quick-setup-scorecard-tables.sql`):
```sql
CREATE TABLE IF NOT EXISTS scorecard_results (
    id SERIAL PRIMARY KEY,
    scorecard_id INTEGER REFERENCES scorecards(id) ON DELETE CASCADE,
    user_id INTEGER,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    period_year INTEGER NOT NULL,
    kpi_values JSONB NOT NULL DEFAULT '{}',
    total_score DECIMAL(5,2),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(scorecard_id, user_id, period_month, period_year)
);
```

**Expected Schema** (what the code needs):
```sql
CREATE TABLE IF NOT EXISTS scorecard_results (
    id SERIAL PRIMARY KEY,
    scorecard_id INTEGER REFERENCES scorecards(id) ON DELETE CASCADE,
    user_id INTEGER,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    period_year INTEGER NOT NULL,
    kpi_values JSONB NOT NULL DEFAULT '{}',
    total_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'draft',           -- MISSING
    submitted_by VARCHAR(255),                    -- MISSING
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by VARCHAR(255),                     -- MISSING
    approved_at TIMESTAMP WITH TIME ZONE,         -- MISSING
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(scorecard_id, user_id, period_month, period_year)
);
```

## Surgical Fix Applied

### 1. Database Schema Update
Created `fix-scorecard-results-schema.sql` to add the missing columns:

```sql
-- Add missing columns for submission and approval tracking
ALTER TABLE scorecard_results 
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';

-- Update existing records to have proper status
UPDATE scorecard_results 
SET status = 'submitted' 
WHERE submitted_at IS NOT NULL AND status IS NULL;
```

### 2. Test Page Created
Created `test-scorecard-schema-fix.html` to verify the fix works:
- Check current schema
- Test submit functionality
- Test approve functionality  
- View current data

## Implementation Steps

### Step 1: Apply Database Schema Fix
1. Open your Supabase SQL Editor
2. Copy and paste the contents of `fix-scorecard-results-schema.sql`
3. Click "Run" to execute the script
4. Verify the columns were added successfully

### Step 2: Test the Fix
1. Open `test-scorecard-schema-fix.html` in your browser
2. Click "Check Schema" to verify all required columns exist
3. Click "Test Submit" to verify submit functionality works
4. Click "Test Approve" to verify approve functionality works
5. Click "View Data" to see current scorecard results

### Step 3: Verify Calendar Functionality
1. Go to the calendar page
2. Try submitting a scorecard - should work without errors
3. Try approving a scorecard - should work without errors
4. Check that status updates are reflected in the calendar

## Expected Results After Fix

1. **Submit Button**: Should work without the "submitted_by column not found" error
2. **Approve Button**: Should work without the "approved_by column not found" error  
3. **Status Tracking**: Scorecards should properly track draft → submitted → approved status
4. **User Attribution**: Should track who submitted and who approved each scorecard
5. **Calendar Display**: Should show correct status indicators for each scorecard task

## Files Created/Modified

- **`fix-scorecard-results-schema.sql`** - Database schema fix script
- **`test-scorecard-schema-fix.html`** - Test page to verify the fix
- **`scorecard-schema-fix-summary.md`** - This documentation

## Verification Checklist

- [ ] Database schema updated with missing columns
- [ ] Submit functionality works without errors
- [ ] Approve functionality works without errors
- [ ] Status tracking works correctly
- [ ] Calendar displays correct task statuses
- [ ] User attribution is properly recorded

## Notes

- This is a **surgical fix** that only adds the missing columns without affecting existing data
- The fix uses `ADD COLUMN IF NOT EXISTS` to prevent errors if columns already exist
- Existing records will be updated to have 'submitted' status if they have a `submitted_at` timestamp
- The fix maintains backward compatibility with existing code 