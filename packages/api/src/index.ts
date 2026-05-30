import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { createApp } from './app';
import { initCaddyServer } from './lib/caddy';

const PORT = process.env.PORT || 3001;

async function main() {
    await initCaddyServer();
    console.log('Caddy ready');

    const app = createApp();
    app.listen(PORT, () => {
        console.log(`API server running on http://localhost:${PORT}`);
    });
}

main().catch(console.error);

const app = createApp();

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});