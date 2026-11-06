import dotenv from 'dotenv';

dotenv.config();

interface SendEmailResponse {
  success: boolean;
  error?: string;
}

// ── Beauvision-branded email layout (distinct from PICA shared service) ──
const BRAND = 'Beauvision';
const BRAND_TAGLINE = '';
const BRAND_COLOR = '#F97316';
const BG_COLOR = '#F3F4F6';
const CARD_COLOR = '#FFFFFF';
const TEXT_COLOR = '#1F2937';
const MUTED_COLOR = '#6B7280';
const WEBSITE_URL = process.env.BEAUVISION_APP_URL ?? 'https://beauvisiongroup.com';
const WEBSITE_HOST = 'beauvisiongroup.com';

interface EmailLayoutOptions {
  heading: string;
  bodyHtml: string;
  preheader?: string;
}

function websiteLinkHtml(marginTop = 14): string {
  return `
    <p style="margin:${marginTop}px 0 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:13px; color:${MUTED_COLOR};">
      <a href="${WEBSITE_URL}" target="_blank" rel="noopener noreferrer" style="color:${BRAND_COLOR}; font-weight:600; text-decoration:none;">Visit ${WEBSITE_HOST}</a>
    </p>`;
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
                ${BRAND_TAGLINE ? `<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; letter-spacing:2px; color:rgba(255,255,255,0.85); margin-top:4px; text-transform:uppercase;">${BRAND_TAGLINE}</div>` : ''}
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
                ${websiteLinkHtml()}
                <p style="margin:12px 0 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; color:#9CA3AF;">© ${BRAND}. This is an automated message — please do not reply.</p>
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
        name: `${BRAND}`,
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
      throw new Error(JSON.stringify(errorData));
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error sending email (${params.subject}):`, message);
    return { success: false, error: message };
  }
}

// ── Beauvision Templates ─────────────────────────────────────────────────────

export async function sendBeauvisionAdminCredentialsEmail({
  toEmail,
  name,
  password,
  loginUrl,
}: {
  toEmail: string;
  name: string;
  password?: string;
  loginUrl: string;
}): Promise<SendEmailResponse> {
  const html = `
    <p>Hi ${name},</p>
    <p>An admin account has been created for you.</p>
    <p><strong>Email:</strong> ${toEmail}</p>
    ${password ? `<p><strong>Temporary Password:</strong> ${password}</p>` : ''}
    <p><a href="${loginUrl}" style="display:inline-block;padding:10px 20px;background-color:#000;color:#fff;text-decoration:none;border-radius:4px;">Log in to your account</a></p>
    ${websiteLinkHtml(20)}
  `;

  return sendBrevoEmail({
    toEmail,
    subject: `Your Admin Account Credentials — Beauvision`,
    htmlContent: html,
  });
}

export async function sendBeauvisionAdminInviteEmail(
  toEmail: string,
  inviteLink: string,
  department?: string | null
): Promise<SendEmailResponse> {
  const roleLine = department
    ? `<p style="margin:0 0 16px 0; text-align:center;">You've been added to the <strong>${department}</strong> team.</p>`
    : '';

  const html = renderEmail({
    heading: `You're invited to the Beauvision admin team`,
    preheader: 'Accept your invitation and set a password.',
    bodyHtml: `
      <p style="margin:0 0 16px 0;">An administrator has invited you to join the Beauvision admin dashboard.</p>
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
    subject: `You've been invited to the Beauvision admin team`,
    htmlContent: html,
  });
}

export async function sendBeauvisionAdminPasswordResetLinkEmail(
  toEmail: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = renderEmail({
    heading: `Reset your Beauvision admin password`,
    preheader: `Click the link to reset your admin password.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">You requested a password reset. Click the button below to set a new password:</p>
      ${ctaButton(resetUrl, 'Reset Password')}
      <p style="margin:16px 0 0 0; color:${MUTED_COLOR}; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `Reset your admin password — Beauvision`,
    htmlContent: html,
  });
}

export async function sendBeauvisionDigitalResourceEmail({
  toEmail,
  buyerName,
  resourceTitle,
  fileName,
  fileContentBase64,
}: {
  toEmail: string;
  buyerName: string | null;
  resourceTitle: string;
  fileName: string;
  fileContentBase64: string;
}): Promise<SendEmailResponse> {
  const greetingName = buyerName ?? 'there';

  const html = renderEmail({
    heading: `Here is your resource`,
    preheader: `Thank you for purchasing ${resourceTitle}.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">Hi ${greetingName},</p>
      <p style="margin:0 0 16px 0;">Thank you for your purchase of <strong>${resourceTitle}</strong>!</p>
      <p style="margin:0 0 16px 0;">You will find your document attached to this email. You can download and keep it safely.</p>
      <p style="margin:0; color:${MUTED_COLOR}; font-size:13px;">If you have any issues opening the file, please reply to this email.</p>
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `Your purchase: ${resourceTitle} — Beauvision`,
    htmlContent: html,
    attachment: [
      {
        name: fileName,
        content: fileContentBase64,
      },
    ],
  });
}

export async function sendBeauvisionInquiryEmail(
  toEmail: string,
  inquiry: { name: string; email: string; companyName?: string; serviceRequested: string; message?: string }
): Promise<{ success: boolean; error?: string }> {
  const html = renderEmail({
    heading: `New Service Inquiry`,
    preheader: `You have received a new service inquiry from ${inquiry.name}.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;"><strong>Name:</strong> ${inquiry.name}</p>
      <p style="margin:0 0 16px 0;"><strong>Email:</strong> ${inquiry.email}</p>
      <p style="margin:0 0 16px 0;"><strong>Company:</strong> ${inquiry.companyName || 'N/A'}</p>
      <p style="margin:0 0 16px 0;"><strong>Service Requested:</strong> ${inquiry.serviceRequested}</p>
      <p style="margin:0 0 16px 0;"><strong>Message:</strong><br/> ${inquiry.message || 'No message provided.'}</p>
    `,
  });

  return sendBrevoEmail({
    toEmail,
    subject: `New Service Inquiry — Beauvision`,
    htmlContent: html,
  });
}
