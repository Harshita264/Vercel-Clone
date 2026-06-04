"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGithubWebhook = verifyGithubWebhook;
const crypto_1 = require("crypto");
function verifyGithubWebhook(rawBody, signature, secret) {
    if (!signature)
        return false;
    const [algo, theirDigest] = signature.split('=');
    if (algo !== 'sha256' || !theirDigest)
        return false;
    const ourDigest = (0, crypto_1.createHmac)('sha256', secret)
        .update(rawBody)
        .digest('hex');
    const ourBuffer = Buffer.from(ourDigest, 'hex');
    const theirBuffer = Buffer.from(theirDigest, 'hex');
    if (ourBuffer.length !== theirBuffer.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(ourBuffer, theirBuffer);
}
//# sourceMappingURL=github.js.map