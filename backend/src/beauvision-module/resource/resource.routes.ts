import { Router } from 'express';
import * as ResourceController from './resource.controller';
import { authenticate, hasPermission, hasAnyPermission } from '../authentication/auth.middleware';
import multer from 'multer';
import { handleUpload, MAX_UPLOAD_BYTES } from '../storage/upload.util';

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
  // Short downloadable videos (<= 250MB). Longer videos should use a link.
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'coverImage') {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid cover image format. Allowed: JPG, PNG, WEBP, GIF.'));
      }
    } else if (file.fieldname === 'resourceFile') {
      if (allowedResourceTypes.includes(file.mimetype) || allowedImageTypes.includes(file.mimetype)) {
        cb(
          null,
          true
        );
      } else {
        cb(
          new Error(
            'Invalid resource format. Allowed: PDF, Word, Excel, PPT, ZIP, TXT, CSV, images, or MP4/WEBM/MOV video.'
          )
        );
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  },
});

const uploadResourceFiles = handleUpload(
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'resourceFile', maxCount: 1 },
  ])
);

const router = Router();

router.post(
  '/',
  authenticate,
  hasAnyPermission('resources:write', 'resources:upload'),
  uploadResourceFiles,
  ResourceController.createResource
);
router.get('/', ResourceController.getResources);
router.get('/:id', ResourceController.getResourceById);
router.patch(
  '/:id',
  authenticate,
  hasAnyPermission('resources:write', 'resources:upload'),
  uploadResourceFiles,
  ResourceController.updateResource
);
router.delete('/:id', authenticate, hasPermission('resources:delete'), ResourceController.deleteResource);

export default router;
