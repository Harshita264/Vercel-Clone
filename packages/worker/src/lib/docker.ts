import { spawn } from 'child_process';
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
        const proc = spawn(command, args, { cwd, shell: true});

        proc.stdout.on('data', (data: Buffer) => {
            const lines = data.toString().split('\n').filter(Boolean);
            lines.forEach(line => onLog(line));
        });
        proc.stderr.on('data', (data: Buffer) => {
            const lines = data.toString().split('\n').filter(Boolean);
            lines.forEach(line => onLog(line));
        });

        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with exit code ${code}`));
        });

        proc.on('error', reject);
    });
}

async function findFreePort(): Promise<number> {
    const { createServer } = await import('net');
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
    onLog: (line: string) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn('docker', [
            'run',
            '-d',
            '--name', `deployment-${deploymentId}`,
            '-p', `${port}:3000`,
            '--restart', 'unless-stopped',
            '--memory', '512m',
            '--cpus', '0.5',
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
    onLog: (line: string) => void
): Promise<DockerBuildResult> {
    const imageName = `vercel-clone-${deploymentId}`.toLowerCase();


    const dockerfilePath = path.join(buildDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
        throw new Error(
            'No Dockerfile found in repo root.' +
            'Add a Dockerfile to your project to deploy it.'
        );
    }

    onLog(`Building Docker image: ${imageName}`);
    await runCommand(
        'docker',
        ['build', '-t', imageName, '.'],
        buildDir,
        onLog
    );
    onLog(`Image built successfully: ${imageName}`);

    const port = await findFreePort();
    onLog(`Assigning port ${port} to deployment`);

    onLog(`Starting container...`);
    const containerId = await startContainer(imageName, port, deploymentId, onLog);
    onLog(`Container started: ${containerId.slice(0, 12)}`);

    return { imageName, port, containerId };
}

