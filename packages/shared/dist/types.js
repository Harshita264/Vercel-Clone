"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDeploymentId = generateDeploymentId;
const crypto_1 = require("crypto");
function generateDeploymentId() {
    return 'dpl_' + (0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 8);
}
//# sourceMappingURL=types.js.map