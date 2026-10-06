import AppError from '../../service/shared/appError';
import { NOT_FOUND } from '../../service/shared/http';
import { DigitalResource } from './resource.model';
import { IDigitalResourceCreate } from './resource.types';

export class ResourceService {
  static async createResource(data: IDigitalResourceCreate) {
    return DigitalResource.create(data);
  }

  static async getAllResources(includeUnpublished = false) {
    const filter = includeUnpublished ? {} : { isPublished: true };
    return DigitalResource.find(filter).sort({ createdAt: -1 });
  }

  static async getResourceById(resourceId: string) {
    const resource = await DigitalResource.findById(resourceId);
    if (!resource) throw new AppError('Resource not found', NOT_FOUND);
    return resource;
  }

  static async updateResource(resourceId: string, data: Partial<IDigitalResourceCreate>) {
    const resource = await DigitalResource.findByIdAndUpdate(resourceId, data, { new: true });
    if (!resource) throw new AppError('Resource not found', NOT_FOUND);
    return resource;
  }

  static async deleteResource(resourceId: string) {
    const resource = await DigitalResource.findByIdAndDelete(resourceId);
    if (!resource) throw new AppError('Resource not found', NOT_FOUND);
    return { message: 'Resource deleted successfully' };
  }
}
