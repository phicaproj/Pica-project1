import 'dotenv/config';
import app from './app';
import { PORT } from './Config/env';
import { cleanupExpiredReports } from './scripts/cleanup-reports';

const port = Number(PORT);
console.log(typeof port);
const server = app.listen(port, () => {
  console.log(`App is running on port: ${PORT}`);

  // Trigger cleanup check 10 seconds after startup
  setTimeout(() => {
    cleanupExpiredReports().catch((err) => {
      console.error('Startup PDF cleanup failed:', err);
    });
  }, 10000);

  // Trigger cleanup check every 24 hours
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    cleanupExpiredReports().catch((err) => {
      console.error('Daily PDF cleanup failed:', err);
    });
  }, ONE_DAY_MS);
});
