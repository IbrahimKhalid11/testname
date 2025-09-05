-- Quick Setup: Scorecard Tables for Supabase
-- Copy and paste this entire script into your Supabase SQL Editor and click "Run"

-- 1. Scorecards Table
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
    user_id INTEGER,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scorecards_department ON scorecards(department);
CREATE INDEX IF NOT EXISTS idx_scorecards_active ON scorecards(is_active);
CREATE INDEX IF NOT EXISTS idx_kpis_scorecard_id ON kpis(scorecard_id);
CREATE INDEX IF NOT EXISTS idx_kpis_active ON kpis(is_active);
CREATE INDEX IF NOT EXISTS idx_assignments_user_period ON scorecard_assignments(user_id, period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_assignments_scorecard_period ON scorecard_assignments(scorecard_id, period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_results_user_period ON scorecard_results(user_id, period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_results_scorecard_period ON scorecard_results(scorecard_id, period_month, period_year);

-- Insert sample data for testing
INSERT INTO scorecards (id, name, description, department, created_by, created_at, updated_at, is_active, tags) VALUES
(1, 'Sales Performance Scorecard', 'Comprehensive KPI tracking for sales team performance', 'Sales', 1, '2025-06-01T10:00:00Z', '2025-06-01T10:00:00Z', true, ARRAY['sales', 'performance', 'quarterly']),
(2, 'Marketing Effectiveness Scorecard', 'Track marketing campaign performance and ROI metrics', 'Marketing', 1, '2025-06-01T11:00:00Z', '2025-06-01T11:00:00Z', true, ARRAY['marketing', 'campaigns', 'roi']),
(3, 'IT Operations Scorecard', 'Monitor IT infrastructure and service delivery metrics', 'IT', 1, '2025-06-01T12:00:00Z', '2025-06-01T12:00:00Z', true, ARRAY['it', 'operations', 'infrastructure'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO kpis (id, scorecard_id, name, description, weight, target, unit, linked_report_types, created_at, is_active) VALUES
(1, 1, 'Sales Revenue', 'Total sales revenue achieved', 30, 1000000, 'USD', ARRAY[1], '2025-06-01T10:00:00Z', true),
(2, 1, 'Customer Acquisition Rate', 'Number of new customers acquired', 25, 50, 'customers', ARRAY[1], '2025-06-01T10:00:00Z', true),
(3, 1, 'Sales Conversion Rate', 'Percentage of leads converted to sales', 20, 15, '%', ARRAY[1], '2025-06-01T10:00:00Z', true),
(4, 2, 'Social Media Engagement', 'Average engagement rate on social media posts', 35, 5, '%', ARRAY[2], '2025-06-01T11:00:00Z', true),
(5, 2, 'Campaign ROI', 'Return on investment for marketing campaigns', 40, 300, '%', ARRAY[2], '2025-06-01T11:00:00Z', true),
(6, 3, 'Server Uptime', 'Percentage of time servers are operational', 50, 99.9, '%', ARRAY[5], '2025-06-01T12:00:00Z', true),
(7, 3, 'Response Time', 'Average response time for IT support tickets', 30, 4, 'hours', ARRAY[5], '2025-06-01T12:00:00Z', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO scorecard_assignments (id, scorecard_id, user_id, department, period_month, period_year, can_edit, assigned_at, is_active) VALUES
(1, 1, 2, 'Sales', 6, 2025, true, '2025-06-01T10:00:00Z', true),
(2, 2, 3, 'Marketing', 6, 2025, true, '2025-06-01T11:00:00Z', true),
(3, 3, 1, 'IT', 6, 2025, true, '2025-06-01T12:00:00Z', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO scorecard_results (id, scorecard_id, user_id, period_month, period_year, kpi_values, total_score, submitted_at, created_at, updated_at) VALUES
(1, 1, 2, 6, 2025, '{"1": 950000, "2": 45, "3": 12}', 78.5, '2025-06-15T14:30:00Z', '2025-06-15T14:30:00Z', '2025-06-15T14:30:00Z'),
(2, 2, 3, 6, 2025, '{"4": 4.2, "5": 280}', 82.4, '2025-06-16T09:15:00Z', '2025-06-16T09:15:00Z', '2025-06-16T09:15:00Z'),
(3, 3, 1, 6, 2025, '{"6": 99.95, "7": 3.5}', 95.2, '2025-06-17T16:45:00Z', '2025-06-17T16:45:00Z', '2025-06-17T16:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- Verify tables were created
SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as scorecards_count FROM scorecards;
SELECT COUNT(*) as kpis_count FROM kpis;
SELECT COUNT(*) as assignments_count FROM scorecard_assignments;
SELECT COUNT(*) as results_count FROM scorecard_results; 