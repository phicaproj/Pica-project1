import AppError from '../../service/shared/appError';
import { NOT_FOUND } from '../../service/shared/http';
import { Testimonial } from './testimonial.model';
import { CreateTestimonialInput, UpdateTestimonialInput } from './testimonial.types';

export class TestimonialService {
  static async createTestimonial(data: CreateTestimonialInput) {
    return Testimonial.create(data);
  }

  static async getAllTestimonials(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return Testimonial.find(filter).sort({ displayOrder: 1, createdAt: -1 });
  }

  static async updateTestimonial(id: string, data: UpdateTestimonialInput) {
    const testimonial = await Testimonial.findByIdAndUpdate(id, data, { new: true });
    if (!testimonial) throw new AppError('Testimonial not found', NOT_FOUND);
    return testimonial;
  }

  static async deleteTestimonial(id: string) {
    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) throw new AppError('Testimonial not found', NOT_FOUND);
    return { message: 'Testimonial deleted successfully' };
  }
}
