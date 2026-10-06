import { Router } from 'express';
import * as BlogController from './blog.controller';
import { authenticate } from '../authentication/auth.middleware';
import multer from 'multer';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Use memory storage to process uploads directly to cloudflare R2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'coverImage') {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid cover image format. Allowed: JPG, PNG, WEBP, GIF.'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  },
});

const router = Router();

// Public routes
router.get('/', BlogController.getBlogs);
router.get('/:slug', BlogController.getBlogBySlug);

// Protected admin routes
router.post('/', authenticate, upload.single('coverImage'), BlogController.createBlog);
router.patch('/:id', authenticate, upload.single('coverImage'), BlogController.updateBlog);
router.delete('/:id', authenticate, BlogController.deleteBlog);

export default router;
