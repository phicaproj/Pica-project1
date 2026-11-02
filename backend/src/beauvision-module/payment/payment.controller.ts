import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { CREATED, OK, NOT_FOUND, BAD_REQUEST } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { InitPaymentSchema } from './payment.types';
import { Payment } from './payment.model';
import { verifyTransaction } from '../../service/shared/paystack.service';
import AppError from '../../service/shared/appError';
import { ConsultationService } from '../consultation/consultation.service';

export const initializePayment = catchErrors(async (req: Request, res: Response) => {
  const data = InitPaymentSchema.parse(req.body);
  const result = await PaymentService.initializePayment(data);
  res.status(CREATED).json({
    status: true,
    message: 'Payment initialized successfully',
    data: result,
  });
});

export const getPayments = catchErrors(async (req: Request, res: Response) => {
  const payments = await PaymentService.getAllPayments();
  res.status(OK).json({
    status: true,
    message: 'Payments retrieved successfully',
    data: payments,
  });
});

export const getPaymentByReference = catchErrors(async (req: Request, res: Response) => {
  const payment = await PaymentService.getPaymentByReference(req.params.reference as string);
  res.status(OK).json({
    status: true,
    message: 'Payment retrieved successfully',
    data: payment,
  });
});

export const verifyPaymentManual = catchErrors(async (req: Request, res: Response) => {
  const reference = req.params.reference as string;
  const existing = await Payment.findOne({ reference });
  if (!existing) throw new AppError('Payment not found', NOT_FOUND);

  // Consultation payments only create their inquiry once payment is confirmed.
  // Admin manual verification is a confirmation path, so let it create the
  // inquiry if the webhook hasn't arrived yet. Resource payments are untouched.
  if (existing.metadata?.module === 'beauvision-consultation') {
    const result = await ConsultationService.finalize(reference, { createInquiry: true });
    return res.status(OK).json({
      status: true,
      message: `Payment verified. Status: ${result.payment.status}`,
      data: result.payment,
    });
  }

  const payment = await Payment.findOne({ reference }).populate('resourceIds', 'title price');
  if (!payment) throw new AppError('Payment not found', NOT_FOUND);

  let status = payment.status;
  try {
    const verifyData = await verifyTransaction(reference);
    if (verifyData.status === 'success') {
      status = 'SUCCESS';
    } else if (verifyData.status === 'failed') {
      status = 'FAILED';
    }
  } catch (e) {
    throw new AppError('Error verifying with Paystack', BAD_REQUEST);
  }

  const updatedPayment = await PaymentService.updatePaymentStatus(reference, status as any);

  res.status(OK).json({
    status: true,
    message: `Payment verified. Status: ${status}`,
    data: updatedPayment,
  });
});