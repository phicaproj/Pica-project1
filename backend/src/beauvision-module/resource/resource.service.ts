import AppError from '../../service/shared/appError';
import { NOT_FOUND } from '../../service/shared/http';
import { DigitalResource } from './resource.model';
import { IDigitalResourceCreate, IDigitalResourceUpdate } from './resource.types';
import { deleteObject, extractKeyFromUrl } from '../storage/beauvision.storage.service';

export class ResourceService {
  static async createResource(data: IDigitalResourceCreate) {
    return DigitalResource.create(data);
  }

  static async getAllResources(includeUnpublished = false, filter: Record<string, unknown> = {}) {
    const where: Record<string, unknown> = { ...filter };
    if (!includeUnpublished) where.isPublished = true;
    return DigitalResource.find(where).sort({ createdAt: -1 });
  }

  static async getResourceById(resourceId: string) {
    const resource = await DigitalResource.findById(resourceId);
    if (!resource) throw new AppError('Resource not found', NOT_FOUND);
    return resource;
  }

  static async updateResource(resourceId: string, data: IDigitalResourceUpdate) {
    const resource = await DigitalResource.findByIdAndUpdate(resourceId, data, { new: true });
    if (!resource) throw new AppError('Resource not found', NOT_FOUND);
    return resource;
  }

  static async deleteResource(resourceId: string) {
    const resource = await DigitalResource.findById(resourceId);
    if (!resource) throw new AppError('Resource not found', NOT_FOUND);

    // Delete files from R2
    if (resource.fileUrl) {
      const fileKey = extractKeyFromUrl(resource.fileUrl);
      if (fileKey) await deleteObject(fileKey).catch(e => console.error('Failed to delete resource file from R2:', e));
    }
    if (resource.coverImageUrl) {
      const coverKey = extractKeyFromUrl(resource.coverImageUrl);
      if (coverKey) await deleteObject(coverKey).catch(e => console.error('Failed to delete resource cover from R2:', e));
    }

    await DigitalResource.findByIdAndDelete(resourceId);
    return { message: 'Resource deleted successfully' };
  }
}
