import { Request, Response, NextFunction } from 'express';
interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}
export declare function errorHandler(err: CustomError, req: Request, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=error-handler.d.ts.map