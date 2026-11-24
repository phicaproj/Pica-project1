import { Request, Response } from 'express';
import { CREATED, OK } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { FaqService } from './faq.service';
import { CreateFaqSchema, UpdateFaqSchema } from './faq.types';

export const getFaqs = catchErrors(async (req: Request, res: Response) => {
  // Only authenticated admins may include inactive items.
  const includeInactive = req.query.all === 'true' && Boolean(req.user);
  const faqs = await FaqService.getAllFaqs(includeInactive);
  res.status(OK).json({
    status: true,
    message: 'FAQs retrieved successfully',
    data: faqs,
  });
});

export const createFaq = catchErrors(async (req: Request, res: Response) => {
  const input = CreateFaqSchema.parse(req.body);
  const faq = await FaqService.createFaq(input);
  res.status(CREATED).json({
    status: true,
    message: 'FAQ created successfully',
    data: faq,
  });
});

export const updateFaq = catchErrors(async (req: Request, res: Response) => {
  const input = UpdateFaqSchema.parse(req.body);
  const faq = await FaqService.updateFaq(req.params.id as string, input);
  res.status(OK).json({
    status: true,
    message: 'FAQ updated successfully',
    data: faq,
  });
});

export const deleteFaq = catchErrors(async (req: Request, res: Response) => {
  const result = await FaqService.deleteFaq(req.params.id as string);
  res.status(OK).json({
    status: true,
    message: result.message,
  });
});
