-- Fix calculate_autoland_to_go function to properly cast NULL types
-- This fixes the error: "structure of query does not match function result type"

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
    -- Cast to DATE to ensure proper subtraction, then extract days from interval
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

