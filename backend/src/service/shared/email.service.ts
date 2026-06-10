import dotenv from 'dotenv';
import AppError from './appError';

dotenv.config();

interface SendEmailResponse {
  success: boolean;
  error?: string;
}

// ── Shared email layout ─────────────────────────────────────────────────────
// One responsive, email-client-safe template wraps every message: a branded
// header band, a centered white content card on a muted background, and a
// footer. Uses inline styles + table layout because email clients (Outlook,
// Gmail) strip <style> blocks and ignore fl/grid. Keep all new emails routed
// through renderEmail() so the look stays consistent.

const BRAND = 'PICA';
const BRAND_TAGLINE = 'by Beauvision';
const BRAND_COLOR = '#3B82F6';
const BG_COLOR = '#F3F4F6';
const CARD_COLOR = '#FFFFFF';
const TEXT_COLOR = '#1F2937';
const MUTED_COLOR = '#6B7280';

interface EmailLayoutOptions {
  // Main heading shown at the top of the white card.
  heading: string;
  // Inner HTML for the body (paragraphs, code blocks, buttons).
  bodyHtml: string;
  // Optional preheader: the grey preview snippet shown in the inbox list.
  preheader?: string;
}

function renderEmail({ heading, bodyHtml, preheader }: EmailLayoutOptions): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${BRAND}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${BG_COLOR}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
    ${
      preheader
        ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:${BG_COLOR};">${preheader}</div>`
        : ''
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">

            <!-- Header band -->
            <tr>
              <td align="center" style="background-color:${BRAND_COLOR}; border-radius:12px 12px 0 0; padding:28px 24px;">
                <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:28px; font-weight:800; letter-spacing:6px; color:#ffffff;">${BRAND}</div>
                <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; letter-spacing:2px; color:rgba(255,255,255,0.85); margin-top:4px; text-transform:uppercase;">${BRAND_TAGLINE}</div>
              </td>
            </tr>

            <!-- Content card -->
            <tr>
              <td style="background-color:${CARD_COLOR}; padding:40px 40px 32px 40px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; color:${TEXT_COLOR};">
                <h1 style="margin:0 0 20px 0; font-size:22px; font-weight:700; color:${TEXT_COLOR}; text-align:center;">${heading}</h1>
                <div style="font-size:15px; line-height:1.6; color:${TEXT_COLOR};">
                  ${bodyHtml}
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background-color:${CARD_COLOR}; border-radius:0 0 12px 12px; padding:24px 40px 32px 40px; border-top:1px solid #EEF0F3;">
                <p style="margin:0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:13px; color:${MUTED_COLOR};">— The Beauvision Team</p>
                <p style="margin:12px 0 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; color:#9CA3AF;">© ${BRAND} ${BRAND_TAGLINE}. This is an automated message — please do not reply.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// Centered call-to-action button (table-based for Outlook compatibility).
function ctaButton(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
    <tr>
      <td align="center" style="border-radius:8px; background-color:${BRAND_COLOR};">
        <a href="${href}" target="_blank" style="display:inline-block; padding:14px 32px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:8px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

// Large centered verification / OTP code block.
function codeBlock(code: string): string {
  return `
  <div style="margin:28px auto; text-align:center;">
    <div style="display:inline-block; background-color:${BG_COLOR}; border:1px solid #E5E7EB; border-radius:10px; padding:18px 32px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:30px; font-weight:800; letter-spacing:8px; color:${TEXT_COLOR};">${code}</div>
  </div>`;
}

// Single Brevo send helper — every template builds its HTML then calls this.
async function sendBrevoEmail(params: {
  toEmail: string;
  subject: string;
  htmlContent: string;
  attachment?: { name: string; content: string }[];
}): Promise<SendEmailResponse> {
  try {
    const body: Record<string, unknown> = {
      sender: {
        email: process.env.EMAIL_FROM as string,
        name: `${BRAND} ${BRAND_TAGLINE}`,
      },
      to: [{ email: params.toEmail }],
      subject: params.subject,
      htmlContent: params.htmlContent,
    };
    if (params.attachment) {
      body.attachment = params.attachment;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY as string,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      throw new AppError(JSON.stringify(errorData), 500);
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error sending email (${params.subject}):`, message);
    return { success: false, error: message };
  }
}

// ── Templates ───────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  toEmail: string,
  businessName: string
): Promise<SendEmailResponse> {
  const html = renderEmail({
    heading: `Welcome to ${BRAND}, ${businessName}!`,
    preheader: `Your ${BRAND} account is ready.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">Thanks for creating your account with ${BRAND} ${BRAND_TAGLINE}.</p>
      <p style="margin:0 0 16px 0;">You can now sign in to view your assessment results, track your business health, and unlock the full snapshot report.</p>
      <p style="margin:0; color:${MUTED_COLOR}; font-size:13px;">If you didn't create this account, you can safely ignore this email.</p>
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `Welcome to ${BRAND} — ${businessName}`,
    htmlContent: html,
  });
}

// Admin LOGIN one-time code. (Sent during admin sign-in, NOT password reset.)
export async function sendPasswordResetEmail(
  toEmail: string,
  code: string
): Promise<SendEmailResponse> {
  const html = renderEmail({
    heading: `Reset your ${BRAND} password`,
    preheader: 'Use this code to reset your password.',
    bodyHtml: `
      <p style="margin:0 0 8px 0; text-align:center;">Use the code below to reset your password. It expires in 10 minutes.</p>
      ${codeBlock(code)}
      <p style="margin:0; text-align:center; color:${MUTED_COLOR}; font-size:13px;">If you didn't request a password reset, you can safely ignore this email.</p>
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `Your ${BRAND} password reset code`,
    htmlContent: html,
  });
}

// Admin LOGIN one-time code, sent during admin sign-in verification.
export async function adminCodeEmail(toEmail: string, code: string): Promise<SendEmailResponse> {
  const html = renderEmail({
    heading: 'Verify your admin sign-in',
    preheader: `Your ${BRAND} admin login code.`,
    bodyHtml: `
      <p style="margin:0 0 8px 0; text-align:center;">Use the code below to complete your admin sign-in. It expires shortly.</p>
      ${codeBlock(code)}
      <p style="margin:0; text-align:center; color:${MUTED_COLOR}; font-size:13px;">If you didn't try to sign in as an admin, reset your password and contact support immediately.</p>
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `Your ${BRAND} admin login code`,
    htmlContent: html,
  });
}

export async function sendAdminInviteEmail(
  toEmail: string,
  inviteLink: string,
  department?: string | null
): Promise<SendEmailResponse> {
  const roleLine = department
    ? `<p style="margin:0 0 16px 0; text-align:center;">You've been added to the <strong>${department}</strong> team.</p>`
    : '';

  const html = renderEmail({
    heading: `You're invited to the ${BRAND} admin team`,
    preheader: 'Accept your invitation and set a password.',
    bodyHtml: `
      <p style="margin:0 0 16px 0;">An administrator has invited you to join the ${BRAND} ${BRAND_TAGLINE} admin dashboard.</p>
      ${roleLine}
      <p style="margin:0 0 8px 0;">To activate your account, click the button below and set your own password:</p>
      ${ctaButton(inviteLink, 'Accept invitation & set password')}
      <p style="margin:0 0 8px 0; color:${MUTED_COLOR}; font-size:13px;">Or paste this link into your browser:</p>
      <p style="margin:0 0 16px 0; word-break:break-all;"><a href="${inviteLink}" style="color:${BRAND_COLOR};">${inviteLink}</a></p>
      <p style="margin:0; color:${MUTED_COLOR}; font-size:13px;">This link expires in 24 hours. If you weren't expecting this invitation, you can safely ignore this email.</p>
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `You've been invited to the ${BRAND} admin team`,
    htmlContent: html,
  });
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
  const greetingName = businessName ?? 'there';

  const isPhase2B = plan === 'PHASE2B_PILLAR';
  const planName = isPhase2B ? 'Phase 2B Module' : 'Phase 2A report';
  const description = isPhase2B
    ? 'Your Phase 2B Deep Dive module is now unlocked. You can start your session any time from your dashboard.'
    : 'Your full Phase 2A diagnostic report is now unlocked. You can download it any time from your dashboard.';
  const actionText = isPhase2B ? 'Start your Deep Dive' : 'Download your report';

  const html = renderEmail({
    heading: `Thank you, ${greetingName}!`,
    preheader: `Your ${BRAND} ${planName} is unlocked.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">We've received your payment of <strong>${currency} ${amount.toLocaleString()}</strong>.</p>
      <p style="margin:0 0 8px 0;">${description}</p>
      ${ctaButton(reportDownloadUrl, actionText)}
      <p style="margin:0; color:${MUTED_COLOR}; font-size:13px;">Reference: <code style="background-color:${BG_COLOR}; padding:2px 6px; border-radius:4px;">${reference}</code></p>
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `Payment received — your ${BRAND} ${planName} is unlocked`,
    htmlContent: html,
  });
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
  const html = renderEmail({
    heading: 'Your Snapshot Report is ready',
    preheader: `Your ${BRAND} Business Health Report is attached.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">Hi ${businessName},</p>
      <p style="margin:0 0 16px 0;">Thank you for completing the ${BRAND} Business Health Assessment.</p>
      <p style="margin:0 0 8px 0;">Your full report is attached to this email as a PDF.</p>
      ${ctaButton(reportPdfUrl, 'Download your report')}
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `Your ${BRAND} Business Health Report — ${businessName}`,
    htmlContent: html,
    attachment: [
      {
        name: `PICA-Report-${businessName}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  });
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

  const html = renderEmail({
    heading: `You've received a discount coupon!`,
    preheader: `Get ${discountStr} on your next ${BRAND} assessment.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">Hello,</p>
      <p style="margin:0 0 16px 0;">A discount coupon has been created for your account on ${BRAND} ${BRAND_TAGLINE}.</p>
      <p style="margin:0 0 8px 0; text-align:center;">Use the code below at checkout to get <strong>${discountStr}</strong> on <strong>${targetPlanStr}</strong>:</p>
      ${codeBlock(couponCode)}
      ${
        description
          ? `<p style="margin:0 0 16px 0; text-align:center; color:${MUTED_COLOR}; font-size:13px;"><strong>Note:</strong> ${description}</p>`
          : ''
      }
      <p style="margin:0; text-align:center;">Simply copy the code and apply it in the coupon field during checkout on your dashboard.</p>
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `${BRAND} Discount Code: Get ${discountStr} on your next assessment`,
    htmlContent: html,
  });
}
