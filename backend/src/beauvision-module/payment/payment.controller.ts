import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { CREATED, OK } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { InitPaymentSchema } from './payment.types';

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
