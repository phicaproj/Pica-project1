import AppError from '../../service/shared/appError';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from '../../service/shared/http';
import { BEAUVISION_APP_URL } from '../../Config/env';
import {
  initializeTransaction,
  newPaymentReference,
  verifyTransaction,
} from '../../service/shared/paystack.service';
import { sendConsultationReceiptEmail } from '../../service/shared/email.service';
import { ConsultationPlan, IConsultationPlan } from './consultation.model';
import { IConsultationInit, IUpdateConsultationPlan } from './consultation.types';
import { ServiceInquiry } from '../inquiry/inquiry.model';
import { IPayment, Payment } from '../payment/payment.model';

const PLAN_KEY = 'strategic-plan';
const CONSULTATION_SERVICE = 'Strategic Business Consultation';

function toPublicPlan(plan: IConsultationPlan) {
  return {
    key: plan.key,
    name: plan.name,
    description: plan.description ?? null,
    amount: plan.amount,
    currency: plan.currency,
    durationMinutes: plan.durationMinutes,
    isActive: plan.isActive,
  };
}

export class ConsultationService {
  static async getPlan() {
    let plan = await ConsultationPlan.findOne({ key: PLAN_KEY });
    if (!plan) {
      plan = await ConsultationPlan.create({ key: PLAN_KEY });
    }
    return plan;
  }

  static async getPublicPlan() {
    return toPublicPlan(await this.getPlan());
  }

  static async updatePlan(data: IUpdateConsultationPlan) {
    const plan = await this.getPlan();

    if (data.name !== undefined) plan.name = data.name;
    if (data.description !== undefined) plan.description = data.description;
    if (data.amount !== undefined) plan.amount = data.amount;
    if (data.durationMinutes !== undefined) plan.durationMinutes = data.durationMinutes;
    if (data.isActive !== undefined) plan.isActive = data.isActive;

    await plan.save();
    return toPublicPlan(plan);
  }

  static async initialize(data: IConsultationInit) {
    const plan = await this.getPlan();

    if (!plan.isActive) {
      throw new AppError('Consultation bookings are currently closed.', BAD_REQUEST);
    }

    const reference = newPaymentReference('BEAU-CONS');

    // The inquiry is intentionally NOT created here. It is only written once
    // Paystack confirms the payment (via the webhook) so the admin dashboard
    // does not fill up with unpaid consultation inquiries.
    const metadata = {
      project: 'BEAUVISION',
      module: 'beauvision-consultation',
      kind: 'consultation',
      planKey: plan.key,
      name: data.name,
      phone: data.phone,
      company: data.company ?? null,
      message: data.message ?? null,
      durationMinutes: plan.durationMinutes,
    };

    await Payment.create({
      reference,
      email: data.email,
      amount: plan.amount,
      status: 'PENDING',
      metadata,
    });

    try {
      const paystack = await initializeTransaction({
        email: data.email,
        amount: plan.amount,
        reference,
        callbackUrl: `${BEAUVISION_APP_URL.replace(/\/$/, '')}/consultation/callback`,
        metadata,
      });

      return {
        authorizationUrl: paystack.authorization_url,
        accessCode: paystack.access_code,
        reference,
        amount: plan.amount,
        currency: plan.currency,
        durationMinutes: plan.durationMinutes,
        plan: toPublicPlan(plan),
      };
    } catch (error) {
      await Payment.updateOne({ reference }, { status: 'FAILED' }).catch(() => undefined);

      if (error instanceof AppError) throw error;
      throw new AppError(
        'Could not start your consultation payment. Please try again.',
        INTERNAL_SERVER_ERROR
      );
    }
  }

  static async createInquiryFromPayment(payment: IPayment) {
    const existing = await ServiceInquiry.findOne({ paymentReference: payment.reference });
    if (existing) {
      return { inquiry: existing, created: false };
    }

    const inquiry = await ServiceInquiry.create({
      name: (payment.metadata?.name as string) || payment.email,
      email: payment.email,
      phone: payment.metadata?.phone as string | undefined,
      companyName: (payment.metadata?.company as string | null) ?? undefined,
      serviceRequested: CONSULTATION_SERVICE,
      message: (payment.metadata?.message as string | null) ?? undefined,
      type: 'CONSULTATION',
      paymentStatus: 'PAID',
      paymentReference: payment.reference,
      amountDue: payment.amount,
      amountPaid: payment.amount,
      paidAt: new Date(),
    });

    payment.metadata = { ...(payment.metadata ?? {}), inquiryId: inquiry._id.toString() };
    await payment.save();

    return { inquiry, created: true };
  }

  static async finalize(reference: string, options: { createInquiry?: boolean } = {}) {
    const { createInquiry = true } = options;

    if (!reference) {
      throw new AppError('Payment reference is required', BAD_REQUEST);
    }

    const payment = await Payment.findOne({ reference });
    if (!payment) {
      throw new AppError('Consultation payment not found', NOT_FOUND);
    }

    if (payment.status === 'SUCCESS') {
      let inquiry = await this.findInquiryForPayment(payment);

      // The callback's /verify may have marked this payment SUCCESS before
      // Paystack's webhook arrived. Let the webhook create the inquiry then,
      // without creating duplicates on webhook retries.
      if (!inquiry && createInquiry) {
        const result = await this.createInquiryFromPayment(payment);
        inquiry = result.inquiry;
        if (result.created) {
          await this.sendReceiptEmail(payment);
        }
      }

      return { payment, inquiry, alreadyProcessed: true };
    }

    const verifyData = await verifyTransaction(reference);

    if (verifyData.status !== 'success') {
      payment.status = 'FAILED';
      await payment.save();
      return { payment, inquiry: null, alreadyProcessed: false };
    }

    const expectedKobo = Math.round(payment.amount * 100);
    if (verifyData.amount < expectedKobo) {
      payment.status = 'FAILED';
      await payment.save();
      throw new AppError('Amount paid is less than the consultation fee', BAD_REQUEST);
    }

    payment.status = 'SUCCESS';
    await payment.save();

    let inquiry = null;

    if (createInquiry) {
      const result = await this.createInquiryFromPayment(payment);
      inquiry = result.inquiry;
      if (result.created) {
        await this.sendReceiptEmail(payment);
      }
    } else {
      inquiry = await this.findInquiryForPayment(payment);
    }

    return { payment, inquiry, alreadyProcessed: false };
  }

  static async sendReceiptEmail(payment: IPayment) {
    await sendConsultationReceiptEmail({
      toEmail: payment.email,
      name: (payment.metadata?.name as string) || 'there',
      amount: payment.amount,
      reference: payment.reference,
      durationMinutes: Number(payment.metadata?.durationMinutes) || 30,
    }).catch((err) => console.error('Failed to send consultation receipt email:', err));
  }

  static async findInquiryForPayment(payment: { reference: string }) {
    return ServiceInquiry.findOne({ paymentReference: payment.reference });
  }
}
