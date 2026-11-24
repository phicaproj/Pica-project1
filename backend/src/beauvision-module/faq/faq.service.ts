import AppError from '../../service/shared/appError';
import { NOT_FOUND } from '../../service/shared/http';
import { Faq } from './faq.model';
import { CreateFaqInput, UpdateFaqInput } from './faq.types';

export class FaqService {
  static async createFaq(data: CreateFaqInput) {
    return Faq.create(data);
  }

  static async getAllFaqs(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return Faq.find(filter).sort({ displayOrder: 1, createdAt: -1 });
  }

  static async updateFaq(id: string, data: UpdateFaqInput) {
    const faq = await Faq.findByIdAndUpdate(id, data, { new: true });
    if (!faq) throw new AppError('FAQ not found', NOT_FOUND);
    return faq;
  }

  static async deleteFaq(id: string) {
    const faq = await Faq.findByIdAndDelete(id);
    if (!faq) throw new AppError('FAQ not found', NOT_FOUND);
    return { message: 'FAQ deleted successfully' };
  }
}
