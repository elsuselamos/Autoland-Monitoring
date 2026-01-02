-- Change visibility_rvr column from INTEGER to VARCHAR to support "CAVOK" and other string values
-- This allows storing "CAVOK" as a valid visibility value

ALTER TABLE autoland_reports 
ALTER COLUMN visibility_rvr TYPE VARCHAR(20);

-- Add comment
COMMENT ON COLUMN autoland_reports.visibility_rvr IS 'Visibility/RVR value - can be a number (as string) or "CAVOK"';

