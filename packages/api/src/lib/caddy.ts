// packages/api/src/lib/caddy.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const CADDY_CONFIG_PATH = process.env.CADDY_CONFIG_PATH || path.join(process.cwd(), '../../routes.json');
const CADDY_BINARY = process.env.CADDY_BINARY || path.join(process.cwd(), '../../caddy.exe');

interface CaddyRoute {
  '@id': string;
  match: { host: string[] }[];
  handle: { handler: string; upstreams: { dial: string }[] }[];
  terminal: boolean;
}

function readConfig(): any {
  if (!fs.existsSync(CADDY_CONFIG_PATH)) {
    return {
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
  }
  return JSON.parse(fs.readFileSync(CADDY_CONFIG_PATH, 'utf-8'));
}

function writeConfig(config: any): void {
  fs.writeFileSync(CADDY_CONFIG_PATH, JSON.stringify(config, null, 2));
}

async function reloadCaddy(): Promise<void> {
  await execAsync(`"${CADDY_BINARY}" reload --config "${CADDY_CONFIG_PATH}"`);
}

export async function initCaddyServer(): Promise<void> {
  const config = readConfig();
  writeConfig(config);
  await reloadCaddy();
  console.log('Caddy initialized');
}

export async function addDeploymentRoute(
  deploymentId: string,
  port: number
): Promise<void> {
  const config = readConfig();
  const routes: CaddyRoute[] = config.apps.http.servers.srv0.routes;

  // Remove existing route for this deployment if any
  const filtered = routes.filter((r: CaddyRoute) => r['@id'] !== `deployment-${deploymentId}`);

  const newRoute: CaddyRoute = {
    '@id': `deployment-${deploymentId}`,
    match: [{ host: [`${deploymentId}.localhost`] }],
    handle: [{ handler: 'reverse_proxy', upstreams: [{ dial: `localhost:${port}` }] }],
    terminal: true,
  };

  config.apps.http.servers.srv0.routes = [...filtered, newRoute];
  writeConfig(config);
  await reloadCaddy();

  console.log(`Route added: http://${deploymentId}.localhost → localhost:${port}`);
}

export async function removeDeploymentRoute(deploymentId: string): Promise<void> {
  const config = readConfig();
  const routes: CaddyRoute[] = config.apps.http.servers.srv0.routes;

  config.apps.http.servers.srv0.routes = routes.filter(
    (r: CaddyRoute) => r['@id'] !== `deployment-${deploymentId}`
  );

  writeConfig(config);
  await reloadCaddy();
}

export async function reregisterAllRoutes(prisma: any): Promise<void> {
  const deployments = await prisma.deployment.findMany({
    where: { status: 'READY', port: { not: null } },
  });

  console.log(`Re-registering ${deployments.length} routes with Caddy...`);

  const config = readConfig();
  const existingRoutes: CaddyRoute[] = config.apps.http.servers.srv0.routes;

  // Keep non-deployment routes, rebuild deployment routes from DB
  const nonDeploymentRoutes = existingRoutes.filter(
    (r: CaddyRoute) => !r['@id']?.startsWith('deployment-')
  );

  const deploymentRoutes: CaddyRoute[] = deployments.map((d: any) => ({
    '@id': `deployment-${d.id}`,
    match: [{ host: [`${d.id}.localhost`] }],
    handle: [{ handler: 'reverse_proxy', upstreams: [{ dial: `localhost:${d.port}` }] }],
    terminal: true,
  }));

  config.apps.http.servers.srv0.routes = [...nonDeploymentRoutes, ...deploymentRoutes];
  writeConfig(config);
  await reloadCaddy();

  console.log(`${deployments.length} routes registered`);
}