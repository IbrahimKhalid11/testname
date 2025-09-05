-- Add responsible_person column to scorecards table
-- Execute this in your Supabase SQL editor

-- Add the responsible_person column to the scorecards table
ALTER TABLE scorecards 
ADD COLUMN IF NOT EXISTS responsible_person VARCHAR(255);

-- Add a comment for documentation
COMMENT ON COLUMN scorecards.responsible_person IS 'The person responsible for this scorecard';

-- Update the RLS policies to include the new column if needed
-- (The existing policies should work fine with the new column) 