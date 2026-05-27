-- =====================================================
-- SAFE MIGRATION - Fix Admissions Schema Without Data Loss
-- Preserves existing data and schools
-- =====================================================

-- Ensure admissions table exists with all required columns
-- This migration is SAFE and will preserve all existing data

BEGIN;

-- Verify admissions table structure (safe, won't drop)
DO $$
BEGIN
  -- Ensure all required columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='id') THEN
    ALTER TABLE public.admissions ADD COLUMN id bigint generated always as identity primary key;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='emis') THEN
    ALTER TABLE public.admissions ADD COLUMN emis text not null;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='schoolname') THEN
    ALTER TABLE public.admissions ADD COLUMN schoolName text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='districtnumber') THEN
    ALTER TABLE public.admissions ADD COLUMN districtNumber text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='yearadmission') THEN
    ALTER TABLE public.admissions ADD COLUMN yearAdmission integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='dateofadmission') THEN
    ALTER TABLE public.admissions ADD COLUMN dateOfAdmission text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='childname') THEN
    ALTER TABLE public.admissions ADD COLUMN childName text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='sex') THEN
    ALTER TABLE public.admissions ADD COLUMN sex text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='dateofbirth') THEN
    ALTER TABLE public.admissions ADD COLUMN dateOfBirth text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='ageyears') THEN
    ALTER TABLE public.admissions ADD COLUMN ageYears integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='specialneeds') THEN
    ALTER TABLE public.admissions ADD COLUMN specialNeeds text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='origindistrict') THEN
    ALTER TABLE public.admissions ADD COLUMN originDistrict text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='religiousdenomination') THEN
    ALTER TABLE public.admissions ADD COLUMN religiousDenomination text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='orphanstatus') THEN
    ALTER TABLE public.admissions ADD COLUMN orphanStatus text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='ecdattendance') THEN
    ALTER TABLE public.admissions ADD COLUMN ecdAttendance text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='cinnumber') THEN
    ALTER TABLE public.admissions ADD COLUMN cinNumber text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='parentguardianname') THEN
    ALTER TABLE public.admissions ADD COLUMN parentGuardianName text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='parentguardianphone') THEN
    ALTER TABLE public.admissions ADD COLUMN parentGuardianPhone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='headteachername') THEN
    ALTER TABLE public.admissions ADD COLUMN headTeacherName text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='headteacherphone') THEN
    ALTER TABLE public.admissions ADD COLUMN headTeacherPhone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='lin') THEN
    ALTER TABLE public.admissions ADD COLUMN lin text not null;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='zemisofficername') THEN
    ALTER TABLE public.admissions ADD COLUMN zemisOfficerName text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='zemisofficerdate') THEN
    ALTER TABLE public.admissions ADD COLUMN zemisOfficerDate date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='zemisofficerphone') THEN
    ALTER TABLE public.admissions ADD COLUMN zemisOfficerPhone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='timestamp') THEN
    ALTER TABLE public.admissions ADD COLUMN timestamp timestamptz default now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admissions' AND column_name='zone') THEN
    ALTER TABLE public.admissions ADD COLUMN zone text;
  END IF;
END $$;

-- Ensure admission_exports table structure (safe, won't drop)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admission_exports' AND column_name='id') THEN
    ALTER TABLE public.admission_exports ADD COLUMN id bigint generated always as identity primary key;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admission_exports' AND column_name='schoolemis') THEN
    ALTER TABLE public.admission_exports ADD COLUMN schoolEmis text not null;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admission_exports' AND column_name='schoolname') THEN
    ALTER TABLE public.admission_exports ADD COLUMN schoolName text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admission_exports' AND column_name='filename') THEN
    ALTER TABLE public.admission_exports ADD COLUMN filename text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admission_exports' AND column_name='filebase64') THEN
    ALTER TABLE public.admission_exports ADD COLUMN fileBase64 text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admission_exports' AND column_name='totallearners') THEN
    ALTER TABLE public.admission_exports ADD COLUMN totalLearners integer default 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admission_exports' AND column_name='timestamp') THEN
    ALTER TABLE public.admission_exports ADD COLUMN timestamp timestamptz default now();
  END IF;
END $$;

COMMIT;
