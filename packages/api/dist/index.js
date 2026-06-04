"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../../.env' });
const app_1 = require("./app");
const caddy_1 = require("./lib/caddy");
const PORT = process.env.PORT || 3001;
async function main() {
    await (0, caddy_1.initCaddyServer)();
    console.log('Caddy ready');
    const app = (0, app_1.createApp)();
    app.listen(PORT, () => {
        console.log(`API server running on http://localhost:${PORT}`);
    });
}
main().catch(console.error);
const app = (0, app_1.createApp)();
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
//# sourceMappingURL=index.js.map