-- Migration: Add gcs_url column to resumes table if it doesn't exist

-- Check and add gcs_url column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resumes' AND column_name = 'gcs_url'
    ) THEN
        ALTER TABLE resumes ADD COLUMN gcs_url TEXT;
        RAISE NOTICE 'Added gcs_url column to resumes table';
    ELSE
        RAISE NOTICE 'gcs_url column already exists in resumes table';
    END IF;
END $$;
