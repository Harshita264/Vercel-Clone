"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    console.error(`[{new Date().toISOString()}] ${statusCode} - ${message}`);
    if (err.stack)
        console.error(err.stack);
    res.status(statusCode).json({
        error: {
            message,
            statusCode,
        },
    });
}
//# sourceMappingURL=errorHandler.js.map