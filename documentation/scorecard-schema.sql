-- KPI Scorecard System Database Schema
-- Execute this in your Supabase SQL editor to create the new tables

-- 1. Scorecards Table
CREATE TABLE IF NOT EXISTS scorecards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100) NOT NULL,
    responsible_person VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[] DEFAULT '{}'
);

-- 2. KPIs Table
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

-- 3. Scorecard Assignments Table
CREATE TABLE IF NOT EXISTS scorecard_assignments (
    id SERIAL PRIMARY KEY,
    scorecard_id INTEGER REFERENCES scorecards(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    period_year INTEGER NOT NULL,
    can_edit BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(scorecard_id, user_id, period_month, period_year)
);

-- 4. Scorecard Results Table
CREATE TABLE IF NOT EXISTS scorecard_results (
    id SERIAL PRIMARY KEY,
    scorecard_id INTEGER REFERENCES scorecards(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    period_year INTEGER NOT NULL,
    kpi_values JSONB NOT NULL DEFAULT '{}',
    total_score DECIMAL(5,2),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(scorecard_id, user_id, period_month, period_year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scorecards_department ON scorecards(department);
CREATE INDEX IF NOT EXISTS idx_scorecards_active ON scorecards(is_active);
CREATE INDEX IF NOT EXISTS idx_kpis_scorecard_id ON kpis(scorecard_id);
CREATE INDEX IF NOT EXISTS idx_kpis_active ON kpis(is_active);
CREATE INDEX IF NOT EXISTS idx_assignments_user_period ON scorecard_assignments(user_id, period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_assignments_scorecard_period ON scorecard_assignments(scorecard_id, period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_results_user_period ON scorecard_results(user_id, period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_results_scorecard_period ON scorecard_results(scorecard_id, period_month, period_year);

-- Enable Row Level Security (RLS)
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Scorecards
CREATE POLICY "Users can view scorecards from their departments" ON scorecards
    FOR SELECT USING (
        department IN (
            SELECT department FROM users WHERE id = auth.uid()
            UNION
            SELECT unnest(departments) FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all scorecards" ON scorecards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policies for KPIs
CREATE POLICY "Users can view KPIs from their department scorecards" ON kpis
    FOR SELECT USING (
        scorecard_id IN (
            SELECT id FROM scorecards 
            WHERE department IN (
                SELECT department FROM users WHERE id = auth.uid()
                UNION
                SELECT unnest(departments) FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can manage all KPIs" ON kpis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policies for Scorecard Assignments
CREATE POLICY "Users can view their own assignments" ON scorecard_assignments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view assignments for their department" ON scorecard_assignments
    FOR SELECT USING (
        department IN (
            SELECT department FROM users WHERE id = auth.uid()
            UNION
            SELECT unnest(departments) FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all assignments" ON scorecard_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policies for Scorecard Results
CREATE POLICY "Users can view their own results" ON scorecard_results
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view results for their department" ON scorecard_results
    FOR SELECT USING (
        scorecard_id IN (
            SELECT id FROM scorecards 
            WHERE department IN (
                SELECT department FROM users WHERE id = auth.uid()
                UNION
                SELECT unnest(departments) FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own results" ON scorecard_results
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own results" ON scorecard_results
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all results" ON scorecard_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Create functions for common operations

-- Function to calculate KPI score
CREATE OR REPLACE FUNCTION calculate_kpi_score(target_value DECIMAL, actual_value DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF actual_value IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate percentage of target achieved, cap at 100%
    RETURN LEAST((actual_value / target_value) * 100, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total scorecard score
CREATE OR REPLACE FUNCTION calculate_scorecard_total_score(scorecard_id INTEGER, kpi_values JSONB)
RETURNS DECIMAL AS $$
DECLARE
    total_weight INTEGER := 0;
    weighted_score DECIMAL := 0;
    kpi_record RECORD;
    kpi_score DECIMAL;
    actual_value DECIMAL;
BEGIN
    -- Loop through all KPIs for the scorecard
    FOR kpi_record IN 
        SELECT id, weight, target 
        FROM kpis 
        WHERE scorecard_id = $1 AND is_active = TRUE
    LOOP
        -- Get actual value from kpi_values JSON
        actual_value := (kpi_values->>kpi_record.id::TEXT)::DECIMAL;
        
        IF actual_value IS NOT NULL THEN
            -- Calculate score for this KPI
            kpi_score := calculate_kpi_score(kpi_record.target, actual_value);
            
            -- Add to weighted total
            weighted_score := weighted_score + (kpi_score * kpi_record.weight);
            total_weight := total_weight + kpi_record.weight;
        END IF;
    END LOOP;
    
    -- Return weighted average
    IF total_weight > 0 THEN
        RETURN weighted_score / total_weight;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate total score when results are updated
CREATE OR REPLACE FUNCTION update_scorecard_total_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_score := calculate_scorecard_total_score(NEW.scorecard_id, NEW.kpi_values);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scorecard_total_score
    BEFORE INSERT OR UPDATE ON scorecard_results
    FOR EACH ROW
    EXECUTE FUNCTION update_scorecard_total_score();

-- Comments for documentation
COMMENT ON TABLE scorecards IS 'KPI scorecards for different departments and job positions';
COMMENT ON TABLE kpis IS 'Individual KPIs within scorecards with targets and weights';
COMMENT ON TABLE scorecard_assignments IS 'User assignments to scorecards for specific periods';
COMMENT ON TABLE scorecard_results IS 'Actual KPI values and calculated scores for users';
COMMENT ON FUNCTION calculate_kpi_score IS 'Calculate percentage score for a KPI based on actual vs target';
COMMENT ON FUNCTION calculate_scorecard_total_score IS 'Calculate weighted total score for a scorecard'; 