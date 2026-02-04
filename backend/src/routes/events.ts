import express, { Router, Request, Response } from 'express';
import { EventModel } from '../models/Event';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /events - Get all events
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const events = EventModel.getAll();

    res.json({
      status: 'success',
      data: events,
      total: events.length
    });
  })
);

/**
 * GET /events/by-date - Get events by date range
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get(
  '/by-date',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError(400, 'startDate and endDate query parameters are required');
    }

    const events = EventModel.getByDateRange(
      startDate as string,
      endDate as string
    );

    res.json({
      status: 'success',
      data: events,
      total: events.length
    });
  })
);

/**
 * GET /events/by-month/:year/:month - Get events for a specific month
 * Params: year (YYYY), month (1-12)
 */
router.get(
  '/by-month/:year/:month',
  asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    if (isNaN(year) || isNaN(month)) {
      throw new AppError(400, 'Invalid year or month');
    }

    if (month < 1 || month > 12) {
      throw new AppError(400, 'Month must be between 1 and 12');
    }

    const events = EventModel.getByMonth(year, month);

    res.json({
      status: 'success',
      data: events,
      total: events.length
    });
  })
);

/**
 * GET /events/by-game/:gameName - Get events by game name
 */
router.get(
  '/by-game/:gameName',
  asyncHandler(async (req: Request, res: Response) => {
    const { gameName } = req.params;

    const events = EventModel.getByGameName(decodeURIComponent(gameName));

    res.json({
      status: 'success',
      data: events,
      total: events.length
    });
  })
);

/**
 * GET /events/:id - Get event by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw new AppError(400, 'Invalid event ID');
    }

    const event = EventModel.getById(id);

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    res.json({
      status: 'success',
      data: event
    });
  })
);

/**
 * POST /events - Create a new event (manual creation)
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { game_name, title, description, start_date, end_date, source_url } = req.body;

    // Validation
    if (!game_name || !title || !start_date || !source_url) {
      throw new AppError(400, 'game_name, title, start_date, and source_url are required');
    }

    // Create event
    const event = EventModel.create({
      event_id: `manual_${Date.now()}`,
      game_name,
      title,
      description,
      start_date,
      end_date,
      source_url
    });

    res.status(201).json({
      status: 'success',
      data: event,
      message: 'Event created successfully'
    });
  })
);

/**
 * PUT /events/:id - Update event
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw new AppError(400, 'Invalid event ID');
    }

    const updatedEvent = EventModel.update(id, req.body);

    if (!updatedEvent) {
      throw new AppError(404, 'Event not found');
    }

    res.json({
      status: 'success',
      data: updatedEvent
    });
  })
);

/**
 * DELETE /events/:id - Delete event
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw new AppError(400, 'Invalid event ID');
    }

    const deleted = EventModel.delete(id);

    if (!deleted) {
      throw new AppError(404, 'Event not found');
    }

    res.json({
      status: 'success',
      message: 'Event deleted successfully'
    });
  })
);

export default router;
