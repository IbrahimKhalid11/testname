-- Add status column to scorecard_results table
-- This script adds a status column to track the approval workflow

-- Add the status column with a default value
ALTER TABLE scorecard_results 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved'));

-- Update existing records to have appropriate status based on submitted_at
UPDATE scorecard_results 
SET status = CASE 
    WHEN submitted_at IS NOT NULL THEN 'submitted'
    ELSE 'draft'
END
WHERE status IS NULL OR status = 'draft';

-- Add an index on status for better performance
CREATE INDEX IF NOT EXISTS idx_scorecard_results_status ON scorecard_results(status);

-- Add a comment to document the status values
COMMENT ON COLUMN scorecard_results.status IS 'Status of the scorecard: draft, submitted, or approved'; 