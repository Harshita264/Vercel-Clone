import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { createBuildWorker } from './worker';

console.log('Build worker starting...');
const worker = createBuildWorker();
console.log('Build worker listening for jobs...');


process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});