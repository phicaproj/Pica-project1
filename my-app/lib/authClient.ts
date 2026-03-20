import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

interface SignUpPayload {
  businessName: string;
  email: string;
  rcNumber: string;
  phone: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3001",
  plugins: [
    inferAdditionalFields({
      user: {
        rcNumber: {
          type: "string",
        },
        phone: {
          type: "string",
        },
      },
    }),
    emailOTPClient(),
  ],
});

export const SignUp = async ({ payload }: { payload: SignUpPayload }) => {
  const res = await authClient.signUp.email({
    email: payload.email,
    password: payload.password,
    name: payload.businessName,
    rcNumber: payload.rcNumber,
    phone: payload.phone,
  });
  return res;
};
export const Login = async ({ payload }: { payload: LoginPayload }) => {
  const res = await authClient.signIn.email({
    email: payload.email,
    password: payload.password,
  });
  return res;
};

export const verifyOtp = async ({
  code,
  email,
  type,
}: {
  code: string;
  email: string;
  type: "sign-in" | "change-email" | "email-verification" | "forget-password";
}) => {
  // verifyEmail is the ONLY method that marks emailVerified = true in the DB.
  if (type === "email-verification") {
    return await authClient.emailOtp.verifyEmail({ email, otp: code });
  }

  // checkVerificationOtp validates codes for any other need.
  return await authClient.emailOtp.checkVerificationOtp({
    email,
    otp: code,
    type,
  });
};

export const sendVerificationOtp = async ({
  email,
  type,
}: {
  email: string;
  type: "sign-in" | "email-verification" | "forget-password";
}) => {
  const res = await authClient.emailOtp.sendVerificationOtp({
    email,
    type,
  });
  return res;
};

export const resetPassword = async ({
  newPassword,
  email,
  otp,
}: {
  newPassword: string;
  email: string;
  otp: string;
}) => {
  const res = await authClient.emailOtp.resetPassword({
    email,
    otp,
    password: newPassword,
  });
  return res;
};
