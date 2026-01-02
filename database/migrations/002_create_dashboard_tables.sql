-- Dashboard Tables Migration
-- Version: 2.0
-- Created: 2025-12-27

-- ============================================
-- Table: dashboard_settings
-- Purpose: Store dashboard configuration settings
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_setting_not_empty CHECK (length(setting_key) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_settings_key ON dashboard_settings(setting_key);

-- Insert default settings
INSERT INTO dashboard_settings (setting_key, setting_value) VALUES
    ('due_soon_threshold', '7'),
    ('alert_recipients', '[]'),
    ('auto_refresh_interval', '60')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- Table: audit_log
-- Purpose: Audit trail for dashboard actions
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    user_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_action_not_empty CHECK (length(action) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- ============================================
-- Table: user_preferences (Optional - for future use)
-- Purpose: Store user-specific preferences
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    preferences JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_user_not_empty CHECK (length(user_id) > 0),
    CONSTRAINT check_preferences_not_empty CHECK (preferences IS NOT NULL)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add comment on tables
COMMENT ON TABLE dashboard_settings IS 'Stores dashboard configuration settings';
COMMENT ON TABLE audit_log IS 'Audit trail for dashboard actions and changes';
COMMENT ON TABLE user_preferences IS 'Stores user-specific preferences (optional)';

-- ============================================
-- Function: get_dashboard_setting
-- Purpose: Get a dashboard setting value
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_setting(p_key VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT setting_value INTO v_value
    FROM dashboard_settings
    WHERE setting_key = p_key;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Function: set_dashboard_setting
-- Purpose: Set or update a dashboard setting
-- ============================================
CREATE OR REPLACE FUNCTION set_dashboard_setting(
    p_key VARCHAR(100),
    p_value TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO dashboard_settings (setting_key, setting_value)
    VALUES (p_key, p_value)
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger: log_audit_action
-- Purpose: Automatically log changes to autoland_reports
-- ============================================
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            action,
            entity_type,
            entity_id,
            new_values,
            ip_address
        ) VALUES (
            'INSERT',
            'autoland_report',
            NEW.id::TEXT,
            jsonb_build_object(
                'report_number', NEW.report_number,
                'aircraft_reg', NEW.aircraft_reg,
                'result', NEW.result
            ),
            inet_client_addr()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            action,
            entity_type,
            entity_id,
            old_values,
            new_values,
            ip_address
        ) VALUES (
            'UPDATE',
            'autoland_report',
            NEW.id::TEXT,
            jsonb_build_object(
                'report_number', OLD.report_number,
                'aircraft_reg', OLD.aircraft_reg,
                'result', OLD.result
            ),
            jsonb_build_object(
                'report_number', NEW.report_number,
                'aircraft_reg', NEW.aircraft_reg,
                'result', NEW.result
            ),
            inet_client_addr()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            action,
            entity_type,
            entity_id,
            old_values,
            ip_address
        ) VALUES (
            'DELETE',
            'autoland_report',
            OLD.id::TEXT,
            jsonb_build_object(
                'report_number', OLD.report_number,
                'aircraft_reg', OLD.aircraft_reg,
                'result', OLD.result
            ),
            inet_client_addr()
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for autoland_reports
DROP TRIGGER IF EXISTS audit_autoland_reports ON autoland_reports;
CREATE TRIGGER audit_autoland_reports
    AFTER INSERT OR UPDATE OR DELETE ON autoland_reports
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_action();

