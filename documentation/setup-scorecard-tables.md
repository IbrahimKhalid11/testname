# Setup Guide: Creating Scorecard Tables in Supabase

## 🚨 Current Issue
The test page is showing errors because the new scorecard tables don't exist in your Supabase database yet. The errors show:
- `relation "public.kpis" does not exist`
- `relation "public.scorecard_results" does not exist`
- `relation "public.scorecards" does not exist`
- `relation "public.scorecard_assignments" does not exist`

## ✅ Solution: Create the Tables

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Execute the Schema
1. Copy the entire content from `scorecard-schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the schema

### Step 3: Verify Tables Created
After running the schema, you should see these tables in your **Table Editor**:
- `scorecards`
- `kpis`
- `scorecard_assignments`
- `scorecard_results`

## 🔧 Alternative: Quick Table Creation

If you want to create just the basic tables without all the advanced features, you can run this simplified version:

```sql
-- Quick setup for scorecard tables
CREATE TABLE IF NOT EXISTS scorecards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100) NOT NULL,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS kpis (
    id SERIAL PRIMARY KEY,
    scorecard_id INTEGER REFERENCES scorecards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight INTEGER NOT NULL DEFAULT 0,
    target DECIMAL(15,2) NOT NULL,
    unit VARCHAR(50),
    linked_report_types INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS scorecard_assignments (
    id SERIAL PRIMARY KEY,
    scorecard_id INTEGER REFERENCES scorecards(id) ON DELETE CASCADE,
    user_id INTEGER,
    department VARCHAR(100) NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    period_year INTEGER NOT NULL,
    can_edit BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(scorecard_id, user_id, period_month, period_year)
);

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

## 🧪 Test After Setup

1. **Refresh the test page** - `test-scorecard-data-models.html`
2. **Click "Test Supabase Integration"** - Should now show success messages
3. **Click "Sync from Supabase"** - Should sync the local data to Supabase
4. **Click "Sync to Supabase"** - Should sync Supabase data to local storage

## 📊 Expected Results

After creating the tables, you should see:
- ✅ **Supabase Integration**: Success messages for table retrieval
- ✅ **Data Sync**: Scorecards and KPIs syncing between local and cloud
- ✅ **No 404 Errors**: All table requests should succeed

## 🔍 Troubleshooting

### If tables still don't exist:
1. Check that you're in the correct Supabase project
2. Verify the SQL executed successfully (no error messages)
3. Refresh the Table Editor to see new tables

### If RLS policies cause issues:
1. The simplified schema above doesn't include RLS
2. For production, use the full `scorecard-schema.sql` with RLS policies

### If foreign key constraints fail:
1. Make sure the `users` table exists and has the correct structure
2. The simplified schema uses `INTEGER` instead of foreign key references

## 🎯 Next Steps

Once the tables are created and working:
1. **Phase 2**: Create the Scorecard Designer page
2. **Phase 3**: Build assignment management UI
3. **Phase 4**: Develop the scorecard dashboard

**The data foundation will be complete and ready for UI development! 🚀** 