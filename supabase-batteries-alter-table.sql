-- ALTER TABLE for batteries - Add is_active column if it doesn't exist
-- This migration ensures the batteries table has the is_active column for active/inactive functionality
-- Run this SQL in your Supabase SQL Editor

-- Method 1: Using DO block (PostgreSQL specific - checks if column exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'batteries' 
    AND column_name = 'is_active'
  ) THEN
    -- Add the column with default value
    ALTER TABLE batteries 
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_batteries_is_active ON batteries(is_active);
    
    -- Update any NULL values to TRUE (shouldn't happen with NOT NULL, but just in case)
    UPDATE batteries SET is_active = TRUE WHERE is_active IS NULL;
    
    RAISE NOTICE 'Column is_active added successfully';
  ELSE
    RAISE NOTICE 'Column is_active already exists';
  END IF;
END $$;

-- Method 2: Simpler approach (if column might not exist, use this)
-- Note: This will fail if column already exists, so use Method 1 if unsure
-- ALTER TABLE batteries ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Create index for performance (idempotent - safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_batteries_is_active ON batteries(is_active);

-- Add comment to column
COMMENT ON COLUMN batteries.is_active IS 'Active status flag - FALSE means battery is inactive/hidden from calculators. TRUE means battery is active and visible.';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'batteries' 
AND column_name = 'is_active';

