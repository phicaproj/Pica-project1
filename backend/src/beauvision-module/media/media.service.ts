import AppError from '../../service/shared/appError';
import { NOT_FOUND } from '../../service/shared/http';
import { Media } from './media.model';
import { CreateMediaInput, UpdateMediaInput } from './media.types';
import { deleteObject, extractKeyFromUrl } from '../storage/beauvision.storage.service';

export class MediaService {
  static async createMedia(data: CreateMediaInput) {
    return Media.create(data);
  }

  static async getAllMedia(includeUnpublished = false) {
    const filter = includeUnpublished ? {} : { isPublished: true };
    return Media.find(filter).sort({ displayOrder: 1, eventDate: -1, createdAt: -1 });
  }

  static async updateMedia(id: string, data: UpdateMediaInput) {
    const media = await Media.findByIdAndUpdate(id, data, { new: true });
    if (!media) throw new AppError('Media item not found', NOT_FOUND);
    return media;
  }

  static async deleteMedia(id: string) {
    const media = await Media.findById(id);
    if (!media) throw new AppError('Media item not found', NOT_FOUND);

    for (const url of [media.imageUrl, media.videoUrl]) {
      const key = url ? extractKeyFromUrl(url) : null;
      if (key) {
        await deleteObject(key).catch((e) =>
          console.error('Failed to delete media object from R2:', e)
        );
      }
    }

    await Media.findByIdAndDelete(id);
    return { message: 'Media item deleted successfully' };
  }
}
