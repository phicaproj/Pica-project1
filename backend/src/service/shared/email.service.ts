import dotenv from 'dotenv';
import AppError from './appError';

dotenv.config();

interface SendEmailResponse {
  success: boolean;
  error?: string;
}

export async function sendWelcomeEmail(
  toEmail: string,
  businessName: string
): Promise<SendEmailResponse> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_FROM as string,
          name: 'PICA by Beauvision',
        },
        to: [{ email: toEmail }],
        subject: `Welcome to PICA — ${businessName}`,
        htmlContent: `
          <h2>Welcome to PICA, ${businessName}!</h2>
          <p>Thanks for creating your account with PICA by Beauvision.</p>
          <p>You can now sign in to view your assessment results, track your business health, and unlock the full snapshot report.</p>
          <p>If you didn't create this account, please ignore this email.</p>
          <br/>
          <p>— The Beauvision Team</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      throw new AppError(JSON.stringify(errorData), 500);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('Error sending welcome email:', message);

    return { success: false, error: message };
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  code: string
): Promise<SendEmailResponse> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_FROM as string,
          name: 'PICA by Beauvision',
        },
        to: [{ email: toEmail }],
        subject: 'Your PICA admin login code',
        htmlContent: `
          <h2>Verify your PICA admin login</h2>
          <p>Use the code below to complete your admin sign-in. It expires shortly.</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
          <p>If you didn't try to sign in as an admin, reset your password and contact support.</p>
          <br/>
          <p>— The Beauvision Team</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      throw new AppError(JSON.stringify(errorData), 500);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('Error sending admin login code email:', message);

    return { success: false, error: message };
  }
}
export async function adminCodeEmail(toEmail: string, code: string): Promise<SendEmailResponse> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_FROM as string,
          name: 'PICA by Beauvision',
        },
        to: [{ email: toEmail }],
        subject: 'Your PICA password reset code',
        htmlContent: `
          <h2>Reset your PICA password</h2>
          <p>Use the code below to reset your password. It expires in 10 minutes.</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <br/>
          <p>— The Beauvision Team</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      throw new AppError(JSON.stringify(errorData), 500);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('Error sending password reset email:', message);

    return { success: false, error: message };
  }
}

export async function sendAdminInviteEmail(
  toEmail: string,
  inviteLink: string,
  roleName?: string | null
): Promise<SendEmailResponse> {
  try {
    const roleLine = roleName
      ? `You've been assigned the <strong>${roleName}</strong> role.`
      : '';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_FROM as string,
          name: 'PICA by Beauvision',
        },
        to: [{ email: toEmail }],
        subject: "You've been invited to the PICA admin team",
        htmlContent: `
          <h2>You're invited to the PICA admin team</h2>
          <p>An administrator has invited you to join the PICA by Beauvision admin dashboard.</p>
          ${roleLine ? `<p>${roleLine}</p>` : ''}
          <p>To activate your account, click the button below and set your own password:</p>
          <p>
            <a href="${inviteLink}" style="display:inline-block; background-color:#3B82F6; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold;">Accept invitation &amp; set password</a>
          </p>
          <p>Or paste this link into your browser:</p>
          <p><a href="${inviteLink}">${inviteLink}</a></p>
          <p>This link expires in 24 hours. If you weren't expecting this invitation, you can safely ignore this email.</p>
          <br/>
          <p>— The Beauvision Team</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      throw new AppError(JSON.stringify(errorData), 500);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('Error sending admin invite email:', message);

    return { success: false, error: message };
  }
}

export async function sendPaymentSuccessEmail({
  toEmail,
  businessName,
  amount,
  currency,
  reference,
  reportDownloadUrl,
  plan,
}: {
  toEmail: string;
  businessName: string | null;
  amount: number;
  currency: string;
  reference: string;
  reportDownloadUrl: string;
  plan?: string;
}): Promise<SendEmailResponse> {
  try {
    const greetingName = businessName ?? 'there';

    const isPhase2B = plan === 'PHASE2B_PILLAR';
    const planName = isPhase2B ? 'Phase 2B Module' : 'Phase 2A report';
    const description = isPhase2B
      ? 'Your Phase 2B Deep Dive module is now unlocked. You can start your session any time from your dashboard.'
      : 'Your full Phase 2A diagnostic report is now unlocked. You can download it any time from your dashboard.';
    const actionText = isPhase2B ? 'Start your Deep Dive' : 'Download your report';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_FROM as string,
          name: 'PICA by Beauvision',
        },
        to: [{ email: toEmail }],
        subject: `Payment received — your PICA ${planName} is unlocked`,
        htmlContent: `
          <h2>Thank you, ${greetingName}!</h2>
          <p>We've received your payment of <strong>${currency} ${amount.toLocaleString()}</strong>.</p>
          <p>${description}</p>
          <p><a href="${reportDownloadUrl}">${actionText}</a></p>
          <p>Reference: <code>${reference}</code></p>
          <br/>
          <p>— The Beauvision Team</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      throw new AppError(JSON.stringify(errorData), 500);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error sending payment success email:', message);
    return { success: false, error: message };
  }
}

export async function sendReportEmail({
  toEmail,
  businessName,
  pdfBuffer,
  reportPdfUrl,
}: {
  toEmail: string;
  businessName: string;
  pdfBuffer: Buffer;
  reportPdfUrl: string;
}): Promise<SendEmailResponse> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_FROM as string,
          name: 'PICA by Beauvision',
        },
        to: [{ email: toEmail }],
        subject: `Your PICA Business Health Report — ${businessName}`,
        htmlContent: `
          <h2>Your PICA Snapshot Report is Ready</h2>
          <p>Hi ${businessName},</p>
          <p>Thank you for completing the PICA Business Health Assessment.</p>
          <p>Your full report is attached to this email as a PDF.</p>
          <p>You can also <a href="${reportPdfUrl}">download it here</a>.</p>
          <br/>
          <p>— The Beauvision Team</p>
        `,
        attachment: [
          {
            name: `PICA-Report-${businessName}.pdf`,
            content: pdfBuffer.toString('base64'),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      throw new AppError(JSON.stringify(errorData), 500);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('Error sending report email:', message);

    return { success: false, error: message };
  }
}

export async function sendCouponEmail({
  toEmail,
  couponCode,
  description,
  amountOff,
  percentOff,
  plan,
  pillarName,
}: {
  toEmail: string;
  couponCode: string;
  description: string | null;
  amountOff: number;
  percentOff: number;
  plan: string | null;
  pillarName: string | null;
}): Promise<SendEmailResponse> {
  try {
    let discountStr = '';
    if (percentOff > 0) {
      discountStr = `${percentOff}% off`;
    } else {
      discountStr = `N${new Intl.NumberFormat('en-NG').format(amountOff)} off`;
    }

    let targetPlanStr = 'any diagnostic package';
    if (plan === 'PHASE2A') {
      targetPlanStr = 'the Phase 2A Strategic Scan';
    } else if (plan === 'PHASE2B_PILLAR') {
      targetPlanStr = `the Phase 2B Deep Dive module (${pillarName || 'selected pillar'})`;
    }

    const htmlContent = `
      <h2>You've Received a Discount Coupon on PICA!</h2>
      <p>Hello,</p>
      <p>We are pleased to inform you that a discount coupon has been created for your account on PICA by Beauvision.</p>
      <p>Use the coupon code below at checkout to get <strong>${discountStr}</strong> on <strong>${targetPlanStr}</strong>:</p>
      <p style="font-size: 24px; font-weight: bold; color: #2563EB; letter-spacing: 2px; background-color: #F3F4F6; padding: 10px 20px; display: inline-block; border-radius: 8px; margin: 15px 0;">${couponCode}</p>
      ${description ? `<p><strong>Note:</strong> ${description}</p>` : ''}
      <p>To use it, simply copy the code and apply it in the coupon field during checkout on your dashboard.</p>
      <br/>
      <p>Best regards,</p>
      <p>— The Beauvision Team</p>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        sender: {
          email: process.env.EMAIL_FROM as string,
          name: 'PICA by Beauvision',
        },
        to: [{ email: toEmail }],
        subject: `PICA Discount Code: Get ${discountStr} on your next assessment`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      throw new AppError(JSON.stringify(errorData), 500);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error sending coupon email:', message);
    return { success: false, error: message };
  }
}
