"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCaddyServer = initCaddyServer;
const CADDY_ADMIN_URL = process.env.CADDY_ADMIN_URL || 'http://localhost:2019';
async function initCaddyServer() {
    const config = {
        apps: {
            http: {
                servers: {
                    srv0: {
                        listen: [':80'],
                        routes: [],
                    },
                },
            },
        },
    };
    const response = await fetch(`${CADDY_ADMIN_URL}/config/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:2019',
        },
        body: JSON.stringify(config),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to initialize Caddy: ${text}`);
    }
    console.log('Caddy initialized');
}
//# sourceMappingURL=caddy.js.map