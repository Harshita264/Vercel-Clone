"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = exports.QUEUE_NAME = void 0;
exports.QUEUE_NAME = 'build-queue';
exports.redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};
//# sourceMappingURL=queue.js.map