-- Migration 005: Add extraction method and cost tracking to autoland_reports
-- This migration tracks hybrid parser metrics for cost analysis

-- Add extraction method tracking
ALTER TABLE autoland_reports
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(20)
DEFAULT 'document-ai'
CHECK (extraction_method IN ('pdf2json', 'document-ai'));

-- Add cost tracking
ALTER TABLE autoland_reports
ADD COLUMN IF NOT EXISTS extraction_cost DECIMAL(10, 4)
DEFAULT 0.0000
NOT NULL;

ALTER TABLE autoland_reports
ADD COLUMN IF NOT EXISTS extraction_cost_saved DECIMAL(10, 4)
DEFAULT 0.0000
NOT NULL;

-- Add index for analytics
CREATE INDEX IF NOT EXISTS idx_autoland_reports_extraction_method
ON autoland_reports(extraction_method);

CREATE INDEX IF NOT EXISTS idx_autoland_reports_extraction_cost
ON autoland_reports(extraction_cost);

-- Add comment
COMMENT ON COLUMN autoland_reports.extraction_method IS 'Method used for PDF text extraction: pdf2json (free) or document-ai (paid)';
COMMENT ON COLUMN autoland_reports.extraction_cost IS 'Actual cost in USD for extracting this PDF';
COMMENT ON COLUMN autoland_reports.extraction_cost_saved IS 'Cost saved in USD by using free extraction method';
