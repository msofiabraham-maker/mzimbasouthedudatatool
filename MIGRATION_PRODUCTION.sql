-- =====================================================
-- PRODUCTION SAFE MIGRATION - Fix Schema
-- Run in Supabase SQL Editor
-- This migration PRESERVES all existing data
-- =====================================================

BEGIN TRANSACTION;

-- Add missing zone column to admissions if it doesn't exist
ALTER TABLE public.admissions
ADD COLUMN IF NOT EXISTS zone text;

-- Verify schema integrity
-- Run after migration:
-- SELECT COUNT(*) FROM admissions;
-- SELECT COUNT(*) FROM admission_exports;

COMMIT;
