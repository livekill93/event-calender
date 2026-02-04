import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || './game_events.db';

let db: Database.Database;

export function initDatabase(): Database.Database {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  createTables();
  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function createTables(): void {
  const db = getDatabase();

  // Channels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_name TEXT NOT NULL UNIQUE,
      channel_url TEXT NOT NULL,
      channel_id TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Videos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      video_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      published_at DATETIME NOT NULL,
      video_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
    )
  `);

  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL UNIQUE,
      game_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE,
      source_url TEXT NOT NULL,
      video_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(video_id)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_channels_channel_id ON channels(channel_id);
    CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
    CREATE INDEX IF NOT EXISTS idx_events_game_name ON events(game_name);
    CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
  `);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
