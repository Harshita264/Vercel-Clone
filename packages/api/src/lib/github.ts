import { createHmac, timingSafeEqual } from 'crypto';

export function verifyGithubWebhook(
     rawBody: Buffer,
     signature: string | undefined,
     secret: string
): boolean {
    if (!signature) return false;

    const [algo, theirDigest] = signature.split('=');
    if (algo !== 'sha256' || !theirDigest) return false;

    const ourDigest = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

    const ourBuffer = Buffer.from(ourDigest, 'hex');
    const theirBuffer = Buffer.from(theirDigest, 'hex');

    if(ourBuffer.length !== theirBuffer.length) return false;

    return timingSafeEqual(ourBuffer, theirBuffer);
}

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