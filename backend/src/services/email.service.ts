import { resend, RESEND_FROM_EMAIL } from '../config/resend';

interface BookingEmailParams {
  to: string;
  customerName: string;
  businessName: string;
  serviceName: string;
  startTime: string;
}

export async function sendBookingConfirmedEmail(params: BookingEmailParams) {
  return resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: params.to,
    subject: `Confirmed: ${params.serviceName} at ${params.businessName}`,
    html: `<p>Hi ${params.customerName},</p>
      <p>Your booking for <strong>${params.serviceName}</strong> at <strong>${params.businessName}</strong> is confirmed for ${params.startTime}.</p>`,
  });
}

export async function sendBookingPendingEmail(params: BookingEmailParams) {
  return resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: params.to,
    subject: `Request received: ${params.serviceName} at ${params.businessName}`,
    html: `<p>Hi ${params.customerName},</p>
      <p>We've sent your request for <strong>${params.serviceName}</strong> at <strong>${params.businessName}</strong> (${params.startTime}) to the business for approval. We'll email you as soon as they respond.</p>`,
  });
}

export async function sendNewBookingRequestEmail(ownerEmail: string, params: BookingEmailParams) {
  return resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: ownerEmail,
    subject: `New booking request: ${params.serviceName}`,
    html: `<p>You have a new booking request from ${params.customerName} for <strong>${params.serviceName}</strong> at ${params.startTime}. Approve or decline it from your Bookly dashboard.</p>`,
  });
}

export async function sendBookingReminderEmail(params: BookingEmailParams) {
  return resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: params.to,
    subject: `Reminder: ${params.serviceName} at ${params.businessName}`,
    html: `<p>Hi ${params.customerName}, just a reminder — your appointment for <strong>${params.serviceName}</strong> at <strong>${params.businessName}</strong> is coming up on ${params.startTime}.</p>`,
  });
}
