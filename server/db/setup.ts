import db from './index.js';

export function setupDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bible_versions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bible_verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      UNIQUE(version_id, book, chapter, verse),
      FOREIGN KEY (version_id) REFERENCES bible_versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verse_commentaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      historical_context TEXT,
      exegetical_meaning TEXT,
      practical_application TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(book, chapter, verse)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      profile_preferences TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reading_habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_identifier TEXT DEFAULT 'guest',
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      completed_at DATE NOT NULL DEFAULT (DATE('now')),
      UNIQUE(user_identifier, book, chapter, completed_at)
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_identifier TEXT PRIMARY KEY,
      current_streak INTEGER DEFAULT 0,
      last_completed_date DATE
    );

    CREATE TABLE IF NOT EXISTS user_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_identifier TEXT DEFAULT 'guest',
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER,
      note_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chapter_audio_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      version TEXT NOT NULL,
      audio_url TEXT NOT NULL,
      duration_seconds INTEGER,
      narrator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(book, chapter, version)
    );

    CREATE INDEX IF NOT EXISTS idx_bible_verses_lookup 
      ON bible_verses(version_id, book, chapter, verse);

    CREATE INDEX IF NOT EXISTS idx_chapter_audio_cache_lookup
      ON chapter_audio_cache(book, chapter, version);

    CREATE INDEX IF NOT EXISTS idx_verse_commentaries_lookup 
      ON verse_commentaries(book, chapter, verse);

    CREATE INDEX IF NOT EXISTS idx_reading_habits_user_date 
      ON reading_habits(user_identifier, completed_at);

    CREATE INDEX IF NOT EXISTS idx_user_notes_lookup 
      ON user_notes(user_identifier, book, chapter);

    CREATE INDEX IF NOT EXISTS idx_users_email 
      ON users(email);
  `);

  console.log('✅ SQLite schema initialized successfully in Hagah database.');
}

if (process.argv[1] && process.argv[1].endsWith('setup.ts')) {
  setupDatabase();
}
