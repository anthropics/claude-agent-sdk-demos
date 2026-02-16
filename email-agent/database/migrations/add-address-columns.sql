-- Migration: Add address columns for DatabaseManager compatibility
-- Date: 2026-02-16
-- Description: Adds to_addresses, cc_addresses, and bcc_addresses columns to emails table
--              for compatibility with DatabaseManager while maintaining recipients table

-- Add the address columns (will be NULL for existing emails)
ALTER TABLE emails ADD COLUMN to_addresses TEXT;
ALTER TABLE emails ADD COLUMN cc_addresses TEXT;
ALTER TABLE emails ADD COLUMN bcc_addresses TEXT;

-- Populate from recipients table for existing emails
UPDATE emails
SET to_addresses = (
  SELECT GROUP_CONCAT(address, ', ')
  FROM recipients
  WHERE recipients.email_id = emails.id AND recipients.type = 'to'
),
cc_addresses = (
  SELECT GROUP_CONCAT(address, ', ')
  FROM recipients
  WHERE recipients.email_id = emails.id AND recipients.type = 'cc'
),
bcc_addresses = (
  SELECT GROUP_CONCAT(address, ', ')
  FROM recipients
  WHERE recipients.email_id = emails.id AND recipients.type = 'bcc'
)
WHERE EXISTS (SELECT 1 FROM recipients WHERE recipients.email_id = emails.id);

-- Display migration status
SELECT 'Migration completed: Added address columns to emails table' AS status;
SELECT COUNT(*) || ' emails updated with address data' AS info
FROM emails
WHERE to_addresses IS NOT NULL;
