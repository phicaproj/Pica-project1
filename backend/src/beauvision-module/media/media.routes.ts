import { Router } from 'express';
import multer from 'multer';
import * as MediaController from './media.controller';
import { authenticate, hasPermission, hasAnyPermission } from '../authentication/auth.middleware';
import { handleUpload, MAX_UPLOAD_BYTES } from '../storage/upload.util';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'image') {
      if (allowedImageTypes.includes(file.mimetype)) return cb(null, true);
      return cb(new Error('Invalid image format. Allowed: JPG, PNG, WEBP, GIF.'));
    }
    if (file.fieldname === 'video') {
      if (allowedVideoTypes.includes(file.mimetype)) return cb(null, true);
      return cb(new Error('Invalid video format. Allowed: MP4, WEBM, MOV.'));
    }
    return cb(new Error('Unexpected field'));
  },
});

const uploadMediaFiles = handleUpload(
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ])
);

/**
 * Public media centre (mounted at /api/beauvision/media).
 */
export const mediaPublicRouter = Router();
mediaPublicRouter.get('/', MediaController.getMedia);

/**
 * Admin media management (mounted at /api/beauvision/admin/media).
 */
export const mediaAdminRouter = Router();
mediaAdminRouter.get(
  '/',
  authenticate,
  hasAnyPermission('media:read', 'media:write'),
  MediaController.getMedia
);
mediaAdminRouter.post(
  '/',
  authenticate,
  hasPermission('media:write'),
  uploadMediaFiles,
  MediaController.createMedia
);
mediaAdminRouter.patch(
  '/:id',
  authenticate,
  hasPermission('media:write'),
  uploadMediaFiles,
  MediaController.updateMedia
);
mediaAdminRouter.delete(
  '/:id',
  authenticate,
  hasPermission('media:delete'),
  MediaController.deleteMedia
);
