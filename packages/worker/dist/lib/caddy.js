"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDeploymentRoute = addDeploymentRoute;
exports.removeDeploymentRoute = removeDeploymentRoute;
const CADDY_ADMIN_URL = process.env.CADDY_ADMIN_URL || 'http://localhost:2019';
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'localhost';
async function addDeploymentRoute(deploymentId, port) {
    const routeId = `deployment-${deploymentId}`;
    const subdomain = `${deploymentId}.${BASE_DOMAIN}`;
    const route = {
        '@id': routeId,
        match: [{ host: [subdomain] }],
        handle: [
            {
                handler: 'reverse_proxy',
                upstreams: [{ dial: `localhost:${port}` }],
            },
        ],
        terminal: true,
    };
    const getRes = await fetch(`${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`, { headers: { 'Origin': 'http://localhost:2019' } });
    const existingRoutes = getRes.ok ? await getRes.json() : [];
    const updatedRoutes = [...(existingRoutes || []), route];
    const response = await fetch(`${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:2019',
        },
        body: JSON.stringify(updatedRoutes),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to add Caddy route: ${text}`);
    }
    console.log(`Route added: http://${subdomain} → localhost:${port}`);
}
async function removeDeploymentRoute(deploymentId) {
    const getRes = await fetch(`${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`, { headers: { 'Origin': 'http://localhost:2019' } });
    if (!getRes.ok)
        return;
    const routes = await getRes.json();
    const updated = routes.filter((r) => r['@id'] !== `deployment-${deploymentId}`);
    await fetch(`${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:2019',
        },
        body: JSON.stringify(updated),
    });
}
//# sourceMappingURL=caddy.js.map