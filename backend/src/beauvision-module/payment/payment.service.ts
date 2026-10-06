import AppError from '../../service/shared/appError';
import { BAD_REQUEST, NOT_FOUND } from '../../service/shared/http';
import { Payment } from './payment.model';
import { IPaymentCreate } from './payment.types';
import { DigitalResource } from '../resource/resource.model';
import { initializeTransaction, newPaymentReference, verifyTransaction } from '../../service/shared/paystack.service';

export class PaymentService {
  static async initializePayment(data: { resourceId: string; email: string; name: string }) {
    // 1. Fetch resource from DB to get the TRUE price
    const resource = await DigitalResource.findById(data.resourceId);
    if (!resource) {
      throw new AppError('Resource not found', NOT_FOUND);
    }
    if (!resource.isPublished) {
      throw new AppError('Resource is not available for purchase', BAD_REQUEST);
    }

    const reference = newPaymentReference('BEAU');
    
    // Convert price to smallest currency unit (e.g. kobo/cents) based on NGN
    const amountInKobo = Math.round(resource.price * 100);

    // 2. Initialize Paystack
    const paystackData = await initializeTransaction({
      email: data.email,
      amount: amountInKobo,
            reference,
      metadata: {
        project: 'BEAUVISION',
        resourceId: resource._id.toString(),
        name: data.name
      },
          });

    // 3. Create Pending Payment Record in DB
    const payment = await Payment.create({
      resourceId: resource._id,
      email: data.email,
            amount: resource.price, // Storing normal unit
            status: 'PENDING',
      reference,
    });

    return {
      payment,
      authorizationUrl: paystackData.authorization_url,
      accessCode: paystackData.access_code,
      reference,
    };
  }

  static async getAllPayments() {
    return Payment.find().populate('resourceId', 'title price').sort({ createdAt: -1 });
  }

  static async getPaymentByReference(reference: string) {
    const payment = await Payment.findOne({ reference }).populate('resourceId', 'title price');
    if (!payment) throw new AppError('Payment not found', NOT_FOUND);
    return payment;
  }

  static async updatePaymentStatus(reference: string, status: 'SUCCESS' | 'FAILED' | 'PENDING') {
    const payment = await Payment.findOneAndUpdate({ reference }, { status }, { new: true });
    if (!payment) throw new AppError('Payment not found', NOT_FOUND);
    return payment;
  }
}

export async function handleBeauvisionWebhookService(params: {
  parsedBody: any;
  signature: string | undefined;
}): Promise<{ message: string }> {
  const { parsedBody } = params;

  if (parsedBody.event === 'charge.success') {
    const data = parsedBody.data;
    const reference = data.reference;
    const amountPaidInKobo = data.amount;
    const resourceId = data.metadata?.resourceId;

    if (!reference || !resourceId) {
      return { message: 'Missing reference or resourceId in metadata, ignoring.' };
    }

    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return { message: 'Payment record not found, ignoring.' };
    }
    
    if (payment.status === 'SUCCESS') {
       return { message: 'Payment already marked as success' };
    }

    const resource = await DigitalResource.findById(resourceId);
    if (!resource) {
      return { message: 'Resource not found in DB, ignoring.' };
    }

    const expectedAmount = Math.round(resource.price * 100);
    if (amountPaidInKobo < expectedAmount) {
      console.error(`[Beauvision Webhook] Partial payment received. Expected ${expectedAmount}, got ${amountPaidInKobo}`);
      await Payment.findOneAndUpdate({ reference }, { status: 'FAILED' });
      return { message: 'Amount paid is less than resource price' };
    }

    // Verify transaction again with Paystack for defense in depth
    try {
      const verifyData = await verifyTransaction(reference);
      if (verifyData.status !== 'success') {
        await Payment.findOneAndUpdate({ reference }, { status: 'FAILED' });
        return { message: 'Paystack verification failed' };
      }
    } catch (e) {
      return { message: 'Error verifying with Paystack' };
    }

    // Mark successful
    await Payment.findOneAndUpdate({ reference }, { status: 'SUCCESS' });
    
    // Here you would typically also trigger an email sending the digital resource to the user's email
    // Example: await sendDigitalResourceEmail(payment.email, resource);

    return { message: 'Beauvision payment verified and processed successfully' };
  }

  return { message: 'Event ignored' };
}
