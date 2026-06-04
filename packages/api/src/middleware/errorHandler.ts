import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
}

export function errorHandler(
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    console.error(`[{new Date().toISOString()}] ${statusCode} - ${message}`);
    if (err.stack) console.error(err.stack);

    res.status(statusCode).json({
        error: {
            message,
            statusCode,
        },
    });
}
