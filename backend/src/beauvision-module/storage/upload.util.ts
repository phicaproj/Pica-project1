import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// 250 MB cap for any single uploaded file. Anything larger must be hosted
// externally (e.g. Google Drive) and referenced via a link instead, so we never
// pay to store long-form video on R2.
export const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;

export const MAX_UPLOAD_MESSAGE =
  'File exceeds the 250MB limit. Please upload large files (e.g. video) to Google Drive and use the link option instead.';

type MulterMiddleware = (req: Request, res: Response, next: NextFunction) => void;

/**
 * Wraps a configured multer middleware so a size/type failure returns a clean
 * JSON error (instead of bubbling into the generic error handler). The size case
 * gets the Drive-link guidance the admin needs.
 */
export function handleUpload(middleware: MulterMiddleware) {
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ status: false, message: MAX_UPLOAD_MESSAGE });
        }
        return res.status(400).json({ status: false, message: err.message });
      }
      if (err instanceof Error) {
        return res.status(400).json({ status: false, message: err.message });
      }
      next();
    });
  };
}
