"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAndRunContainer = buildAndRunContainer;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function runCommand(command, args, cwd, onLog) {
    return new Promise((resolve, reject) => {
        const proc = (0, child_process_1.spawn)(command, args, { cwd, shell: true });
        proc.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter(Boolean);
            lines.forEach(line => onLog(line));
        });
        proc.stderr.on('data', (data) => {
            const lines = data.toString().split('\n').filter(Boolean);
            lines.forEach(line => onLog(line));
        });
        proc.on('close', (code) => {
            if (code === 0)
                resolve();
            else
                reject(new Error(`Command failed with exit code ${code}`));
        });
        proc.on('error', reject);
    });
}
async function findFreePort() {
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
async function startContainer(imageName, port, deploymentId, onLog) {
    return new Promise((resolve, reject) => {
        const proc = (0, child_process_1.spawn)('docker', [
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
        proc.stdout.on('data', (data) => {
            containerId += data.toString().trim();
        });
        proc.stderr.on('data', (data) => {
            onLog(data.toString());
        });
        proc.on('close', (code) => {
            if (code === 0 && containerId)
                resolve(containerId);
            else
                reject(new Error(`docker run failed with code ${code}`));
        });
        proc.on('error', reject);
    });
}
async function buildAndRunContainer(buildDir, deploymentId, onLog) {
    const imageName = `vercel-clone-${deploymentId}`.toLowerCase();
    const dockerfilePath = path.join(buildDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
        throw new Error('No Dockerfile found in repo root.' +
            'Add a Dockerfile to your project to deploy it.');
    }
    onLog(`Building Docker image: ${imageName}`);
    await runCommand('docker', ['build', '-t', imageName, '.'], buildDir, onLog);
    onLog(`Image built successfully: ${imageName}`);
    const port = await findFreePort();
    onLog(`Assigning port ${port} to deployment`);
    onLog(`Starting container...`);
    const containerId = await startContainer(imageName, port, deploymentId, onLog);
    onLog(`Container started: ${containerId.slice(0, 12)}`);
    return { imageName, port, containerId };
}
//# sourceMappingURL=docker.js.map