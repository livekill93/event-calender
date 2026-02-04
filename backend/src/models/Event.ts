import { getDatabase } from '../config/database';

export interface Event {
  id?: number;
  event_id: string;
  game_name: string;
  title: string;
  description?: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  source_url: string;
  video_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class EventModel {
  // Create a new event
  static create(event: Event): Event {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO events 
      (event_id, game_name, title, description, start_date, end_date, source_url, video_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        event.event_id,
        event.game_name,
        event.title,
        event.description || null,
        event.start_date,
        event.end_date || null,
        event.source_url,
        event.video_id || null
      );

      return {
        id: result.lastInsertRowid as number,
        ...event
      };
    } catch (error) {
      throw new Error(`Failed to create event: ${(error as Error).message}`);
    }
  }

  // Get all events
  static getAll(): Event[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM events ORDER BY start_date ASC');
    return stmt.all() as Event[];
  }

  // Get events by game name
  static getByGameName(gameName: string): Event[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM events WHERE game_name = ? ORDER BY start_date ASC');
    return stmt.all(gameName) as Event[];
  }

  // Get events by date range
  static getByDateRange(startDate: string, endDate: string): Event[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM events 
      WHERE start_date <= ? AND (end_date IS NULL OR end_date >= ?)
      ORDER BY start_date ASC
    `);
    return stmt.all(endDate, startDate) as Event[];
  }

  // Get events for a specific month
  static getByMonth(year: number, month: number): Event[] {
    const db = getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const stmt = db.prepare(`
      SELECT * FROM events 
      WHERE start_date < ? AND (end_date IS NULL OR end_date >= ?)
      ORDER BY start_date ASC
    `);
    return stmt.all(endDate, startDate) as Event[];
  }

  // Get event by ID
  static getById(id: number): Event | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM events WHERE id = ?');
    return (stmt.get(id) as Event) || null;
  }

  // Get event by event_id
  static getByEventId(eventId: string): Event | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM events WHERE event_id = ?');
    return (stmt.get(eventId) as Event) || null;
  }

  // Update event
  static update(id: number, event: Partial<Event>): Event | null {
    const db = getDatabase();
    const existing = this.getById(id);

    if (!existing) {
      return null;
    }

    const stmt = db.prepare(`
      UPDATE events 
      SET game_name = ?, title = ?, description = ?, start_date = ?, end_date = ?, source_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      event.game_name || existing.game_name,
      event.title || existing.title,
      event.description || existing.description,
      event.start_date || existing.start_date,
      event.end_date || existing.end_date,
      event.source_url || existing.source_url,
      id
    );

    return this.getById(id);
  }

  // Delete event
  static delete(id: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Delete events by video_id
  static deleteByVideoId(videoId: string): number {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM events WHERE video_id = ?');
    const result = stmt.run(videoId);
    return result.changes;
  }

  // Check if event exists by event_id
  static exists(eventId: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('SELECT 1 FROM events WHERE event_id = ?');
    return stmt.get(eventId) !== undefined;
  }
}
