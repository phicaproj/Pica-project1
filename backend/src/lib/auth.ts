import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma.js';
import { emailOTP } from 'better-auth/plugins';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    fields: {
      name: 'businessName', // Tells Better Auth to use businessName as the name field
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: true,
      otpLength: 5,
      sendVerificationOTP: async (data, ctx) => {
        console.log(`sending ${data.otp} to ${data.email}`);
      },
    }),
  ],
});
