import { Request, Response } from 'express';
import { ResourceService } from './resource.service';
import { CREATED, OK, BAD_REQUEST } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { CreateResourceSchema, UpdateResourceSchema } from './resource.types';
import { uploadObject } from '../storage/beauvision.storage.service';
import AppError from '../../service/shared/appError';

export const createResource = catchErrors(async (req: Request, res: Response) => {
  const data = CreateResourceSchema.parse(req.body);
  
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  if (!files || !files.resourceFile || files.resourceFile.length === 0) {
    throw new AppError('Resource file is required', BAD_REQUEST);
  }

  // Upload resource file
  const resourceFile = files.resourceFile[0];
  const resourceKey = `resources/${Date.now()}-${resourceFile.originalname}`;
  const resourceUpload = await uploadObject({
    key: resourceKey,
    body: resourceFile.buffer,
    contentType: resourceFile.mimetype,
  });
  data.fileUrl = resourceUpload.url;

  // Upload cover image (if provided)
  if (files.coverImage && files.coverImage.length > 0) {
    const coverFile = files.coverImage[0];
    const coverKey = `resources/covers/${Date.now()}-${coverFile.originalname}`;
    const coverUpload = await uploadObject({
      key: coverKey,
      body: coverFile.buffer,
      contentType: coverFile.mimetype,
    });
    data.coverImageUrl = coverUpload.url;
  } else {
    data.coverImageUrl = ''; // Or some default
  }

  // Explicit casting as strings, since they are populated now
  const resourceData = {
    ...data,
    coverImageUrl: data.coverImageUrl as string,
    fileUrl: data.fileUrl as string,
  };

  const resource = await ResourceService.createResource(resourceData);
  res.status(CREATED).json({
    status: true,
    message: 'Resource created successfully',
    data: resource,
  });
});

export const getResources = catchErrors(async (req: Request, res: Response) => {
  const includeUnpublished = req.query.all === 'true';
  const resources = await ResourceService.getAllResources(includeUnpublished);
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

  if (files && files.resourceFile && files.resourceFile.length > 0) {
    const resourceFile = files.resourceFile[0];
    const resourceKey = `resources/${Date.now()}-${resourceFile.originalname}`;
    const resourceUpload = await uploadObject({
      key: resourceKey,
      body: resourceFile.buffer,
      contentType: resourceFile.mimetype,
    });
    data.fileUrl = resourceUpload.url;
  }

  if (files && files.coverImage && files.coverImage.length > 0) {
    const coverFile = files.coverImage[0];
    const coverKey = `resources/covers/${Date.now()}-${coverFile.originalname}`;
    const coverUpload = await uploadObject({
      key: coverKey,
      body: coverFile.buffer,
      contentType: coverFile.mimetype,
    });
    data.coverImageUrl = coverUpload.url;
  }

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
