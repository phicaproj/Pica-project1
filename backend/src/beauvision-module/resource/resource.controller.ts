import { Request, Response } from 'express';
import { ResourceService } from './resource.service';
import { CREATED, OK, BAD_REQUEST } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { CreateResourceSchema, UpdateResourceSchema } from './resource.types';
import { uploadObject } from '../storage/beauvision.storage.service';
import AppError from '../../service/shared/appError';

// Derive a short file extension/format from the uploaded file name or mimetype.
function deriveFileFormat(file: Express.Multer.File): string {
  const fromName = file.originalname.split('.').pop();
  if (fromName && fromName.toLowerCase() !== file.originalname.toLowerCase()) {
    return fromName.toLowerCase();
  }
  const subtype = file.mimetype.split('/').pop();
  return (subtype ?? 'file').toLowerCase();
}

function assertHasSource(data: {
  fileUrl?: string;
  videoUrl?: string;
  youtubeUrl?: string;
}, hasUpload: boolean) {
  const hasLink = Boolean(data.fileUrl || data.videoUrl || data.youtubeUrl);
  if (!hasUpload && !hasLink) {
    throw new AppError(
      'Provide a resource file, a video link, or a YouTube link',
      BAD_REQUEST
    );
  }
}

export const createResource = catchErrors(async (req: Request, res: Response) => {
  const data = CreateResourceSchema.parse(req.body);

  const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};

  // Upload resource file (document or short video) if present.
  const resourceFile = files.resourceFile?.[0];
  if (resourceFile) {
    const resourceKey = `resources/${Date.now()}-${resourceFile.originalname}`;
    const resourceUpload = await uploadObject({
      key: resourceKey,
      body: resourceFile.buffer,
      contentType: resourceFile.mimetype,
    });
    data.fileUrl = resourceUpload.url;
    if (!data.fileFormat) data.fileFormat = deriveFileFormat(resourceFile);
  }

  // A resource must have either an uploaded file or an external link.
  assertHasSource(data, Boolean(resourceFile));

  // Upload cover image (if provided)
  const coverFile = files.coverImage?.[0];
  if (coverFile) {
    const coverKey = `resources/covers/${Date.now()}-${coverFile.originalname}`;
    const coverUpload = await uploadObject({
      key: coverKey,
      body: coverFile.buffer,
      contentType: coverFile.mimetype,
    });
    data.coverImageUrl = coverUpload.url;
  }

  // Free resources are always priced at 0.
  if (data.pricingType === 'free') data.price = 0;

  const resource = await ResourceService.createResource(data);
  res.status(CREATED).json({
    status: true,
    message: 'Resource created successfully',
    data: resource,
  });
});

export const getResources = catchErrors(async (req: Request, res: Response) => {
  const includeUnpublished = req.query.all === 'true';
  const filter: Record<string, unknown> = {};

  // Free vs paid tabs and type filtering on the public site.
  const pricingType = req.query.pricingType as string | undefined;
  if (pricingType === 'free' || pricingType === 'paid') {
    filter.pricingType = pricingType;
  }
  const category = req.query.category as string | undefined;
  if (category) filter.category = category;

  const resources = await ResourceService.getAllResources(includeUnpublished, filter);
  res.status(OK).json({
    status: true,
    message: 'Resources retrieved successfully',
    data: resources,
  });
});

export const getResourceById = catchErrors(async (req: Request, res: Response) => {
  const resource = await ResourceService.getResourceById(req.params.id as string);
  res.status(OK).json({
    status: true,
    message: 'Resource retrieved successfully',
    data: resource,
  });
});

export const updateResource = catchErrors(async (req: Request, res: Response) => {
  const data = UpdateResourceSchema.parse(req.body);

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  if (files?.resourceFile?.[0]) {
    const resourceFile = files.resourceFile[0];
    const resourceKey = `resources/${Date.now()}-${resourceFile.originalname}`;
    const resourceUpload = await uploadObject({
      key: resourceKey,
      body: resourceFile.buffer,
      contentType: resourceFile.mimetype,
    });
    data.fileUrl = resourceUpload.url;
    if (!data.fileFormat) data.fileFormat = deriveFileFormat(resourceFile);
  }

  if (files?.coverImage?.[0]) {
    const coverFile = files.coverImage[0];
    const coverKey = `resources/covers/${Date.now()}-${coverFile.originalname}`;
    const coverUpload = await uploadObject({
      key: coverKey,
      body: coverFile.buffer,
      contentType: coverFile.mimetype,
    });
    data.coverImageUrl = coverUpload.url;
  }

  if (data.pricingType === 'free') data.price = 0;

  const resource = await ResourceService.updateResource(req.params.id as string, data);
  res.status(OK).json({
    status: true,
    message: 'Resource updated successfully',
    data: resource,
  });
});

export const deleteResource = catchErrors(async (req: Request, res: Response) => {
  const result = await ResourceService.deleteResource(req.params.id as string);
  res.status(OK).json({
    status: true,
    message: result.message,
  });
});
