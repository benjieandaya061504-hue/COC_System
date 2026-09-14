// ============================================================
// COC_System — Migration 002: Add color column to event_categories
// Run manually via phpMyAdmin after schema.sql has been applied.
// Target database: coc_system
// ============================================================

ALTER TABLE event_categories
  ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '#4caf50'
  AFTER name;

-- Seed the 5 default categories with matching colors from the
-- frontend mockData (client/src/Modules/Events/mockData.js).
UPDATE event_categories SET color = '#e91e63' WHERE name = 'Wedding';
UPDATE event_categories SET color = '#9c27b0' WHERE name = 'Debut';
UPDATE event_categories SET color = '#03a9f4' WHERE name = 'Christening';
UPDATE event_categories SET color = '#607d8b' WHERE name = 'Funeral';
UPDATE event_categories SET color = '#4caf50' WHERE name = 'Meeting';