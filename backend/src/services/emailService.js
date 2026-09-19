/**
 * Email Dispatch Service
 * 
 * Delivers One-Time Passwords (OTP) and verification emails directly
 * to user email / Gmail addresses using Nodemailer and SMTP / Gmail transports.
 */

import nodemailer from 'nodemailer';

// Cache transporter instance
let transporter = null;
let transporterInitialized = false;

/**
 * Initializes the mail transporter based on environment configuration.
 * Supports:
 * - Gmail (via GMAIL_USER + GMAIL_APP_PASSWORD or SMTP_USER + SMTP_PASS with smtp.gmail.com)
 * - Standard SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE)
 * - Graceful fallback mode with detailed delivery logs if SMTP is not yet configured
 */
export const getMailTransporter = async () => {
  if (transporterInitialized) {
    return transporter;
  }

  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || (smtpUser && smtpUser.includes('@gmail.com') ? 'smtp.gmail.com' : 'smtp.gmail.com');
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  if (smtpUser && smtpPass) {
    try {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      console.log(`[EMAIL SERVICE] ✅ Nodemailer SMTP transport active with user: ${smtpUser} (${smtpHost}:${smtpPort})`);
      transporterInitialized = true;
      return transporter;
    } catch (err) {
      console.warn('[EMAIL SERVICE] Warning initializing SMTP transporter:', err.message);
    }
  }

  // If no SMTP credentials provided, attempt to configure or log fallback
  console.log('[EMAIL SERVICE] ℹ️ SMTP credentials (SMTP_USER / SMTP_PASS or GMAIL_USER / GMAIL_APP_PASSWORD) not configured. Logging OTP delivery to console.');
  transporterInitialized = true;
  transporter = null;
  return null;
};

/**
 * Sends a 6-digit OTP verification email to the user's Gmail / email address.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.otp - The 6-digit OTP code
 * @param {number} params.expiresInMinutes - Minutes until expiration (default 10)
 * @returns {Promise<{ success: boolean, delivered: boolean, messageId?: string }>}
 */
export const sendOtpEmail = async ({ to, otp, expiresInMinutes = 10 }) => {
  const mailTransporter = await getMailTransporter();
  const fromAddress = process.env.SMTP_FROM || `"Campus Grievance Portal" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@campus.edu'}>`;

  const subject = `Your 6-Digit Verification Code: ${otp} - Campus Grievance Portal`;

  const textContent = `
Campus Grievance Redressal Portal
----------------------------------
Your Email Verification Code: ${otp}

Please enter this 6-digit One-Time Password (OTP) to verify your email address and activate your student account.
This verification code is valid for ${expiresInMinutes} minutes.

For your security, never share this code with anyone.
If you did not request this registration, please disregard this email.
`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="520px" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #4338ca; padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                Campus Grievance Portal
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #c7d2fe; font-weight: 400;">
                Official Institutional Redressal & Support
              </p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
                Verify Your Email Address
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Hello, thank you for registering with the Campus Grievance Redressal Portal. Please use the 6-digit One-Time Password (OTP) below to verify your email address and activate your account:
              </p>

              <!-- OTP Callout Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 8px;">
                      Your One-Time Passcode (OTP)
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #312e81; padding: 4px 0;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                      ⏱️ Valid for <strong>${expiresInMinutes} minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                Enter this 6-digit code on the registration screen to complete your student profile setup.
              </p>

              <!-- Security Note -->
              <div style="border-left: 3px solid #6366f1; padding-left: 12px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  <strong>Security Note:</strong> Do not share this OTP with anyone. Campus officials will never ask for your password or verification code. If you did not initiate this request, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © 2026 Campus Grievance Redressal System • Confidential & Secure
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EMAIL SERVICE] ✉️ Successfully sent OTP email to: ${to} (MessageId: ${info.messageId})`);
      return {
        success: true,
        delivered: true,
        messageId: info.messageId,
      };
    } catch (err) {
      console.error(`[EMAIL SERVICE] ❌ Failed to dispatch email via SMTP to ${to}:`, err.message);
      // Fallback: log code to console so system remains operable
      console.log(`[EMAIL SERVICE/FALLBACK] 📧 OTP for ${to}: [ ${otp} ]`);
      return {
        success: true,
        delivered: false,
        error: err.message,
      };
    }
  }

  // Transporter not configured: log directly to server console
  console.log(`[EMAIL SERVICE] ✉️ [Email Delivery to ${to}] OTP Code: [ ${otp} ] (Valid for ${expiresInMinutes} mins)`);
  return {
    success: true,
    delivered: false,
    note: 'SMTP not configured; OTP logged to server output.',
  };
};
