import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../service/shared/http';
import type {
  CouponDetailResponse,
  CouponListResponse,
  CouponPricing,
  CouponResponse,
  CreateCouponInput,
  ListCouponsQuery,
  UpdateCouponInput,
} from './coupon.types';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I
const CODE_LENGTH = 8;
const MAX_CODE_ATTEMPTS = 5;

const roundToTwo = (value: number): number => Number(value.toFixed(2));

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

type RawCoupon = Prisma.DiscountGetPayload<{
  select: {
    id: true;
    code: true;
    description: true;
    amountOff: true;
    percentOff: true;
    isActive: true;
    userId: true;
    createdAt: true;
    user: { select: { email: true } };
  };
}>;

const couponSelect = {
  id: true,
  code: true,
  description: true,
  amountOff: true,
  percentOff: true,
  isActive: true,
  userId: true,
  createdAt: true,
  user: { select: { email: true } },
} as const;

const toCoupon = (coupon: RawCoupon): CouponResponse => ({
  id: coupon.id,
  code: coupon.code,
  description: coupon.description,
  amountOff: coupon.amountOff.toNumber(),
  percentOff: coupon.percentOff.toNumber(),
  isActive: coupon.isActive,
  userId: coupon.userId,
  userEmail: coupon.user?.email ?? null,
  createdAt: coupon.createdAt,
});

export async function createCouponService(input: CreateCouponInput): Promise<CouponDetailResponse> {
  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true },
    });
    if (!user) throw new AppError('User not found', NOT_FOUND);
  }

  // Both columns are always stored (schema requires both). The admin supplies
  // one; the other stays 0 and is resolved against the order total at redemption.
  const amountOff = new Prisma.Decimal(input.amountOff ?? 0);
  const percentOff = new Prisma.Decimal(input.percentOff ?? 0);

  // Explicit code: insert once and surface
  //  a clean conflict. Auto code: retry a
  // few times against the unique constraint before giving up.
  if (input.code) {
    const normalized = input.code.toUpperCase();
    try {
      const created = await prisma.discount.create({
        data: {
          code: normalized,
          description: input.description ?? null,
          amountOff,
          percentOff,
          isActive: input.isActive,
          userId: input.userId ?? null,
        },
        select: couponSelect,
      });
      return { message: 'Coupon created successfully', coupon: toCoupon(created) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('A coupon with this code already exists', CONFLICT);
      }
      throw error;
    }
  }

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    try {
      const created = await prisma.discount.create({
        data: {
          code: generateCode(),
          description: input.description ?? null,
          amountOff,
          percentOff,
          isActive: input.isActive,
          userId: input.userId ?? null,
        },
        select: couponSelect,
      });
      return { message: 'Coupon created successfully', coupon: toCoupon(created) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        continue; // collision — try a fresh code
      }
      throw error;
    }
  }

  throw new AppError('Could not generate a unique coupon code, please retry', CONFLICT);
}

export async function listCouponsService(query: ListCouponsQuery): Promise<CouponListResponse> {
  const where: Prisma.DiscountWhereInput = {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
  };

  const [total, coupons] = await Promise.all([
    prisma.discount.count({ where }),
    prisma.discount.findMany({
      where,
      select: couponSelect,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    message: 'Coupons fetched successfully',
    total,
    coupons: coupons.map(toCoupon),
  };
}

export async function updateCouponService(
  couponId: string,
  input: UpdateCouponInput
): Promise<CouponDetailResponse> {
  const existing = await prisma.discount.findUnique({
    where: { id: couponId },
    select: { id: true },
  });
  if (!existing) throw new AppError('Coupon not found', NOT_FOUND);

  const updated = await prisma.discount.update({
    where: { id: couponId },
    data: {
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: couponSelect,
  });

  return { message: 'Coupon updated successfully', coupon: toCoupon(updated) };
}

export async function deleteCouponService(couponId: string): Promise<{ message: string }> {
  const existing = await prisma.discount.findUnique({
    where: { id: couponId },
    select: { id: true },
  });
  if (!existing) throw new AppError('Coupon not found', NOT_FOUND);

  await prisma.discount.delete({ where: { id: couponId } });
  return { message: 'Coupon deleted successfully' };
}

/**
 * Validates a coupon for a given user against a base price and computes the
 * discount. Shared by POST /coupon/validate and the payment-init flow so the
 * rules can never diverge.
 *
 * Rules:
 *   - coupon must exist and be active
 *   - a user-scoped coupon (userId set) is only usable by that user
 *   - percentOff takes precedence when set; otherwise amountOff applies
 *   - the discount is clamped so finalAmount never goes below 0
 */
export async function validateAndPriceCoupon(
  code: string,
  userId: string,
  basePrice: number
): Promise<CouponPricing> {
  const coupon = await prisma.discount.findUnique({
    where: { code: code.trim().toUpperCase() },
    select: {
      code: true,
      amountOff: true,
      percentOff: true,
      isActive: true,
      userId: true,
    },
  });

  if (!coupon || !coupon.isActive) {
    throw new AppError('Invalid or inactive coupon code', UNPROCESSABLE_CONTENT);
  }

  if (coupon.userId && coupon.userId !== userId) {
    throw new AppError('This coupon is not valid for your account', UNPROCESSABLE_CONTENT);
  }

  const percentOff = coupon.percentOff.toNumber();
  const amountOff = coupon.amountOff.toNumber();

  const rawDiscount = percentOff > 0 ? (basePrice * percentOff) / 100 : amountOff;
  const discountAmount = roundToTwo(Math.min(rawDiscount, basePrice));
  const finalAmount = roundToTwo(basePrice - discountAmount);

  return {
    code: coupon.code,
    basePrice: roundToTwo(basePrice),
    discountAmount,
    finalAmount,
  };
}
