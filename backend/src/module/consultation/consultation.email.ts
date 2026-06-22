import {
  sendConsultationConfirmedEmail,
  sendConsultationNoteUpdatedEmail,
} from '../../service/shared/email.service';

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

/**
 * Fire-and-forget wrapper around sendConsultationNoteUpdatedEmail. Fires
 * exactly ONCE per booking — guarded by `adminNotesNotifiedAt` on the row
 * (the service sets it inside the same UPDATE so a concurrent save can't
 * double-fire). Subsequent edits to the notes never call this.
 */
export function sendConsultationNoteUpdatedEmailBestEffort(input: {
  toEmail: string;
  businessName: string | null;
  topic: string;
}): void {
  void sendConsultationNoteUpdatedEmail(input).catch((error) => {
    console.error('[consultation:notes] email failed:', error);
  });
}
