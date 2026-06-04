export interface DockerBuildResult {
    imageName: string;
    port: number;
    containerId: string;
}
export declare function buildAndRunContainer(buildDir: string, deploymentId: string, onLog: (line: string) => void): Promise<DockerBuildResult>;
//# sourceMappingURL=docker.d.ts.map