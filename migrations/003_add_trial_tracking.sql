-- Migration: Add trial tracking columns to users table
-- This adds columns to track free trial usage (3 trials per user)

-- Add trial_uses column (tracks how many trials have been used)
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_uses INTEGER DEFAULT 0;

-- Add max_trial_uses column (max trials allowed, default 3)
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_trial_uses INTEGER DEFAULT 3;

-- Create index for efficient trial queries
CREATE INDEX IF NOT EXISTS idx_users_trial_uses ON users(trial_uses);
