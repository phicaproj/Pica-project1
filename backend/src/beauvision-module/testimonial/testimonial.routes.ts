import { Router } from 'express';
import multer from 'multer';
import * as TestimonialController from './testimonial.controller';
import { authenticate, hasPermission, hasAnyPermission } from '../authentication/auth.middleware';
import { handleUpload, MAX_UPLOAD_BYTES } from '../storage/upload.util';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'avatar') {
      if (allowedImageTypes.includes(file.mimetype)) return cb(null, true);
      return cb(new Error('Invalid avatar format. Allowed: JPG, PNG, WEBP, GIF.'));
    }
    return cb(new Error('Unexpected field'));
  },
});

const uploadAvatar = handleUpload(upload.single('avatar'));

/**
 * Public testimonials (mounted at /api/beauvision/testimonials).
 */
export const testimonialPublicRouter = Router();
testimonialPublicRouter.get('/', TestimonialController.getTestimonials);

/**
 * Admin testimonial management (mounted at /api/beauvision/admin/testimonials).
 */
export const testimonialAdminRouter = Router();
testimonialAdminRouter.get(
  '/',
  authenticate,
  hasAnyPermission('testimonials:read', 'testimonials:write'),
  TestimonialController.getTestimonials
);
testimonialAdminRouter.post(
  '/',
  authenticate,
  hasPermission('testimonials:write'),
  uploadAvatar,
  TestimonialController.createTestimonial
);
testimonialAdminRouter.patch(
  '/:id',
  authenticate,
  hasPermission('testimonials:write'),
  uploadAvatar,
  TestimonialController.updateTestimonial
);
testimonialAdminRouter.delete(
  '/:id',
  authenticate,
  hasPermission('testimonials:delete'),
  TestimonialController.deleteTestimonial
);
