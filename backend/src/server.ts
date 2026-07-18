import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { seedAchievements } from './services/gamification.service';

async function main() {
  await connectDatabase();
  await seedAchievements();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Mission365 API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
