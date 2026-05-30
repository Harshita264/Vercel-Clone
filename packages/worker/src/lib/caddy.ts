const CADDY_ADMIN_URL = process.env.CADDY_ADMIN_URL || 'http://localhost:2019';
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'localhost';

export async function addDeploymentRoute(
  deploymentId: string,
  port: number
): Promise<void> {
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

  const getRes = await fetch(
    `${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`,
    { headers: { 'Origin': 'http://localhost:2019' } }
  );

  const existingRoutes = getRes.ok ? await getRes.json() : [];
  const updatedRoutes = [...(existingRoutes || []), route];


  const response = await fetch(
    `${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:2019',
      },
      body: JSON.stringify(updatedRoutes),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to add Caddy route: ${text}`);
  }

  console.log(`Route added: http://${subdomain} → localhost:${port}`);
}

export async function removeDeploymentRoute(deploymentId: string): Promise<void> {
  const getRes = await fetch(
    `${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`,
    { headers: { 'Origin': 'http://localhost:2019' } }
  );

  if (!getRes.ok) return;

  const routes = await getRes.json();
  const updated = routes.filter((r: any) => r['@id'] !== `deployment-${deploymentId}`);

  await fetch(`${CADDY_ADMIN_URL}/config/apps/http/servers/srv0/routes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:2019',
    },
    body: JSON.stringify(updated),
  });
}