/**
 * emailService.js
 *
 * Centralised Nodemailer wrapper for transactional emails.
 *
 * Configuration (add to backend/.env):
 *   EMAIL_HOST=smtp.gmail.com
 *   EMAIL_PORT=587
 *   EMAIL_SECURE=false          # true for port 465, false for 587 (STARTTLS)
 *   EMAIL_USER=you@gmail.com    # SMTP username / sender address
 *   EMAIL_PASS=xxxx xxxx xxxx   # Gmail App Password (NOT your account password)
 *   ADMIN_EMAIL=admin@yourdomain.com  # where admin notifications are delivered
 *   EMAIL_FROM="DeutschLernen <no-reply@yourdomain.com>"  # "From" display name
 *
 * Gmail App Password:
 *   Google Account → Security → 2-Step Verification → App passwords
 *   Select "Mail" + device → generates a 16-char password — use that as EMAIL_PASS
 *
 * For other providers:
 *   Zoho:    host=smtp.zoho.com  port=587
 *   Outlook: host=smtp.office365.com  port=587
 *   SendGrid: host=smtp.sendgrid.net  port=587  user=apikey  pass=<API_KEY>
 */

const nodemailer = require('nodemailer');

// ─── Lazy-initialise the transporter ─────────────────────────────────────────
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE } = process.env;

  if (
    !EMAIL_HOST || EMAIL_HOST.includes('TEMP_REPLACE_ME') ||
    !EMAIL_USER || EMAIL_USER.includes('TEMP_REPLACE_ME') ||
    !EMAIL_PASS || EMAIL_PASS.includes('TEMP_REPLACE_ME')
  ) {
    return null; // Email not configured — callers must handle null gracefully
  }

  _transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT || '587', 10),
    secure: EMAIL_SECURE === 'true', // true = port 465 TLS, false = STARTTLS
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return _transporter;
};

/**
 * Send an email. Fails silently (logs a warning) if email is not configured,
 * so that core features (consultation saving, contact saving) still work even
 * without SMTP credentials.
 *
 * @param {{ to: string, subject: string, html: string, replyTo?: string }} options
 * @returns {Promise<void>}
 */
const sendEmail = async ({ to, subject, html, replyTo }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('[Email] SMTP not configured — skipping email to:', to);
    return;
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  try {
    await transporter.sendMail({ from, to, replyTo, subject, html });
    console.log(`[Email] Sent "${subject}" → ${to}`);
  } catch (err) {
    // Log but never crash the request — email is non-critical
    console.error('[Email] Failed to send:', err.message);
  }
};

// ─── Email Templates ──────────────────────────────────────────────────────────

/**
 * Notify admin that a new consultation request was submitted.
 */
const sendConsultationAdminNotification = async ({ name, email, phone, country, preferred_time, message }) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || adminEmail.includes('TEMP_REPLACE_ME')) {
    console.warn('[Email] ADMIN_EMAIL not set — skipping consultation notification');
    return;
  }

  await sendEmail({
    to: adminEmail,
    replyTo: email, // "Reply" in email client goes to the student
    subject: `📚 New Consultation Request from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
        <div style="background: #111827; padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">New Consultation Request</h1>
          <p style="color: #9ca3af; margin: 6px 0 0;">DeutschLernen — German Language Platform</p>
        </div>

        <div style="background: #fff; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px; width: 38%;">Full Name</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #111827;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Phone</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${phone || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Country</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${country || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Preferred Time</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${preferred_time || '—'}</td>
            </tr>
          </table>

          ${message ? `
          <div style="margin-top: 20px;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">Message / Learning Goal</p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; color: #374151; font-size: 14px; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>` : ''}

          <div style="margin-top: 24px; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/admin"
               style="background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px;
                      text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
              View in Admin Dashboard
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            Hit Reply to respond directly to ${name} at ${email}
          </p>
        </div>
      </div>
    `,
  });
};

/**
 * Notify admin that a new contact form message was submitted.
 */
const sendContactAdminNotification = async ({ name, email, subject, message }) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || adminEmail.includes('TEMP_REPLACE_ME')) {
    console.warn('[Email] ADMIN_EMAIL not set — skipping contact notification');
    return;
  }

  await sendEmail({
    to: adminEmail,
    replyTo: email,
    subject: `💬 Contact Message: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
        <div style="background: #111827; padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">New Contact Message</h1>
          <p style="color: #9ca3af; margin: 6px 0 0;">DeutschLernen — German Language Platform</p>
        </div>

        <div style="background: #fff; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px; width: 38%;">Name</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #111827;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px;">Subject</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #111827;">${subject}</td>
            </tr>
          </table>

          <div style="margin-top: 20px;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">Message</p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; color: #374151; font-size: 14px; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            Hit Reply to respond directly to ${name} at ${email}
          </p>
        </div>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendConsultationAdminNotification,
  sendContactAdminNotification,
};
