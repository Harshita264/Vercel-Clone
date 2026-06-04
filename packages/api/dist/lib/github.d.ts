export declare function verifyGithubWebhook(rawBody: Buffer, signature: string | undefined, secret: string): boolean;
export interface GithubPushPayload {
    ref: string;
    after: string;
    repository: {
        id: number;
        name: string;
        full_name: string;
        clone_url: string;
        private: boolean;
    };
    head_commit: {
        id: string;
        message: string;
        author: {
            name: string;
            email: string;
        };
    } | null;
    pusher: {
        name: string;
    };
}
//# sourceMappingURL=github.d.ts.map