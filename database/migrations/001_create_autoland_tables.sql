-- Autoland Monitoring Database Schema
-- Version: 1.0
-- Created: 2025-12-27

-- Drop tables if they exist (for clean recreation)
DROP TABLE IF EXISTS autoland_to_go CASCADE;
DROP TABLE IF EXISTS autoland_reports CASCADE;

-- ============================================
-- Table: autoland_reports
-- Purpose: Store autoland report data extracted from PDFs
-- ============================================
CREATE TABLE autoland_reports (
    id SERIAL PRIMARY KEY,
    
    -- Report Identification
    report_number VARCHAR(100) UNIQUE NOT NULL,
    aircraft_reg VARCHAR(20) NOT NULL,
    flight_number VARCHAR(20) NOT NULL,
    
    -- General Information
    airport VARCHAR(10) NOT NULL,
    runway VARCHAR(10) NOT NULL,
    captain VARCHAR(100),
    first_officer VARCHAR(100),
    date_utc DATE NOT NULL,
    time_utc TIME NOT NULL,
    datetime_utc TIMESTAMP NOT NULL,
    
    -- Data Section
    wind_velocity VARCHAR(20),
    td_point VARCHAR(10),
    tracking VARCHAR(10),
    qnh INTEGER,
    alignment VARCHAR(10),
    speed_control VARCHAR(10),
    temperature INTEGER,
    landing VARCHAR(10),
    aircraft_dropout VARCHAR(10),
    visibility_rvr INTEGER,
    other TEXT,
    
    -- Result
    result VARCHAR(20) NOT NULL CHECK (result IN ('SUCCESSFUL', 'UNSUCCESSFUL')),
    reasons TEXT,
    captain_signature VARCHAR(100),
    
    -- File Storage
    email_id VARCHAR(100),
    email_subject TEXT,
    email_sender VARCHAR(255),
    email_received_time TIMESTAMP,
    pdf_filename VARCHAR(255) NOT NULL,
    pdf_storage_path VARCHAR(500) NOT NULL,
    pdf_storage_bucket VARCHAR(100) NOT NULL,
    
    -- Processing Metadata
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extraction_status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (extraction_status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
    extraction_errors TEXT,
    raw_extracted_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for autoland_reports
CREATE INDEX idx_autoland_reports_aircraft_reg ON autoland_reports(aircraft_reg);
CREATE INDEX idx_autoland_reports_flight_number ON autoland_reports(flight_number);
CREATE INDEX idx_autoland_reports_date_utc ON autoland_reports(date_utc);
CREATE INDEX idx_autoland_reports_datetime_utc ON autoland_reports(datetime_utc);
CREATE INDEX idx_autoland_reports_result ON autoland_reports(result);
CREATE INDEX idx_autoland_reports_aircraft_date ON autoland_reports(aircraft_reg, date_utc);

-- ============================================
-- Table: autoland_to_go
-- Purpose: Store "To Go" calculations for each aircraft
-- ============================================
CREATE TABLE autoland_to_go (
    id SERIAL PRIMARY KEY,
    aircraft_reg VARCHAR(20) NOT NULL UNIQUE,
    last_autoland_date DATE NOT NULL,
    last_autoland_report_id INTEGER REFERENCES autoland_reports(id) ON DELETE SET NULL,
    next_required_date DATE NOT NULL,
    days_remaining INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ON_TIME', 'DUE_SOON', 'OVERDUE')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for autoland_to_go
CREATE INDEX idx_autoland_to_go_next_required_date ON autoland_to_go(next_required_date);
CREATE INDEX idx_autoland_to_go_status ON autoland_to_go(status);

-- Add comment on tables
COMMENT ON TABLE autoland_reports IS 'Stores autoland report data extracted from PDFs';
COMMENT ON TABLE autoland_to_go IS 'Stores "To Go" calculations for each aircraft';

-- ============================================
-- Function: update_updated_at
-- Purpose: Automatically update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_autoland_reports_updated_at
    BEFORE UPDATE ON autoland_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_autoland_to_go_updated_at
    BEFORE UPDATE ON autoland_to_go
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function: calculate_autoland_to_go
-- Purpose: Calculate "To Go" values for a given aircraft
-- ============================================
CREATE OR REPLACE FUNCTION calculate_autoland_to_go(p_aircraft_reg VARCHAR(20))
RETURNS TABLE (
    last_autoland_date DATE,
    last_autoland_report_id INTEGER,
    next_required_date DATE,
    days_remaining INTEGER,
    status VARCHAR(20)
) AS $$
DECLARE
    v_last_date DATE;
    v_last_report_id INTEGER;
    v_next_date DATE;
    v_days_remaining INTEGER;
    v_status VARCHAR(20);
BEGIN
    -- Get last autoland date
    SELECT ar.date_utc, ar.id
    INTO v_last_date, v_last_report_id
    FROM autoland_reports ar
    WHERE ar.aircraft_reg = p_aircraft_reg
    AND ar.result = 'SUCCESSFUL'
    ORDER BY ar.date_utc DESC
    LIMIT 1;
    
    -- If no successful autoland found, return NULL with proper types
    IF v_last_date IS NULL THEN
        RETURN QUERY SELECT 
            NULL::DATE, 
            NULL::INTEGER, 
            NULL::DATE, 
            NULL::INTEGER, 
            NULL::VARCHAR(20);
        RETURN;
    END IF;
    
    -- Calculate next required date (30 days from last autoland)
    v_next_date := v_last_date + INTERVAL '30 days';
    
    -- Calculate days remaining
    -- Cast to DATE to ensure proper subtraction, then convert to integer
    v_days_remaining := (v_next_date - CURRENT_DATE::DATE)::INTEGER;
    
    -- Determine status
    IF v_days_remaining < 0 THEN
        v_status := 'OVERDUE';
    ELSIF v_days_remaining <= 7 THEN
        v_status := 'DUE_SOON';
    ELSE
        v_status := 'ON_TIME';
    END IF;
    
    -- Return result
    RETURN QUERY SELECT v_last_date, v_last_report_id, v_next_date, v_days_remaining, v_status;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: sync_autoland_to_go
-- Purpose: Sync autoland_to_go table with autoland_reports
-- ============================================
CREATE OR REPLACE FUNCTION sync_autoland_to_go()
RETURNS VOID AS $$
DECLARE
    v_aircraft RECORD;
    v_to_go RECORD;
BEGIN
    -- For each unique aircraft
    FOR v_aircraft IN 
        SELECT DISTINCT aircraft_reg FROM autoland_reports
    LOOP
        -- Get "To Go" calculation
        SELECT * INTO v_to_go
        FROM calculate_autoland_to_go(v_aircraft.aircraft_reg)
        LIMIT 1;
        
        -- Update or insert into autoland_to_go
        IF EXISTS (
            SELECT 1 FROM autoland_to_go 
            WHERE aircraft_reg = v_aircraft.aircraft_reg
        ) THEN
            UPDATE autoland_to_go SET
                last_autoland_date = v_to_go.last_autoland_date,
                last_autoland_report_id = v_to_go.last_autoland_report_id,
                next_required_date = v_to_go.next_required_date,
                days_remaining = v_to_go.days_remaining,
                status = v_to_go.status,
                updated_at = CURRENT_TIMESTAMP
            WHERE aircraft_reg = v_aircraft.aircraft_reg;
        ELSE
            INSERT INTO autoland_to_go (
                aircraft_reg,
                last_autoland_date,
                last_autoland_report_id,
                next_required_date,
                days_remaining,
                status
            ) VALUES (
                v_aircraft.aircraft_reg,
                v_to_go.last_autoland_date,
                v_to_go.last_autoland_report_id,
                v_to_go.next_required_date,
                v_to_go.days_remaining,
                v_to_go.status
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

