"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../../.env' });
const worker_1 = require("./worker");
console.log('Build worker starting...');
const worker = (0, worker_1.createBuildWorker)();
console.log('Build worker listening for jobs...');
process.on('SIGTERM', async () => {
    console.log('Shutting down worker...');
    await worker.close();
    process.exit(0);
});
//# sourceMappingURL=index.js.map