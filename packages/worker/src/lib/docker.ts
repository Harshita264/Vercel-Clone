import { spawn } from 'child_process';
import { createServer } from 'net';
import { PrismaClient } from '@prisma/client';
import { decrypt } from './crypto';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export interface DockerBuildResult {
  imageName: string;
  port: number;
  containerId: string;
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  onLog: (line: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, shell: true });
    proc.stdout.on('data', (data: Buffer) => {
      data.toString().split('\n').filter(Boolean).forEach(line => onLog(line));
    });
    proc.stderr.on('data', (data: Buffer) => {
      data.toString().split('\n').filter(Boolean).forEach(line => onLog(line));
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
    proc.on('error', reject);
  });
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function startContainer(
  imageName: string,
  port: number,
  deploymentId: string,
  envFilePath: string,
  onLog: (line: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('docker', [
      'run', '-d',
      '--name', `deployment-${deploymentId}`,
      '-p', `${port}:3000`,
      '--restart', 'unless-stopped',
      '--memory', '512m',
      '--cpus', '0.5',
      '--env-file', envFilePath,
      imageName,
    ], { shell: true });

    let containerId = '';
    proc.stdout.on('data', (data: Buffer) => {
      containerId += data.toString().trim();
    });
    proc.stderr.on('data', (data: Buffer) => {
      onLog(data.toString());
    });
    proc.on('close', (code) => {
      if (code === 0 && containerId) resolve(containerId);
      else reject(new Error(`docker run failed with code ${code}`));
    });
    proc.on('error', reject);
  });
}

export async function buildAndRunContainer(
  buildDir: string,
  deploymentId: string,
  projectId: string,
  onLog: (line: string) => void
): Promise<DockerBuildResult> {
  const imageName = `vercel-clone-${deploymentId}`.toLowerCase();

  const dockerfilePath = path.join(buildDir, 'Dockerfile');
  if (!fs.existsSync(dockerfilePath)) {
    throw new Error('No Dockerfile found in repo root. Add a Dockerfile to your project.');
  }

  const prisma = new PrismaClient();
  const envFilePath = path.join(os.tmpdir(), `${deploymentId}.env`);

  try {
    const envVars = await prisma.envVar.findMany({ where: { projectId } });
    const envContent = envVars.map(e => `${e.key}=${decrypt(e.value)}`).join('\n');
    fs.writeFileSync(envFilePath, envContent);
    onLog(`Injecting ${envVars.length} environment variable(s)`);
  } finally {
    await prisma.$disconnect();
  }

  onLog(`Building Docker image: ${imageName}`);
  await runCommand('docker', ['build', '-t', imageName, '.'], buildDir, onLog);
  onLog(`Image built successfully: ${imageName}`);

  const port = await findFreePort();
  onLog(`Assigning port ${port} to deployment`);

  onLog(`Starting container...`);
  const containerId = await startContainer(imageName, port, deploymentId, envFilePath, onLog);
  onLog(`Container started: ${containerId.slice(0, 12)}`);

  if (fs.existsSync(envFilePath)) {
    fs.unlinkSync(envFilePath);
  }

  return { imageName, port, containerId };
}