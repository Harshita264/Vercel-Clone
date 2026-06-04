export interface CloneResult {
    buildDir: string;
}
export declare function cloneRepo(repoUrl: string, commitSha: string, deploymentId: string, onLog: (line: string) => void): Promise<CloneResult>;
//# sourceMappingURL=clone.d.ts.map