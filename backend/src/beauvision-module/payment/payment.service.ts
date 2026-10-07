import AppError from '../../service/shared/appError';
import { BAD_REQUEST, NOT_FOUND } from '../../service/shared/http';
import { Payment } from './payment.model';
import { IPaymentCreate } from './payment.types';
import { DigitalResource } from '../resource/resource.model';
import { initializeTransaction, newPaymentReference, verifyTransaction } from '../../service/shared/paystack.service';
import { sendDigitalResourceEmail } from '../../service/shared/email.service';

// Helper function to send email with the digital resource file attached
async function processAndSendResourceEmail(resource: any, payment: any, buyerName: string | null) {
  try {
    if (resource.fileUrl) {
      const response = await fetch(resource.fileUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        let filename = 'resource';
        if (resource.fileFormat) {
           filename += `.${resource.fileFormat.replace(/^\./, '')}`;
        } else {
           filename += '.pdf';
        }
        
        const urlParts = resource.fileUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart) {
           const decoded = decodeURIComponent(lastPart);
           const parts = decoded.split('-');
           if (parts.length > 1) {
             filename = parts.slice(1).join('-');
           } else {
             filename = decoded;
           }
        }

        await sendDigitalResourceEmail({
           toEmail: payment.email,
           buyerName: buyerName,
           resourceTitle: resource.title,
           fileName: filename,
           fileContentBase64: base64
        });
        console.log(`Successfully sent digital resource ${resource.title} to ${payment.email}`);
      } else {
        console.error(`Failed to fetch resource file from ${resource.fileUrl}: ${response.statusText}`);
      }
    } else {
      console.error(`Resource ${resource.title} has no fileUrl`);
    }
  } catch (e) {
    console.error('Failed to send digital resource email:', e);
  }
}

export class PaymentService {
  static async initializePayment(data: { resourceIds: string[]; email: string; name: string }) {
    // 1. Fetch resources from DB to get the TRUE total price
    const resources = await DigitalResource.find({ _id: { $in: data.resourceIds } });
    if (resources.length !== data.resourceIds.length) {
      throw new AppError('One or more resources not found', NOT_FOUND);
    }
    
    for (const resource of resources) {
      if (!resource.isPublished) {
        throw new AppError(`Resource ${resource.title} is not available for purchase`, BAD_REQUEST);
      }
    }

    const totalPrice = resources.reduce((sum, resource) => sum + resource.price, 0);

    const reference = newPaymentReference('BEAU');
    
    // If the total price is free, skip paystack entirely
    if (totalPrice === 0) {
      const payment = await Payment.create({
        resourceIds: data.resourceIds,
        email: data.email,
        amount: 0,
        status: 'SUCCESS',
        reference,
      });

      // Send the free resources to the buyer's email
      for (const resource of resources) {
        await processAndSendResourceEmail(resource, payment, data.name);
      }

      return {
        payment,
        authorizationUrl: null, // Frontend will see this is null and skip redirection
        accessCode: null,
        reference,
      };
    }

    // Paystack service handles the conversion to kobo
    const paystackData = await initializeTransaction({
      email: data.email,
      amount: totalPrice,
      reference,
      metadata: {
        project: 'BEAUVISION',
        resourceIds: JSON.stringify(data.resourceIds), // Storing array as JSON string
        name: data.name
      },
    });

    // 3. Create Pending Payment Record in DB
    const payment = await Payment.create({
      resourceIds: data.resourceIds,
      email: data.email,
      amount: totalPrice, // Storing normal unit
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
    return Payment.find().populate('resourceIds', 'title price').sort({ createdAt: -1 });
  }

  static async getPaymentByReference(reference: string) {
    const payment = await Payment.findOne({ reference }).populate('resourceIds', 'title price');
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
    const resourceIdsStr = data.metadata?.resourceIds;
    
    // Fallback to resourceId if legacy payment
    const resourceIdLegacy = data.metadata?.resourceId;

    if (!reference || (!resourceIdsStr && !resourceIdLegacy)) {
      return { message: 'Missing reference or resourceIds in metadata, ignoring.' };
    }
    
    let resourceIds: string[] = [];
    if (resourceIdsStr) {
       try {
           resourceIds = JSON.parse(resourceIdsStr);
       } catch(e) {
           console.error("Failed to parse resourceIds metadata", e);
           return { message: 'Invalid resourceIds format' };
       }
    } else if (resourceIdLegacy) {
       resourceIds = [resourceIdLegacy];
    }

    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return { message: 'Payment record not found, ignoring.' };
    }
    
    if (payment.status === 'SUCCESS') {
       return { message: 'Payment already marked as success' };
    }

    const resources = await DigitalResource.find({ _id: { $in: resourceIds } });
    if (resources.length !== resourceIds.length) {
      return { message: 'One or more resources not found in DB, ignoring.' };
    }

    const totalPrice = resources.reduce((sum, res) => sum + res.price, 0);
    const expectedAmount = Math.round(totalPrice * 100);
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
    
    // Send email with file
    for (const resource of resources) {
      await processAndSendResourceEmail(resource, payment, data.metadata?.name || null);
    }

    return { message: 'Beauvision payment verified and processed successfully' };
  }

  return { message: 'Event ignored' };
}
