import { sendConsultationConfirmedEmail } from '../../service/shared/email.service';

/**
 * Fire-and-forget wrapper around sendConsultationConfirmedEmail. Mirrors
 * sendSuccessEmailBestEffort in payment.service — the admin shouldn't see
 * the confirm flow fail just because Brevo had a hiccup. Logs to console
 * for later diagnosis.
 */
export function sendConsultationConfirmedEmailBestEffort(input: {
  toEmail: string;
  businessName: string | null;
  tierName: string;
  durationMinutes: number;
  scheduledAt: Date;
  meetingLink: string;
}): void {
  void sendConsultationConfirmedEmail(input).catch((error) => {
    console.error('[consultation:confirm] email failed:', error);
  });
}
