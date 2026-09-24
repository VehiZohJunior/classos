-- ClasSos : schéma de la base (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher',      -- teacher | dev
  status TEXT NOT NULL DEFAULT 'active',     -- active | suspended
  civ TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  numbers TEXT NOT NULL DEFAULT '',          -- JSON : numéros d'urgence
  created_at INTEGER NOT NULL,
  last_login INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  join_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',       -- open | paused
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  name_key TEXT NOT NULL,
  matricule TEXT NOT NULL DEFAULT '',
  sang TEXT NOT NULL DEFAULT '',
  medical TEXT NOT NULL DEFAULT '',
  contacts TEXT NOT NULL,                    -- JSON [{nom, lien, tel}]
  edit_hash TEXT,                            -- jeton de modification de l'étudiant (haché)
  source TEXT NOT NULL DEFAULT 'student',    -- student | teacher
  consent_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_name ON students(class_id, name_key);

CREATE TABLE IF NOT EXISTS attempts (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
