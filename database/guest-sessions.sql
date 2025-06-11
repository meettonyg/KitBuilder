-- Media Kit Builder Database Schema
-- Guest Sessions and Supporting Tables
-- Version: 1.0
-- Created: Phase 1 Implementation

-- Guest Sessions Table
-- Stores temporary session data for non-registered users
-- Supports 7-day guest sessions with automatic cleanup
CREATE TABLE IF NOT EXISTS `{prefix}mkb_guest_sessions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) NOT NULL COMMENT 'Unique session identifier',
  `user_id` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID if session is migrated',
  `kit_data` longtext COMMENT 'JSON encoded media kit data',
  `metadata` longtext COMMENT 'Additional session metadata',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Client IP address',
  `user_agent` text COMMENT 'Client user agent string',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Session creation timestamp',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  `expires_at` datetime NOT NULL COMMENT 'Session expiration timestamp',
  `status` enum('active','migrated','expired') DEFAULT 'active' COMMENT 'Session status',
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `user_id` (`user_id`),
  KEY `expires_at` (`expires_at`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  KEY `ip_address` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Guest session storage for Nuclear Efficiency Architecture';

-- Templates Table
-- Stores predefined and custom media kit templates
CREATE TABLE IF NOT EXISTS `{prefix}mkb_templates` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'Template display name',
  `slug` varchar(255) NOT NULL COMMENT 'URL-friendly template identifier',
  `description` text COMMENT 'Template description',
  `template_data` longtext COMMENT 'JSON encoded template structure',
  `preview_url` varchar(500) DEFAULT NULL COMMENT 'Template preview image URL',
  `category` varchar(100) DEFAULT 'general' COMMENT 'Template category',
  `is_premium` tinyint(1) DEFAULT 0 COMMENT 'Premium template flag',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Template active status',
  `sort_order` int(11) DEFAULT 0 COMMENT 'Display sort order',
  `created_by` bigint(20) unsigned DEFAULT NULL COMMENT 'Template creator user ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category` (`category`),
  KEY `is_premium` (`is_premium`),
  KEY `is_active` (`is_active`),
  KEY `sort_order` (`sort_order`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Media kit templates registry';

-- Media Kits Table
-- Stores user-created media kits
CREATE TABLE IF NOT EXISTS `{prefix}mkb_media_kits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'Kit owner user ID',
  `session_id` varchar(255) DEFAULT NULL COMMENT 'Original guest session ID',
  `title` varchar(255) NOT NULL COMMENT 'Media kit title',
  `slug` varchar(255) NOT NULL COMMENT 'URL-friendly kit identifier',
  `kit_data` longtext COMMENT 'JSON encoded kit content',
  `template_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Base template ID',
  `status` enum('draft','published','private') DEFAULT 'draft' COMMENT 'Kit publication status',
  `share_token` varchar(64) DEFAULT NULL COMMENT 'Unique sharing token',
  `view_count` bigint(20) unsigned DEFAULT 0 COMMENT 'Public view counter',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` datetime DEFAULT NULL COMMENT 'Publication timestamp',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_slug` (`user_id`, `slug`),
  UNIQUE KEY `share_token` (`share_token`),
  KEY `user_id` (`user_id`),
  KEY `session_id` (`session_id`),
  KEY `template_id` (`template_id`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `fk_media_kits_user` FOREIGN KEY (`user_id`) REFERENCES `{prefix}users` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_media_kits_template` FOREIGN KEY (`template_id`) REFERENCES `{prefix}mkb_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User media kits storage';

-- Analytics Table
-- Tracks user interactions and component usage
CREATE TABLE IF NOT EXISTS `{prefix}mkb_analytics` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) DEFAULT NULL COMMENT 'Session identifier',
  `user_id` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID if logged in',
  `action_type` varchar(100) NOT NULL COMMENT 'Action performed',
  `component_type` varchar(100) DEFAULT NULL COMMENT 'Component involved',
  `template_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Template ID if applicable',
  `kit_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Media kit ID if applicable',
  `metadata` json DEFAULT NULL COMMENT 'Additional action metadata',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Client IP address',
  `user_agent` text COMMENT 'Client user agent',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `user_id` (`user_id`),
  KEY `action_type` (`action_type`),
  KEY `component_type` (`component_type`),
  KEY `template_id` (`template_id`),
  KEY `kit_id` (`kit_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User interaction analytics';

-- Component Cache Table
-- Caches rendered component HTML for performance
CREATE TABLE IF NOT EXISTS `{prefix}mkb_component_cache` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cache_key` varchar(255) NOT NULL COMMENT 'Unique cache identifier',
  `component_type` varchar(100) NOT NULL COMMENT 'Component type',
  `component_data` longtext COMMENT 'Component configuration',
  `rendered_html` longtext COMMENT 'Cached HTML output',
  `expires_at` datetime NOT NULL COMMENT 'Cache expiration time',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cache_key` (`cache_key`),
  KEY `component_type` (`component_type`),
  KEY `expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Component rendering cache';

-- WP Fusion Tag Mappings Table
-- Maps WP Fusion tags to feature access levels
CREATE TABLE IF NOT EXISTS `{prefix}mkb_wpfusion_mappings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tag_id` varchar(100) NOT NULL COMMENT 'WP Fusion tag ID',
  `tag_name` varchar(255) NOT NULL COMMENT 'WP Fusion tag name',
  `access_level` varchar(100) NOT NULL COMMENT 'Access level granted',
  `features` json DEFAULT NULL COMMENT 'Enabled features array',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Mapping active status',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tag_id` (`tag_id`),
  KEY `access_level` (`access_level`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='WP Fusion tag to access mappings';

-- Session Migration Log
-- Tracks guest session to user account migrations
CREATE TABLE IF NOT EXISTS `{prefix}mkb_session_migrations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) NOT NULL COMMENT 'Original guest session ID',
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'Target user ID',
  `migration_type` enum('registration','login') DEFAULT 'registration' COMMENT 'Migration trigger',
  `data_migrated` json DEFAULT NULL COMMENT 'Migrated data summary',
  `migration_status` enum('pending','completed','failed') DEFAULT 'pending',
  `error_message` text DEFAULT NULL COMMENT 'Error details if failed',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `user_id` (`user_id`),
  KEY `migration_status` (`migration_status`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `fk_migrations_user` FOREIGN KEY (`user_id`) REFERENCES `{prefix}users` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Session migration tracking';

-- Indexes for Performance Optimization

-- Guest Sessions Performance Indexes
CREATE INDEX idx_guest_sessions_cleanup ON `{prefix}mkb_guest_sessions` (`status`, `expires_at`);
CREATE INDEX idx_guest_sessions_active ON `{prefix}mkb_guest_sessions` (`status`, `updated_at`) WHERE `status` = 'active';

-- Analytics Performance Indexes  
CREATE INDEX idx_analytics_reporting ON `{prefix}mkb_analytics` (`created_at`, `action_type`, `user_id`);
CREATE INDEX idx_analytics_sessions ON `{prefix}mkb_analytics` (`session_id`, `created_at`);

-- Media Kits Performance Indexes
CREATE INDEX idx_media_kits_user_status ON `{prefix}mkb_media_kits` (`user_id`, `status`, `updated_at`);
CREATE INDEX idx_media_kits_public ON `{prefix}mkb_media_kits` (`status`, `published_at`) WHERE `status` = 'published';

-- Templates Performance Indexes
CREATE INDEX idx_templates_active ON `{prefix}mkb_templates` (`is_active`, `category`, `sort_order`) WHERE `is_active` = 1;

-- Component Cache Performance Indexes
CREATE INDEX idx_cache_cleanup ON `{prefix}mkb_component_cache` (`expires_at`);
CREATE INDEX idx_cache_type ON `{prefix}mkb_component_cache` (`component_type`, `expires_at`);

-- Initial Data Inserts

-- Default WP Fusion Tag Mappings (if WP Fusion is available)
INSERT INTO `{prefix}mkb_wpfusion_mappings` (`tag_name`, `tag_id`, `access_level`, `features`, `is_active`) VALUES
('Free User', 'free_user', 'free', '["basic_templates", "pdf_export_watermarked", "share_links"]', 1),
('Pro User', 'pro_user', 'pro', '["all_templates", "pdf_export_clean", "share_links", "custom_branding"]', 1),
('Agency User', 'agency_user', 'agency', '["all_templates", "pdf_export_clean", "share_links", "custom_branding", "white_label", "client_management"]', 1)
ON DUPLICATE KEY UPDATE 
  `tag_name` = VALUES(`tag_name`),
  `access_level` = VALUES(`access_level`),
  `features` = VALUES(`features`);

-- Default Settings
-- These will be inserted via WordPress options, not database inserts

-- Views for Common Queries

-- Active Guest Sessions View
CREATE OR REPLACE VIEW `{prefix}mkb_active_sessions` AS
SELECT 
  `session_id`,
  `kit_data`,
  `created_at`,
  `updated_at`,
  `expires_at`,
  TIMESTAMPDIFF(SECOND, `updated_at`, NOW()) as `seconds_since_update`
FROM `{prefix}mkb_guest_sessions`
WHERE `status` = 'active' AND `expires_at` > NOW();

-- User Media Kit Summary View
CREATE OR REPLACE VIEW `{prefix}mkb_user_kit_summary` AS
SELECT 
  u.`ID` as `user_id`,
  u.`display_name`,
  COUNT(mk.`id`) as `total_kits`,
  COUNT(CASE WHEN mk.`status` = 'published' THEN 1 END) as `published_kits`,
  COUNT(CASE WHEN mk.`status` = 'draft' THEN 1 END) as `draft_kits`,
  MAX(mk.`updated_at`) as `last_activity`
FROM `{prefix}users` u
LEFT JOIN `{prefix}mkb_media_kits` mk ON u.`ID` = mk.`user_id`
GROUP BY u.`ID`, u.`display_name`;

-- Popular Templates View
CREATE OR REPLACE VIEW `{prefix}mkb_popular_templates` AS
SELECT 
  t.`id`,
  t.`name`,
  t.`slug`,
  t.`category`,
  t.`is_premium`,
  COUNT(mk.`id`) as `usage_count`,
  COUNT(CASE WHEN mk.`status` = 'published' THEN 1 END) as `published_count`
FROM `{prefix}mkb_templates` t
LEFT JOIN `{prefix}mkb_media_kits` mk ON t.`id` = mk.`template_id`
WHERE t.`is_active` = 1
GROUP BY t.`id`, t.`name`, t.`slug`, t.`category`, t.`is_premium`
ORDER BY `usage_count` DESC;

-- Component Usage Analytics View
CREATE OR REPLACE VIEW `{prefix}mkb_component_analytics` AS
SELECT 
  `component_type`,
  COUNT(*) as `total_uses`,
  COUNT(DISTINCT `session_id`) as `unique_sessions`,
  COUNT(DISTINCT `user_id`) as `unique_users`,
  DATE(`created_at`) as `usage_date`
FROM `{prefix}mkb_analytics`
WHERE `action_type` = 'component_added'
  AND `created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY `component_type`, DATE(`created_at`)
ORDER BY `usage_date` DESC, `total_uses` DESC;

-- Triggers for Data Integrity

-- Auto-generate share tokens for published media kits
DELIMITER $$
CREATE TRIGGER `mkb_media_kit_share_token` 
BEFORE UPDATE ON `{prefix}mkb_media_kits`
FOR EACH ROW
BEGIN
  IF NEW.`status` = 'published' AND (OLD.`status` != 'published' OR NEW.`share_token` IS NULL) THEN
    SET NEW.`share_token` = SHA2(CONCAT(NEW.`user_id`, NEW.`slug`, NOW(), RAND()), 256);
    SET NEW.`published_at` = NOW();
  END IF;
END$$
DELIMITER ;

-- Clean up expired cache entries
DELIMITER $$
CREATE EVENT IF NOT EXISTS `mkb_cleanup_cache`
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
  DELETE FROM `{prefix}mkb_component_cache` WHERE `expires_at` < NOW();
END$$
DELIMITER ;

-- Clean up expired guest sessions (backup to cron job)
DELIMITER $$
CREATE EVENT IF NOT EXISTS `mkb_cleanup_expired_sessions`
ON SCHEDULE EVERY 6 HOUR
DO
BEGIN
  UPDATE `{prefix}mkb_guest_sessions` 
  SET `status` = 'expired' 
  WHERE `status` = 'active' AND `expires_at` < NOW();
  
  -- Archive expired sessions older than 30 days
  DELETE FROM `{prefix}mkb_guest_sessions` 
  WHERE `status` = 'expired' AND `expires_at` < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$
DELIMITER ;

-- Clean up old analytics data (keep 6 months)
DELIMITER $$
CREATE EVENT IF NOT EXISTS `mkb_cleanup_analytics`
ON SCHEDULE EVERY 1 WEEK
DO
BEGIN
  DELETE FROM `{prefix}mkb_analytics` 
  WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 6 MONTH);
END$$
DELIMITER ;

-- Schema Version Tracking
INSERT INTO `{prefix}options` (`option_name`, `option_value`, `autoload`) 
VALUES ('mkb_db_schema_version', '1.0', 'no')
ON DUPLICATE KEY UPDATE `option_value` = '1.0';

-- Schema Creation Complete
-- This schema supports the Nuclear Efficiency Architecture
-- with direct operations, single source of truth, and guest-first design
