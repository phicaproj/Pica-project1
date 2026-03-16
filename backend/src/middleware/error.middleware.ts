import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/index.js";

export const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let code = "INTERNAL_SERVER_ERROR";
  let details: any = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err.name === "ValidationError") {
    // Handle Zod or other validation errors if needed specifically
    statusCode = 400;
    message = err.message;
    code = "VALIDATION_ERROR";
  }

  const response = {
    success: false,
    error: message,
    code,
    ...(details && { details }),
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  };

  logger.error(`${code}: ${message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId: (req as any).id,
  });

  res.status(statusCode).json(response);
};
