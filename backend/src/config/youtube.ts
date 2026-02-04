// YouTube RSS and HTML Crawling Configuration

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  thumbnail: string;
}

// Extract channel ID from various YouTube URL formats
export function extractChannelIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Handle youtube.com URLs
    if (hostname === 'youtube.com' || hostname === 'www.youtube.com') {
      // /channel/CHANNEL_ID format
      const channelMatch = urlObj.pathname.match(/\/channel\/([a-zA-Z0-9_-]+)/);
      if (channelMatch) {
        return channelMatch[1];
      }

      // /@username format
      const handleMatch = urlObj.pathname.match(/\/@([a-zA-Z0-9._-]+)/);
      if (handleMatch) {
        // Handle format needs to be converted to channel ID via HTML crawl
        return null; // Will be handled separately
      }

      // /c/customurl format
      const customMatch = urlObj.pathname.match(/\/c\/([a-zA-Z0-9_-]+)/);
      if (customMatch) {
        return null; // Custom URL needs to be converted to channel ID via HTML crawl
      }

      // /user/username format (legacy)
      const userMatch = urlObj.pathname.match(/\/user\/([a-zA-Z0-9_-]+)/);
      if (userMatch) {
        return null; // Will be handled separately
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Generate RSS feed URL from channel ID
export function generateRssFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

// YouTube channel URL patterns
export const YOUTUBE_PATTERNS = {
  CHANNEL_ID: /\/channel\/([a-zA-Z0-9_-]+)/,
  HANDLE: /\/@([a-zA-Z0-9._-]+)/,
  CUSTOM_URL: /\/c\/([a-zA-Z0-9_-]+)/,
  USER: /\/user\/([a-zA-Z0-9_-]+)/
};

