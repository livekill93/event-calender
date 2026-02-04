import { getDatabase } from '../config/database';

export interface Channel {
  id?: number;
  game_name: string;
  channel_url: string;
  channel_id: string;
  created_at?: string;
  updated_at?: string;
}

export class ChannelModel {
  // Create a new channel
  static create(channel: Channel): Channel {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO channels (game_name, channel_url, channel_id)
      VALUES (?, ?, ?)
    `);

    try {
      const result = stmt.run(channel.game_name, channel.channel_url, channel.channel_id);
      return {
        id: result.lastInsertRowid as number,
        ...channel
      };
    } catch (error) {
      throw new Error(`Failed to create channel: ${(error as Error).message}`);
    }
  }

  // Get all channels
  static getAll(): Channel[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM channels ORDER BY created_at DESC');
    return stmt.all() as Channel[];
  }

  // Get channel by ID
  static getById(id: number): Channel | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM channels WHERE id = ?');
    return (stmt.get(id) as Channel) || null;
  }

  // Get channel by channel_id
  static getByChannelId(channelId: string): Channel | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM channels WHERE channel_id = ?');
    return (stmt.get(channelId) as Channel) || null;
  }

  // Get channel by game name
  static getByGameName(gameName: string): Channel | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM channels WHERE game_name = ?');
    return (stmt.get(gameName) as Channel) || null;
  }

  // Update channel
  static update(id: number, channel: Partial<Channel>): Channel | null {
    const db = getDatabase();
    const existing = this.getById(id);

    if (!existing) {
      return null;
    }

    const stmt = db.prepare(`
      UPDATE channels 
      SET game_name = ?, channel_url = ?, channel_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      channel.game_name || existing.game_name,
      channel.channel_url || existing.channel_url,
      channel.channel_id || existing.channel_id,
      id
    );

    return this.getById(id);
  }

  // Delete channel
  static delete(id: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM channels WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Check if channel exists by channel_id
  static exists(channelId: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('SELECT 1 FROM channels WHERE channel_id = ?');
    return stmt.get(channelId) !== undefined;
  }
}
