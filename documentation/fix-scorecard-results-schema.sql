-- Fix Scorecard Results Schema
-- Add missing columns to scorecard_results table

-- Add missing columns for submission and approval tracking
ALTER TABLE scorecard_results 
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';

-- Add comments to document the new columns
COMMENT ON COLUMN scorecard_results.submitted_by IS 'Name of the user who submitted the scorecard';
COMMENT ON COLUMN scorecard_results.approved_by IS 'Name of the user who approved the scorecard';
COMMENT ON COLUMN scorecard_results.approved_at IS 'Timestamp when the scorecard was approved';
COMMENT ON COLUMN scorecard_results.status IS 'Current status: draft, submitted, approved';

-- Update existing records to have proper status
UPDATE scorecard_results 
SET status = 'submitted' 
WHERE submitted_at IS NOT NULL AND status IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'scorecard_results' 
ORDER BY ordinal_position;

-- Show sample data to verify structure
SELECT id, scorecard_id, user_id, period_month, period_year, status, submitted_by, approved_by, submitted_at, approved_at
FROM scorecard_results 
LIMIT 5; 