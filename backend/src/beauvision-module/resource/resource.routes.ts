import { Router } from 'express';
import * as ResourceController from './resource.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();

router.post('/', authenticate, ResourceController.createResource);
router.get('/', ResourceController.getResources);
router.get('/:id', ResourceController.getResourceById);
router.patch('/:id', authenticate, ResourceController.updateResource);
router.delete('/:id', authenticate, ResourceController.deleteResource);

export default router;
