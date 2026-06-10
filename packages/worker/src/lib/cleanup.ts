import * as fs from 'fs';
import { spawn } from 'child_process';

export async function cleanupBuildDir(buildDir: string): Promise<void> {
  try {
    fs.rmSync(buildDir, { recursive: true, force: true });
    console.log(`Cleaned up build dir: ${buildDir}`);
  } catch (err) {
    console.error(`Failed to clean up ${buildDir}:`, err);
  }
}

export async function stopAndRemoveContainer(deploymentId: string): Promise<void> {
  const containerName = `deployment-${deploymentId}`;
  return new Promise((resolve) => {
    const proc = spawn('docker', ['rm', '-f', containerName], { shell: true });
    proc.on('close', () => resolve());
  });
}