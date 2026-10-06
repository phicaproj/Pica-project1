import { Request, Response } from 'express';
import { ResourceService } from './resource.service';
import { CREATED, OK } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { CreateResourceSchema, UpdateResourceSchema } from './resource.types';

export const createResource = catchErrors(async (req: Request, res: Response) => {
  const data = CreateResourceSchema.parse(req.body);
  const resource = await ResourceService.createResource(data);
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
