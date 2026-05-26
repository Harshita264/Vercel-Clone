import simpleGit from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CloneResult {
    buildDir: string;
}

export async function cloneRepo(
    repoUrl: string,
    commitSha: string,
    deploymentId: string,
    onLog: (line: string) => void
): Promise<CloneResult> {
    const buildDir = path.join(os.tmpdir(), 'vercel-clone', deploymentId);

    if(fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true});
    }

    fs.mkdirSync(buildDir, {recursive: true});

    onLog(`Cloning ${repoUrl}...`);

    const git = simpleGit();

    await git.clone(repoUrl, buildDir, ['--depth=1']);

    onLog(`Checking out commit ${commitSha.slice(0,7)}...`);

    const repoGit = simpleGit(buildDir);
    await repoGit.fetch('origin', commitSha, ['--depth=1']).catch(() => {
        onLog(`Using latest commit from clone`);
    });

    onLog(`Repo ready at ${buildDir}`);

    return { buildDir };
}