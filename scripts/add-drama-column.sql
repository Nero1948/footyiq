-- Run this in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE games ADD COLUMN IF NOT EXISTS drama TEXT;
