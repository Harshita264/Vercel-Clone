"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const health_1 = require("./routes/health");
const webhook_1 = require("./routes/webhook");
``;
const deployments_1 = require("./routes/deployments");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: process.env.DASHBOARD_URL || 'http://localhost:5173',
        credentials: true,
    }));
    app.use((req, res, next) => {
        let data = [];
        req.on('data', (chunk) => data.push(chunk));
        req.on('end', () => {
            const rawBody = Buffer.concat(data);
            req.rawBody = Buffer.concat(data);
            if (req.headers['content-type']?.includes('application/json')) {
                try {
                    req.body = JSON.parse(rawBody.toString());
                }
                catch (e) {
                    req.body = {};
                }
            }
            next();
        });
    });
    app.use('/health', health_1.healthRouter);
    app.use('/webhook', webhook_1.webhookRouter);
    app.use('/deployments', deployments_1.deploymentsRouter);
    return app;
}
//# sourceMappingURL=app.js.map