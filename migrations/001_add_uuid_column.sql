-- Migration: Add uuid column to users table if it doesn't exist
-- This fixes the "column uuid does not exist" error

DO $$ 
BEGIN
    -- Check if uuid column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'uuid'
    ) THEN
        -- Add uuid column
        ALTER TABLE users ADD COLUMN uuid VARCHAR(255);
        
        -- Populate existing rows with their id as uuid
        UPDATE users SET uuid = id::text WHERE uuid IS NULL;
        
        -- Make it NOT NULL after populating
        ALTER TABLE users ALTER COLUMN uuid SET NOT NULL;
        
        -- Add unique constraint
        ALTER TABLE users ADD CONSTRAINT users_uuid_unique UNIQUE (uuid);
        
        RAISE NOTICE 'Successfully added uuid column to users table';
    ELSE
        RAISE NOTICE 'uuid column already exists in users table';
    END IF;
END $$;
