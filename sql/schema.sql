-- ============================================================
-- COC_System — Database Schema (Step 1)
-- Run manually via phpMyAdmin against database `coc_system`.
-- NOTE: Balance is NEVER a stored column. It is always computed
-- as:  total_amount - COALESCE(SUM(payments.amount), 0)
-- ============================================================

CREATE DATABASE IF NOT EXISTS coc_system;
USE coc_system;

-- ------------------------------------------------------------
-- admin — system users who log in to manage the dashboard
-- ------------------------------------------------------------
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- event_categories
-- ------------------------------------------------------------
CREATE TABLE event_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Seed rows for categories
INSERT INTO event_categories (name) VALUES
  ('Wedding'),
  ('Debut'),
  ('Christening'),
  ('Funeral'),
  ('Meeting');

-- ------------------------------------------------------------
-- clients_events
-- Soft-delete strategy: a "deleted" client is updated with
-- is_active = FALSE. NEVER issue a hard DELETE against this
-- table — payment and staffing history must be preserved.
-- ------------------------------------------------------------
CREATE TABLE clients_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50),
  venue VARCHAR(255),
  program_time TIME,
  event_date DATE,
  deadline DATE,
  category_id INT NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  status ENUM('pending', 'partial', 'completed') DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clients_events_category
    FOREIGN KEY (category_id) REFERENCES event_categories(id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- payments — amounts received against an event.
-- Financial history is sacred: RESTRICT prevents an accidental
-- hard-delete of a parent event from destroying payment rows.
-- ------------------------------------------------------------
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date_received DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_event
    FOREIGN KEY (event_id) REFERENCES clients_events(id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- staff — crew members assignable to events
-- ------------------------------------------------------------
CREATE TABLE staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(100),
  contact_number VARCHAR(50)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- event_staff — many-to-many join between events and staff.
-- Same financial-history protection as payments.
-- ------------------------------------------------------------
CREATE TABLE event_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  staff_id INT NOT NULL,
  CONSTRAINT fk_event_staff_event
    FOREIGN KEY (event_id) REFERENCES clients_events(id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_event_staff_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB;