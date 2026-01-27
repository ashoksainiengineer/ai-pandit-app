-- Migration: Add forensic_traits column to sessions table
-- Created: 2026-01-27

ALTER TABLE sessions ADD COLUMN forensicTraits TEXT;