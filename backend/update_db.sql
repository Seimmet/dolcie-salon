-- SQL Migration Script
-- Purpose: Add customer_module_enabled toggle to salon_settings

-- 1. Add the column with a default value of true (enabled)
ALTER TABLE "salon_settings" 
ADD COLUMN IF NOT EXISTS "customer_module_enabled" BOOLEAN NOT NULL DEFAULT true;

-- 2. (Optional) Verify the change
-- SELECT customer_module_enabled FROM salon_settings LIMIT 1;
