import { Router } from 'express';
import * as BlogController from './blog.controller';
import { authenticate } from '../authentication/auth.middleware';
import multer from 'multer';

// Use memory storage to process uploads directly to cloudflare R2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
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
