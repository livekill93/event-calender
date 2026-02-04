import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { initDatabase, closeDatabase } from './config/database';
import { errorHandler, AppError, asyncHandler } from './middleware/errorHandler';
import channelRoutes from './routes/channels';
import eventRoutes from './routes/events';
import { SchedulerService } from './services/SchedulerService';

const app = express();
const PORT = process.env.PORT || 5000;
const SCHEDULER_INTERVAL = parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || '60', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Scheduler service instance
let schedulerService: SchedulerService | null = null;

// Health check endpoint
app.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  })
);

// API Routes
app.use('/api/channels', channelRoutes);
app.use('/api/events', eventRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  throw new AppError(404, `Route not found: ${req.method} ${req.path}`);
});

// Error handler (must be last)
app.use(errorHandler);

// Start server and scheduler
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Start scheduler
  schedulerService = new SchedulerService();
  schedulerService.start(SCHEDULER_INTERVAL);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');

  if (schedulerService) {
    schedulerService.stop();
  }

  server.close(() => {
    closeDatabase();
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
});

export default app;
