import { Request, Response } from 'express';
import { InquiryService } from './inquiry.service';
import { CREATED, OK } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { createInquirySchema, updateInquiryStatusSchema } from './inquiry.types';

export const createInquiry = catchErrors(async (req: Request, res: Response) => {
  const input = createInquirySchema.parse(req.body);
  const inquiry = await InquiryService.createInquiry(input);
  res.status(CREATED).json({
    status: true,
    message: 'Inquiry submitted successfully',
    data: inquiry,
  });
});

export const getInquiries = catchErrors(async (req: Request, res: Response) => {
  const inquiries = await InquiryService.getAllInquiries();
  res.status(OK).json({
    status: true,
    message: 'Inquiries retrieved successfully',
    data: inquiries,
  });
});

export const updateInquiryStatus = catchErrors(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input = updateInquiryStatusSchema.parse(req.body);
  const inquiry = await InquiryService.updateInquiryStatus(id as string, input.status);
  res.status(OK).json({
    status: true,
    message: 'Inquiry updated successfully',
    data: inquiry,
  });
});
