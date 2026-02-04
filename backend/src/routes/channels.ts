import express, { Router, Request, Response } from 'express';
import { ChannelModel } from '../models/Channel';
import { YouTubeService } from '../services/YouTubeService';
import { SchedulerService } from '../services/SchedulerService';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /channels - Get all channels
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const channels = ChannelModel.getAll();
    res.json({
      status: 'success',
      data: channels
    });
  })
);

/**
 * GET /channels/:id - Get channel by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw new AppError(400, 'Invalid channel ID');
    }

    const channel = ChannelModel.getById(id);

    if (!channel) {
      throw new AppError(404, 'Channel not found');
    }

    res.json({
      status: 'success',
      data: channel
    });
  })
);

/**
 * POST /channels - Create a new channel
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { game_name, channel_url } = req.body;

    // Validation
    if (!game_name || !channel_url) {
      throw new AppError(400, 'game_name and channel_url are required');
    }

    // Check if channel already exists
    const existing = ChannelModel.getByGameName(game_name);
    if (existing) {
      throw new AppError(400, 'Channel with this game name already exists');
    }

    // Get channel ID from URL
    let channelId: string | null;
    try {
      channelId = await YouTubeService.getChannelId(channel_url);
    } catch (error) {
      throw new AppError(400, `Failed to get channel ID: ${(error as Error).message}`);
    }

    if (!channelId) {
      throw new AppError(400, 'Could not find YouTube channel from the provided URL');
    }

    // Create channel
    const newChannel = ChannelModel.create({
      game_name,
      channel_url,
      channel_id: channelId
    });

    // Trigger sync for new channel
    const schedulerService = new SchedulerService();
    try {
      await schedulerService.syncChannel(channelId, game_name);
    } catch (error) {
      console.error('Error syncing new channel:', error);
      // Don't fail the request if sync fails
    }

    res.status(201).json({
      status: 'success',
      data: newChannel,
      message: 'Channel created successfully'
    });
  })
);

/**
 * PUT /channels/:id - Update channel
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw new AppError(400, 'Invalid channel ID');
    }

    const { game_name, channel_url } = req.body;
    let updateData: any = {};

    if (game_name) updateData.game_name = game_name;
    if (channel_url) {
      // Get channel ID from URL
      try {
        const channelId = await YouTubeService.getChannelId(channel_url);
        if (!channelId) {
          throw new AppError(400, 'Could not find YouTube channel from the provided URL');
        }
        updateData.channel_id = channelId;
        updateData.channel_url = channel_url;
      } catch (error) {
        throw new AppError(400, `Failed to get channel ID: ${(error as Error).message}`);
      }
    }

    const updatedChannel = ChannelModel.update(id, updateData);

    if (!updatedChannel) {
      throw new AppError(404, 'Channel not found');
    }

    res.json({
      status: 'success',
      data: updatedChannel
    });
  })
);

/**
 * DELETE /channels/:id - Delete channel
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw new AppError(400, 'Invalid channel ID');
    }

    const deleted = ChannelModel.delete(id);

    if (!deleted) {
      throw new AppError(404, 'Channel not found');
    }

    res.json({
      status: 'success',
      message: 'Channel deleted successfully'
    });
  })
);

/**
 * POST /channels/:id/sync - Manually sync channel
 */
router.post(
  '/:id/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw new AppError(400, 'Invalid channel ID');
    }

    const channel = ChannelModel.getById(id);

    if (!channel) {
      throw new AppError(404, 'Channel not found');
    }

    const schedulerService = new SchedulerService();

    try {
      await schedulerService.syncChannel(channel.channel_id, channel.game_name);

      res.json({
        status: 'success',
        message: `Synced channel: ${channel.game_name}`
      });
    } catch (error) {
      throw new AppError(500, `Failed to sync channel: ${(error as Error).message}`);
    }
  })
);

export default router;
