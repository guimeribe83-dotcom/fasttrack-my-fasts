-- Add login streak columns to user_stats table
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS login_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_login_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date date;

-- Add comment for documentation
COMMENT ON COLUMN user_stats.login_streak IS 'Current consecutive days accessing the app';
COMMENT ON COLUMN user_stats.best_login_streak IS 'Best streak of consecutive days accessing the app';
COMMENT ON COLUMN user_stats.last_login_date IS 'Last date the user accessed the app';