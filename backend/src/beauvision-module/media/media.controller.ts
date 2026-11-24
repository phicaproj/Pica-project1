import { Request, Response } from 'express';
import { CREATED, OK, BAD_REQUEST } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { MediaService } from './media.service';
import { CreateMediaSchema, UpdateMediaSchema } from './media.types';
import { uploadObject } from '../storage/beauvision.storage.service';

type MediaFiles = { [fieldname: string]: Express.Multer.File[] } | undefined;

async function uploadMediaFiles(req: Request) {
  const files = req.files as MediaFiles;
  let imageUrl: string | undefined;
  let videoUrl: string | undefined;

  if (files?.image?.[0]) {
    const file = files.image[0];
    const upload = await uploadObject({
      key: `media/images/${Date.now()}-${file.originalname}`,
      body: file.buffer,
      contentType: file.mimetype,
    });
    imageUrl = upload.url;
  }

  if (files?.video?.[0]) {
    const file = files.video[0];
    const upload = await uploadObject({
      key: `media/videos/${Date.now()}-${file.originalname}`,
      body: file.buffer,
      contentType: file.mimetype,
    });
    videoUrl = upload.url;
  }

  return { imageUrl, videoUrl };
}

export const getMedia = catchErrors(async (req: Request, res: Response) => {
  // Only authenticated admins may include unpublished items.
  const includeUnpublished = req.query.all === 'true' && Boolean(req.user);
  const media = await MediaService.getAllMedia(includeUnpublished);
  res.status(OK).json({
    status: true,
    message: 'Media retrieved successfully',
    data: media,
  });
});

export const createMedia = catchErrors(async (req: Request, res: Response) => {
  const data = CreateMediaSchema.parse(req.body);
  const uploaded = await uploadMediaFiles(req);
  if (uploaded.imageUrl) data.imageUrl = uploaded.imageUrl;
  if (uploaded.videoUrl) data.videoUrl = uploaded.videoUrl;

  if (data.type === 'IMAGE') {
    if (!data.imageUrl) {
      throw new AppError('An image is required for IMAGE media items', BAD_REQUEST);
    }
  } else if (!data.videoUrl && !data.youtubeUrl) {
    throw new AppError(
      'A video file or video link is required for VIDEO media items',
      BAD_REQUEST
    );
  }

  const media = await MediaService.createMedia(data);
  res.status(CREATED).json({
    status: true,
    message: 'Media item created successfully',
    data: media,
  });
});

export const updateMedia = catchErrors(async (req: Request, res: Response) => {
  const data = UpdateMediaSchema.parse(req.body);
  const uploaded = await uploadMediaFiles(req);
  if (uploaded.imageUrl) data.imageUrl = uploaded.imageUrl;
  if (uploaded.videoUrl) data.videoUrl = uploaded.videoUrl;

  const media = await MediaService.updateMedia(req.params.id as string, data);
  res.status(OK).json({
    status: true,
    message: 'Media item updated successfully',
    data: media,
  });
});

export const deleteMedia = catchErrors(async (req: Request, res: Response) => {
  const result = await MediaService.deleteMedia(req.params.id as string);
  res.status(OK).json({
    status: true,
    message: result.message,
  });
});
