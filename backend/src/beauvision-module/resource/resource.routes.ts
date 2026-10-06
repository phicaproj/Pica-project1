import { Router } from 'express';
import * as ResourceController from './resource.controller';
import { authenticate } from '../authentication/auth.middleware';
import multer from 'multer';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const allowedResourceTypes = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip',
  'application/x-rar-compressed',
  'text/plain',
  'text/csv',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit for resources
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'coverImage') {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid cover image format. Allowed: JPG, PNG, WEBP, GIF.'));
      }
    } else if (file.fieldname === 'resourceFile') {
      if (allowedResourceTypes.includes(file.mimetype) || allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid resource format. Allowed: PDF, Word, Excel, PPT, ZIP, TXT, CSV, or Images.'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  },
});

const router = Router();

router.post('/', authenticate, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'resourceFile', maxCount: 1 }]), ResourceController.createResource);
router.get('/', ResourceController.getResources);
router.get('/:id', ResourceController.getResourceById);
router.patch('/:id', authenticate, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'resourceFile', maxCount: 1 }]), ResourceController.updateResource);
router.delete('/:id', authenticate, ResourceController.deleteResource);

export default router;
