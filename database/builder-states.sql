-- Media Kit Builder - Builder States Database Schema
-- Phase 3: User Interface (Days 11-12)
-- 
-- Creates the database table for storing builder states with auto-save and undo/redo functionality
-- Following Nuclear Efficiency Architecture principles

-- Create builder states table
CREATE TABLE IF NOT EXISTS {prefix}mkb_builder_states (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    user_id bigint(20) NOT NULL,
    media_kit_id bigint(20) DEFAULT 0,
    state_data longtext NOT NULL,
    save_type varchar(20) NOT NULL DEFAULT 'manual',
    session_id varchar(255) DEFAULT '',
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX user_id_idx (user_id),
    INDEX media_kit_id_idx (media_kit_id),
    INDEX save_type_idx (save_type),
    INDEX session_id_idx (session_id),
    INDEX created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create state history table for detailed undo/redo tracking
CREATE TABLE IF NOT EXISTS {prefix}mkb_state_history (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    state_id bigint(20) NOT NULL,
    user_id bigint(20) NOT NULL,
    action_type varchar(50) NOT NULL,
    state_data longtext NOT NULL,
    diff_data text DEFAULT NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX state_id_idx (state_id),
    INDEX user_id_idx (user_id),
    INDEX action_type_idx (action_type),
    INDEX created_at_idx (created_at),
    FOREIGN KEY (state_id) REFERENCES {prefix}mkb_builder_states(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create state performance metrics table
CREATE TABLE IF NOT EXISTS {prefix}mkb_state_metrics (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    user_id bigint(20) NOT NULL,
    session_id varchar(255) NOT NULL,
    metric_type varchar(50) NOT NULL,
    metric_value decimal(10,4) NOT NULL,
    metadata json DEFAULT NULL,
    recorded_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX user_id_idx (user_id),
    INDEX session_id_idx (session_id),
    INDEX metric_type_idx (metric_type),
    INDEX recorded_at_idx (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create state conflicts table for tracking resolution
CREATE TABLE IF NOT EXISTS {prefix}mkb_state_conflicts (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    user_id bigint(20) NOT NULL,
    session_id varchar(255) NOT NULL,
    conflict_type varchar(50) NOT NULL,
    current_state longtext NOT NULL,
    incoming_state longtext NOT NULL,
    resolution_type varchar(50) DEFAULT NULL,
    resolved_state longtext DEFAULT NULL,
    resolved_at datetime DEFAULT NULL,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX user_id_idx (user_id),
    INDEX session_id_idx (session_id),
    INDEX conflict_type_idx (conflict_type),
    INDEX created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default builder state configuration
INSERT IGNORE INTO {prefix}options (option_name, option_value, autoload) VALUES
('mkb_builder_state_config', '{"max_history":50,"autosave_interval":30,"cleanup_days":30,"performance_tracking":true}', 'yes'),
('mkb_builder_state_version', '1.0.0', 'yes');

-- Create indexes for better performance
CREATE INDEX idx_mkb_states_user_recent ON {prefix}mkb_builder_states (user_id, created_at DESC);
CREATE INDEX idx_mkb_states_autosave_cleanup ON {prefix}mkb_builder_states (save_type, created_at);
CREATE INDEX idx_mkb_history_user_recent ON {prefix}mkb_state_history (user_id, created_at DESC);
CREATE INDEX idx_mkb_metrics_session_type ON {prefix}mkb_state_metrics (session_id, metric_type);
