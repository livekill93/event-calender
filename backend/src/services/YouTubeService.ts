import axios, { AxiosError } from 'axios';
import * as xml2js from 'xml2js';
import * as cheerio from 'cheerio';
import { YouTubeVideo, extractChannelIdFromUrl, generateRssFeedUrl } from '../config/youtube';
import { getDatabase } from '../config/database';

// Regular expressions for date pattern matching
const DATE_PATTERNS = {
  ISO_DATE: /\d{4}-\d{2}-\d{2}/g, // YYYY-MM-DD
  DOT_DATE: /\d{4}\.\d{2}\.\d{2}/g, // YYYY.MM.DD
  SLASH_DATE: /\d{1,2}\/\d{1,2}/g, // MM/DD or M/D
  KOR_DATE: /(\d{1,2})월\s*(\d{1,2})일/g, // Korean format: N월 N일
};

// Keywords for event detection
const EVENT_KEYWORDS = [
  '이벤트',
  'event',
  '업데이트',
  'update',
  '점검',
  'maintenance',
  '패치',
  'patch',
  '시작',
  'start',
  '종료',
  'end',
  '보상',
  'reward',
  '업그레이드',
  'upgrade',
  '시즌',
  'season'
];

const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '10000', 10);

export class YouTubeService {
  /**
   * Extract channel ID from YouTube URL
   * Supports multiple URL formats: /channel/ID, /@handle, /c/custom, /user/username
   */
  static async getChannelId(channelUrl: string): Promise<string | null> {
    try {
      // First, try direct extraction
      const directId = extractChannelIdFromUrl(channelUrl);
      if (directId) {
        return directId;
      }

      // If direct extraction failed, fetch the channel page and extract from HTML
      console.log(`Attempting to extract channel ID from URL: ${channelUrl}`);
      return await this.extractChannelIdFromHtml(channelUrl);
    } catch (error) {
      console.error('Error extracting channel ID:', error);
      return null;
    }
  }

  /**
   * Extract channel ID from channel HTML page
   */
  private static async extractChannelIdFromHtml(channelUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(channelUrl, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const html = response.data;

      // Look for channel ID in various places
      // 1. In initial data JSON
      const jsonMatch = html.match(/"externalId":"([a-zA-Z0-9_-]{24})"/);
      if (jsonMatch && jsonMatch[1]) {
        return jsonMatch[1];
      }

      // 2. In browseEndpoint
      const browseMatch = html.match(/"browseId":"(UC[a-zA-Z0-9_-]{22})"/);
      if (browseMatch && browseMatch[1]) {
        return browseMatch[1];
      }

      // 3. In channel URL
      const urlMatch = html.match(/href="\/channel\/(UC[a-zA-Z0-9_-]{22})"/);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
      }

      return null;
    } catch (error) {
      console.error('Error extracting channel ID from HTML:', error);
      return null;
    }
  }

  /**
   * Fetch videos from YouTube RSS feed
   * Falls back to HTML crawling if RSS fails
   */
  static async fetchChannelVideos(channelId: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    try {
      // Try RSS first
      console.log(`Fetching videos from RSS for channel: ${channelId}`);
      const rssUrl = generateRssFeedUrl(channelId);
      const videos = await this.fetchFromRss(rssUrl, maxResults);

      if (videos.length > 0) {
        console.log(`Successfully fetched ${videos.length} videos from RSS`);
        return videos;
      }

      console.log('RSS returned no videos, attempting HTML crawl fallback');
    } catch (error) {
      console.warn('RSS fetch failed, attempting HTML fallback:', (error as Error).message);
    }

    // Fallback to HTML crawling
    try {
      console.log(`Fetching videos from HTML for channel: ${channelId}`);
      const videos = await this.fetchFromHtml(channelId, maxResults);
      console.log(`Successfully fetched ${videos.length} videos from HTML`);
      return videos;
    } catch (error) {
      console.error('HTML crawl also failed:', (error as Error).message);
      throw new Error(`Failed to fetch videos for channel ${channelId}`);
    }
  }

  /**
   * Fetch videos from YouTube RSS feed
   */
  private static async fetchFromRss(rssUrl: string, maxResults: number): Promise<YouTubeVideo[]> {
    const response = await axios.get(rssUrl, {
      timeout: REQUEST_TIMEOUT
    });

    const parser = new xml2js.Parser();
    const parsed = await parser.parseStringPromise(response.data);

    const videos: YouTubeVideo[] = [];
    const entries = parsed.feed?.entry || [];

    for (let i = 0; i < Math.min(entries.length, maxResults); i++) {
      const entry = entries[i];

      try {
        const videoId = entry['yt:videoId']?.[0];
        const title = entry.title?.[0];
        const description = entry.summary?.[0] || '';
        const publishedAt = entry.published?.[0];
        const thumbnail =
          entry['media:thumbnail']?.[0]?.['$']?.url ||
          `https://i.ytimg.com/vi/${videoId}/default.jpg`;

        if (videoId && title && publishedAt) {
          videos.push({
            videoId,
            title,
            description,
            publishedAt,
            channelTitle: entry['author']?.[0]?.['name']?.[0] || 'Unknown',
            thumbnail
          });
        }
      } catch (error) {
        console.warn('Error parsing RSS entry:', error);
        continue;
      }
    }

    return videos;
  }

  /**
   * Fetch videos from YouTube channel page HTML
   */
  private static async fetchFromHtml(channelId: string, maxResults: number): Promise<YouTubeVideo[]> {
    const channelUrl = `https://www.youtube.com/channel/${channelId}/videos`;

    const response = await axios.get(channelUrl, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const videos: YouTubeVideo[] = [];

    // Look for video links in the page
    $('a[href*="/watch?v="]')
      .slice(0, maxResults)
      .each((_index, element) => {
        try {
          const href = $(element).attr('href');
          if (!href) return;

          // Extract video ID from href
          const videoIdMatch = href.match(/v=([a-zA-Z0-9_-]{11})/);
          if (!videoIdMatch || !videoIdMatch[1]) return;

          const videoId = videoIdMatch[1];
          let title = $(element).attr('title') || $(element).text();

          // Clean title
          title = title.trim();
          if (!title) title = 'Untitled Video';

          videos.push({
            videoId,
            title,
            description: '',
            publishedAt: new Date().toISOString(),
            channelTitle: 'Unknown',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/default.jpg`
          });
        } catch (error) {
          console.warn('Error parsing video element:', error);
        }
      });

    return videos;
  }

  /**
   * Save video to database
   */
  static saveVideo(channelId: string, video: YouTubeVideo): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO videos (channel_id, video_id, title, description, published_at, video_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      channelId,
      video.videoId,
      video.title,
      video.description,
      video.publishedAt,
      `https://www.youtube.com/watch?v=${video.videoId}`
    );
  }
}

export class EventExtractor {
  /**
   * Check if text contains event keywords
   */
  static hasEventKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return EVENT_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Extract dates from text
   */
  static extractDates(text: string): string[] {
    const dates: string[] = [];

    // Extract ISO format dates (YYYY-MM-DD)
    const isoMatches = text.match(DATE_PATTERNS.ISO_DATE);
    if (isoMatches) {
      dates.push(...isoMatches);
    }

    // Extract dot format dates (YYYY.MM.DD)
    const dotMatches = text.match(DATE_PATTERNS.DOT_DATE);
    if (dotMatches) {
      dates.push(
        ...dotMatches.map(date => date.replace(/\./g, '-'))
      );
    }

    // Extract Korean date format (N월 N일)
    const korMatches = Array.from(text.matchAll(DATE_PATTERNS.KOR_DATE));
    const currentYear = new Date().getFullYear();
    korMatches.forEach(match => {
      const month = String(match[1]).padStart(2, '0');
      const day = String(match[2]).padStart(2, '0');
      dates.push(`${currentYear}-${month}-${day}`);
    });

    // Remove duplicates and invalid dates
    return Array.from(new Set(dates))
      .filter(date => this.isValidDate(date))
      .sort();
  }

  /**
   * Validate date format YYYY-MM-DD
   */
  static isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    const [year, month, day] = dateString.split('-').map(Number);

    // Basic validation
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    // Check if date is not too far in the past or future
    const date = new Date(dateString);
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    return date >= oneYearAgo && date <= oneYearFromNow;
  }

  /**
   * Extract events from video
   */
  static extractEvents(
    video: YouTubeVideo,
    gameName: string,
    channelId: string
  ): Array<{
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    sourceUrl: string;
    videoId: string;
  }> {
    const events: Array<{
      title: string;
      description: string;
      startDate: string;
      endDate?: string;
      sourceUrl: string;
      videoId: string;
    }> = [];

    // Check if video contains event keywords
    const fullText = `${video.title} ${video.description}`;
    if (!this.hasEventKeywords(fullText)) {
      return events;
    }

    // Extract dates
    const dates = this.extractDates(fullText);
    if (dates.length === 0) {
      // Even without dates, if keywords match, create event
      events.push({
        title: video.title,
        description: video.description,
        startDate: new Date(video.publishedAt).toISOString().split('T')[0],
        sourceUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        videoId: video.videoId
      });
      return events;
    }

    // Create events for each date found
    dates.forEach((date, index) => {
      events.push({
        title: video.title,
        description: video.description,
        startDate: date,
        endDate: dates[index + 1], // If there's another date, use it as end date
        sourceUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        videoId: video.videoId
      });
    });

    return events;
  }
}
