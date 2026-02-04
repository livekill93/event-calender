import schedule from 'node-schedule';
import { YouTubeService } from './YouTubeService';
import { EventExtractor } from './YouTubeService';
import { ChannelModel } from '../models/Channel';
import { EventModel } from '../models/Event';
import { v4 as uuidv4 } from 'uuid';

export class SchedulerService {
  private job: schedule.Job | null = null;
  private isRunning = false;

  /**
   * Start the scheduler
   */
  start(intervalMinutes: number = 60): void {
    if (this.job) {
      console.log('Scheduler already running');
      return;
    }

    // Run immediately on start (async)
    this.runInitial();

    // Schedule recurring job
    const cronExpression = `0 */${intervalMinutes} * * * *`; // Every N minutes
    this.job = schedule.scheduleJob(cronExpression, () => {
      this.run();
    });

    console.log(`Scheduler started with interval: ${intervalMinutes} minutes`);
  }

  /**
   * Run initial sync asynchronously
   */
  private runInitial(): void {
    (async () => {
      try {
        console.log('Running initial video collection...');
        const channels = ChannelModel.getAll();

        for (const channel of channels) {
          console.log(`Processing channel: ${channel.game_name}`);
          await this.syncChannelVideosAsync(channel.channel_id, channel.game_name);
        }

        console.log('Initial sync completed');
      } catch (error) {
        console.error('Error in initial run:', error);
      }
    })();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      console.log('Scheduler stopped');
    }
  }

  /**
   * Run async version for scheduled execution
   */
  private run(): void {
    if (this.isRunning) {
      console.log('Previous run still in progress, skipping...');
      return;
    }

    this.isRunning = true;

    (async () => {
      try {
        console.log('Running scheduled video collection...');
        const channels = ChannelModel.getAll();

        for (const channel of channels) {
          console.log(`Processing channel: ${channel.game_name}`);
          await this.syncChannelVideosAsync(channel.channel_id, channel.game_name);
        }

        console.log('Scheduled collection completed');
      } catch (error) {
        console.error('Error in scheduled run:', error);
      } finally {
        this.isRunning = false;
      }
    })();
  }

  /**
   * Sync videos for a channel (synchronous version) - deprecated, use syncChannelVideosAsync
   */
  private syncChannelVideos(channelId: string, gameName: string): void {
    // This method is kept for backward compatibility but should not be used
    // Use syncChannelVideosAsync instead
    console.warn(`syncChannelVideos is deprecated for ${gameName}, use syncChannelVideosAsync`);
  }

  /**
   * Sync videos for a channel (asynchronous version)
   */
  private async syncChannelVideosAsync(channelId: string, gameName: string): Promise<void> {
    try {
      const videos = await YouTubeService.fetchChannelVideos(channelId, 10);
      console.log(`Fetched ${videos.length} videos for ${gameName}`);

      for (const video of videos) {
        // Save video to database
        YouTubeService.saveVideo(channelId, video);

        // Extract and save events
        const extractedEvents = EventExtractor.extractEvents(video, gameName, channelId);

        for (const extractedEvent of extractedEvents) {
          // Check if event already exists
          const eventId = `${video.videoId}_${extractedEvent.startDate}`;

          if (!EventModel.exists(eventId)) {
            EventModel.create({
              event_id: eventId,
              game_name: gameName,
              title: extractedEvent.title,
              description: extractedEvent.description,
              start_date: extractedEvent.startDate,
              end_date: extractedEvent.endDate,
              source_url: extractedEvent.sourceUrl,
              video_id: extractedEvent.videoId
            });

            console.log(`Created event: ${extractedEvent.title}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error syncing channel ${gameName}:`, error);
    }
  }

  /**
   * Manually trigger sync for a specific channel
   */
  async syncChannel(channelId: string, gameName: string): Promise<void> {
    return this.syncChannelVideosAsync(channelId, gameName);
  }

  /**
   * Manually trigger sync for all channels
   */
  async syncAll(): Promise<void> {
    try {
      console.log('Running manual sync for all channels...');
      const channels = ChannelModel.getAll();

      for (const channel of channels) {
        await this.syncChannelVideosAsync(channel.channel_id, channel.game_name);
      }

      console.log('Manual sync completed');
    } catch (error) {
      console.error('Error in manual sync:', error);
      throw error;
    }
  }
}
