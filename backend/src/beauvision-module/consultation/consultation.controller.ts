import { Request, Response } from 'express';
import { CREATED, OK } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { ConsultationService } from './consultation.service';
import { ConsultationInitSchema, UpdateConsultationPlanSchema } from './consultation.types';

export const getConsultationPlan = catchErrors(async (_req: Request, res: Response) => {
  const plan = await ConsultationService.getPublicPlan();
  res.status(OK).json({
    status: true,
    message: 'Consultation plan retrieved successfully',
    data: plan,
  });
});

export const updateConsultationPlan = catchErrors(async (req: Request, res: Response) => {
  const input = UpdateConsultationPlanSchema.parse(req.body);
  const plan = await ConsultationService.updatePlan(input);
  res.status(OK).json({
    status: true,
    message: 'Consultation plan updated successfully',
    data: plan,
  });
});

export const initializeConsultation = catchErrors(async (req: Request, res: Response) => {
  const input = ConsultationInitSchema.parse(req.body);
  const result = await ConsultationService.initialize(input);
  res.status(CREATED).json({
    status: true,
    message: 'Consultation payment initialized successfully',
    data: result,
  });
});

export const verifyConsultation = catchErrors(async (req: Request, res: Response) => {
  const reference = req.params.reference as string;
  const result = await ConsultationService.finalize(reference, { createInquiry: false });

  const paymentStatus = result.payment.status;
  const message =
    paymentStatus === 'SUCCESS'
      ? 'Consultation payment confirmed'
      : `Consultation payment is ${paymentStatus.toLowerCase()}`;

  res.status(OK).json({
    status: true,
    message,
    data: {
      reference: result.payment.reference,
      paymentStatus,
      amount: result.payment.amount,
      amountPaid: paymentStatus === 'SUCCESS' ? result.payment.amount : 0,
      inquiryId: result.payment.metadata?.inquiryId ?? null,
      alreadyProcessed: result.alreadyProcessed,
    },
  });
});
