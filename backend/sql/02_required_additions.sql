-- Run this AFTER your base schema script.
-- This patch adds missing DB structures required by current frontend API contract.

-- ==========================================================
-- 1) USER table additions for auth/profile endpoints
-- ==========================================================
ALTER TABLE "USER" ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE "USER" ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20);
ALTER TABLE "USER" ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255);
ALTER TABLE "USER" ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE "USER" ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE "USER" ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_email ON "USER"(email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_member_id ON "USER"(member_id);

-- ==========================================================
-- 2) OPD session additions for join-by-pin and queue
-- ==========================================================
ALTER TABLE OPD_SESSION ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
CREATE UNIQUE INDEX IF NOT EXISTS uq_opd_session_code ON OPD_SESSION(opd_code);

CREATE TABLE IF NOT EXISTS OPD_SESSION_PATIENT (
  opd_session_patient_id SERIAL PRIMARY KEY,
  opd_id INT REFERENCES OPD_SESSION(opd_id) ON UPDATE CASCADE ON DELETE CASCADE,
  patient_id INT REFERENCES PATIENT(patient_id) ON UPDATE CASCADE ON DELETE CASCADE,
  token INT NOT NULL,
  created_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_opd_patient_token UNIQUE (opd_id, token)
);

CREATE INDEX IF NOT EXISTS idx_opd_session_patient_opd_id ON OPD_SESSION_PATIENT(opd_id);
CREATE INDEX IF NOT EXISTS idx_opd_session_patient_patient_id ON OPD_SESSION_PATIENT(patient_id);

-- ==========================================================
-- 3) Lab test master + patient lab tests (consult endpoint)
-- ==========================================================
CREATE TABLE IF NOT EXISTS LAB_TEST (
  lab_test_id SERIAL PRIMARY KEY,
  lab_test_name VARCHAR(255) NOT NULL,
  lab_test_code VARCHAR(50),
  description TEXT,
  created_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS PATIENT_LAB_TEST (
  patient_lab_test_id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES PATIENT(patient_id) ON UPDATE CASCADE ON DELETE CASCADE,
  opd_id INT REFERENCES OPD_SESSION(opd_id) ON UPDATE CASCADE ON DELETE SET NULL,
  lab_test_id INT REFERENCES LAB_TEST(lab_test_id) ON UPDATE CASCADE ON DELETE SET NULL,
  doctor_id INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  status VARCHAR(50),
  notes TEXT,
  created_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_lab_test_patient_id ON PATIENT_LAB_TEST(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_lab_test_opd_id ON PATIENT_LAB_TEST(opd_id);

-- ==========================================================
-- 4) Consult header table to group diagnosis/lab/follow-up
-- ==========================================================
CREATE TABLE IF NOT EXISTS CONSULT (
  consult_id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES PATIENT(patient_id) ON UPDATE CASCADE ON DELETE CASCADE,
  opd_id INT REFERENCES OPD_SESSION(opd_id) ON UPDATE CASCADE ON DELETE SET NULL,
  doctor_id INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  follow_up VARCHAR(100),
  doctor_notes TEXT,
  created_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CONSULT_DIAGNOSIS (
  consult_diagnosis_id SERIAL PRIMARY KEY,
  consult_id INT REFERENCES CONSULT(consult_id) ON UPDATE CASCADE ON DELETE CASCADE,
  diagnosis_id INT REFERENCES DIAGNOSIS(diagnosis_id) ON UPDATE CASCADE ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CONSULT_LAB_TEST (
  consult_lab_test_id SERIAL PRIMARY KEY,
  consult_id INT REFERENCES CONSULT(consult_id) ON UPDATE CASCADE ON DELETE CASCADE,
  lab_test_id INT REFERENCES LAB_TEST(lab_test_id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consult_patient_id ON CONSULT(patient_id);
CREATE INDEX IF NOT EXISTS idx_consult_opd_id ON CONSULT(opd_id);

-- ==========================================================
-- 5) Medicine dispense endpoint support
-- ==========================================================
CREATE TABLE IF NOT EXISTS MEDICINE_MASTER (
  medicine_id SERIAL PRIMARY KEY,
  medicine_name VARCHAR(255) NOT NULL,
  medicine_code VARCHAR(50),
  description TEXT,
  created_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS PATIENT_MEDICINE (
  patient_medicine_id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES PATIENT(patient_id) ON UPDATE CASCADE ON DELETE CASCADE,
  opd_id INT REFERENCES OPD_SESSION(opd_id) ON UPDATE CASCADE ON DELETE SET NULL,
  medicine_id INT REFERENCES MEDICINE_MASTER(medicine_id) ON UPDATE CASCADE ON DELETE SET NULL,
  dosage VARCHAR(100),
  days INT,
  timing VARCHAR(100),
  notes TEXT,
  created_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_by INT REFERENCES "USER"(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_medicine_patient_id ON PATIENT_MEDICINE(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medicine_opd_id ON PATIENT_MEDICINE(opd_id);

-- ==========================================================
-- 6) Seed core vital types used by frontend payload
-- ==========================================================
INSERT INTO VITAL_TYPE (name, description, default_unit)
SELECT 'temp', 'Body temperature', 'F'
WHERE NOT EXISTS (SELECT 1 FROM VITAL_TYPE WHERE LOWER(name) = 'temp');

INSERT INTO VITAL_TYPE (name, description, default_unit)
SELECT 'pulse', 'Pulse rate', 'bpm'
WHERE NOT EXISTS (SELECT 1 FROM VITAL_TYPE WHERE LOWER(name) = 'pulse');

INSERT INTO VITAL_TYPE (name, description, default_unit)
SELECT 'bp', 'Blood pressure', 'mmHg'
WHERE NOT EXISTS (SELECT 1 FROM VITAL_TYPE WHERE LOWER(name) = 'bp');

INSERT INTO VITAL_TYPE (name, description, default_unit)
SELECT 'spo2', 'Oxygen saturation', '%'
WHERE NOT EXISTS (SELECT 1 FROM VITAL_TYPE WHERE LOWER(name) = 'spo2');

INSERT INTO VITAL_TYPE (name, description, default_unit)
SELECT 'blood_sugar', 'Blood sugar', 'mg/dL'
WHERE NOT EXISTS (SELECT 1 FROM VITAL_TYPE WHERE LOWER(name) = 'blood_sugar');
