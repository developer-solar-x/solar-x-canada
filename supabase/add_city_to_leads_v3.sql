-- Migration: Add city column to leads_v3 table
-- This column was added to the schema but may not exist in the database yet

-- Add city column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'leads_v3' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE leads_v3 ADD COLUMN city TEXT;
    RAISE NOTICE 'Added city column to leads_v3 table';
  ELSE
    RAISE NOTICE 'city column already exists in leads_v3 table';
  END IF;
END $$;

