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
