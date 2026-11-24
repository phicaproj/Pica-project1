import { randomBytes } from 'crypto';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../service/shared/http';
import { BeauvisionCoupon, IBeauvisionCoupon } from './coupon.model';
import {
  CouponPricing,
  CouponResponse,
  CreateCouponInput,
  ListCouponsQuery,
  UpdateCouponInput,
} from './coupon.types';
import { sendBeauvisionCouponEmail } from '../service/beauvision-email.service';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I
const CODE_LENGTH = 8;
const MAX_CODE_ATTEMPTS = 20;

const roundToTwo = (value: number): number => Number(value.toFixed(2));

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

function toCoupon(coupon: IBeauvisionCoupon): CouponResponse {
  return {
    id: String(coupon._id),
    code: coupon.code,
    description: coupon.description ?? null,
    email: coupon.email ?? null,
    amountOff: coupon.amountOff,
    percentOff: coupon.percentOff,
    isActive: coupon.isActive,
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    expiresAt: coupon.expiresAt ?? null,
    appliesTo: coupon.appliesTo,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

export class BeauvisionCouponService {
  static async createCoupon(input: CreateCouponInput): Promise<CouponResponse> {
    const email = normalizeEmail(input.email);
    const payload = {
      description: input.description ?? null,
      email,
      amountOff: input.amountOff ?? 0,
      percentOff: input.percentOff ?? 0,
      isActive: input.isActive,
      maxUses: input.maxUses,
      usedCount: 0,
      expiresAt: input.expiresAt ?? null,
    };

    let coupon: IBeauvisionCoupon | null = null;

    if (input.code) {
      try {
        coupon = await BeauvisionCoupon.create({
          ...payload,
          code: input.code.toUpperCase(),
        });
      } catch (error) {
        if (BeauvisionCouponService.isDuplicateKeyError(error)) {
          throw new AppError('A coupon with this code already exists', CONFLICT);
        }
        throw error;
      }
    } else {
      for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
        try {
          coupon = await BeauvisionCoupon.create({ ...payload, code: generateCode() });
          break;
        } catch (error) {
          if (BeauvisionCouponService.isDuplicateKeyError(error)) continue;
          throw error;
        }
      }
      if (!coupon) {
        throw new AppError('Could not generate a unique coupon code, please retry', CONFLICT);
      }
    }

    const result = toCoupon(coupon);

    // Deliver the code to the optional recipient without blocking the response.
    if (email) {
      sendBeauvisionCouponEmail({
        toEmail: email,
        code: result.code,
        description: result.description,
        amountOff: result.amountOff,
        percentOff: result.percentOff,
        expiresAt: result.expiresAt,
      }).catch((err) => console.error('Failed to send coupon email:', err));
    }

    return result;
  }

  static async listCoupons(query: ListCouponsQuery) {
    const filter: Record<string, unknown> = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    const coupons = await BeauvisionCoupon.find(filter).sort({ createdAt: -1 });
    return coupons.map(toCoupon);
  }

  static async getCouponById(id: string): Promise<CouponResponse> {
    const coupon = await BeauvisionCoupon.findById(id);
    if (!coupon) throw new AppError('Coupon not found', NOT_FOUND);
    return toCoupon(coupon);
  }

  static async updateCoupon(id: string, input: UpdateCouponInput): Promise<CouponResponse> {
    const coupon = await BeauvisionCoupon.findById(id);
    if (!coupon) throw new AppError('Coupon not found', NOT_FOUND);

    if (input.maxUses !== undefined && input.maxUses < coupon.usedCount) {
      throw new AppError(
        `maxUses cannot be lower than the ${coupon.usedCount} use(s) already recorded`,
        UNPROCESSABLE_CONTENT
      );
    }

    if (input.description !== undefined) coupon.description = input.description;
    if (input.email !== undefined) coupon.email = normalizeEmail(input.email);
    if (input.isActive !== undefined) coupon.isActive = input.isActive;
    if (input.maxUses !== undefined) coupon.maxUses = input.maxUses;
    if (input.expiresAt !== undefined) coupon.expiresAt = input.expiresAt;

    await coupon.save();
    return toCoupon(coupon);
  }

  static async deleteCoupon(id: string): Promise<{ message: string }> {
    const coupon = await BeauvisionCoupon.findByIdAndDelete(id);
    if (!coupon) throw new AppError('Coupon not found', NOT_FOUND);
    return { message: 'Coupon deleted successfully' };
  }

  /**
   * Validates a coupon against a base price and quotes the discount.
   * Shared by the public validate endpoint and payment-init so the two can never
   * diverge.
   *
   * Rules:
   *   - the code must exist and be active
   *   - it must not be expired
   *   - it must have uses remaining (usedCount < maxUses)
   *   - percentOff takes precedence when set, otherwise amountOff applies
   *   - the discount is clamped so finalAmount never drops below 0
   */
  static async validateAndPrice(code: string, basePrice: number): Promise<CouponPricing> {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await BeauvisionCoupon.findOne({ code: normalizedCode });

    if (!coupon || !coupon.isActive) {
      throw new AppError('Invalid or inactive coupon code', UNPROCESSABLE_CONTENT);
    }

    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new AppError('This coupon has expired', UNPROCESSABLE_CONTENT);
    }

    if (coupon.usedCount >= coupon.maxUses) {
      throw new AppError('This coupon has been fully used up', UNPROCESSABLE_CONTENT);
    }

    const rawDiscount =
      coupon.percentOff > 0 ? (basePrice * coupon.percentOff) / 100 : coupon.amountOff;
    const discountAmount = roundToTwo(Math.min(rawDiscount, basePrice));
    const finalAmount = roundToTwo(basePrice - discountAmount);

    return {
      code: coupon.code,
      basePrice: roundToTwo(basePrice),
      discountAmount,
      finalAmount,
    };
  }

  /**
   * Records a redemption. Atomic so two near-simultaneous payments can never push
   * usedCount past maxUses. Auto-deactivates the coupon once exhausted; an admin
   * can re-enable it (and raise maxUses) later.
   */
  static async consumeCoupon(code: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    const updated = await BeauvisionCoupon.findOneAndUpdate(
      { code: normalizedCode, $expr: { $lt: ['$usedCount', '$maxUses'] } },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (updated && updated.usedCount >= updated.maxUses && updated.isActive) {
      updated.isActive = false;
      await updated.save();
    }
  }

  private static isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
