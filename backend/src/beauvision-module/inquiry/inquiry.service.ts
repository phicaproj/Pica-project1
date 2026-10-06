import AppError from '../../service/shared/appError';
import { NOT_FOUND } from '../../service/shared/http';
import { ServiceInquiry } from './inquiry.model';
import { IServiceInquiryCreate } from './inquiry.types';
import { sendInquiryEmail } from '../../service/shared/email.service';

export class InquiryService {
  static async createInquiry(data: IServiceInquiryCreate) {
    const inquiry = await ServiceInquiry.create(data);
    
    // Call the sendInquiryEmail function to send an email notification to the admin
    // assuming an admin email from env or a default one
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@beauvisiongroup.com';
    await sendInquiryEmail(adminEmail, data).catch((err) => {
      console.error('Failed to send inquiry email:', err);
    });

    return inquiry;
  }

  static async getAllInquiries() {
    return ServiceInquiry.find().sort({ createdAt: -1 });
  }

  static async updateInquiryStatus(
    inquiryId: string,
    status: 'PENDING' | 'CONTACTED' | 'RESOLVED'
  ) {
    const inquiry = await ServiceInquiry.findByIdAndUpdate(inquiryId, { status }, { new: true });
    if (!inquiry) throw new AppError('Inquiry not found', NOT_FOUND);
    return inquiry;
  }
}
