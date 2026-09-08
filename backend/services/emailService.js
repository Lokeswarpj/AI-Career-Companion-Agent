import nodemailer from 'nodemailer';

/**
 * Creates Nodemailer transporter based on environment variables
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
  }

  // Fallback / Development mode when SMTP is not configured
  return null;
}

/**
 * Generates modern, responsive HTML email template for OTP verification
 */
function generateOtpHtmlTemplate(fullName, otp) {
  const digits = otp.split('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CareerPulse AI — Email Verification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      max-width: 580px;
      margin: 30px auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .email-header {
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header-logo {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .header-sub {
      color: rgba(255, 255, 255, 0.88);
      font-size: 13px;
      margin-top: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .email-body {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 12px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 28px;
    }
    .otp-container {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #38bdf8;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .otp-digits {
      display: inline-flex;
      gap: 10px;
      justify-content: center;
    }
    .otp-digit {
      display: inline-block;
      width: 44px;
      height: 52px;
      line-height: 52px;
      background: #0f172a;
      border: 2px solid #6366f1;
      border-radius: 8px;
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      text-align: center;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }
    .expiry-badge {
      display: inline-block;
      margin-top: 14px;
      font-size: 13px;
      color: #fbbf24;
      font-weight: 500;
    }
    .security-notice {
      background: rgba(99, 102, 241, 0.08);
      border-left: 4px solid #6366f1;
      padding: 14px 18px;
      border-radius: 6px;
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.5;
      margin-top: 24px;
    }
    .email-footer {
      background: #090d16;
      border-top: 1px solid #1e293b;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header -->
    <div class="email-header">
      <h1 class="header-logo">CareerPulse AI</h1>
      <div class="header-sub">AI Career Companion & Opportunity Matching Platform</div>
    </div>

    <!-- Body -->
    <div class="email-body">
      <div class="greeting">Hello ${fullName || 'Student'},</div>
      <p class="message">
        Thank you for joining <strong>CareerPulse AI</strong>. To complete your account registration and secure your profile, please enter the following 6-digit One-Time Password (OTP) in your browser:
      </p>

      <!-- OTP Box -->
      <div class="otp-container">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-digits">
          ${digits.map(d => `<span class="otp-digit">${d}</span>`).join('')}
        </div>
        <div class="expiry-badge">⏱️ Code expires in <strong>10 minutes</strong></div>
      </div>

      <!-- Security Notice -->
      <div class="security-notice">
        <strong>🔒 Security Notice:</strong> Never share this verification code with anyone. CareerPulse AI team members will never ask for your OTP. If you did not initiate this registration, please safely ignore this email.
      </div>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <div>CareerPulse AI — Applied Generative AI & Cloud-Native Engineering</div>
      <div style="margin-top: 4px;">Infosys Springboard Virtual Internship Project</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches the OTP verification email
 */
export async function sendOtpEmail(toEmail, fullName, otp) {
  const fromAddress = process.env.EMAIL_FROM || '"CareerPulse AI" <noreply@careerpulse.ai>';
  const subject = `Your CareerPulse AI Verification Code: ${otp}`;
  const htmlContent = generateOtpHtmlTemplate(fullName, otp);
  const textContent = `Hello ${fullName},\n\nYour CareerPulse AI verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.\n\n— CareerPulse AI Team`;

  const transporter = createTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`[EmailService] Verification OTP successfully sent to ${toEmail} (Message ID: ${info.messageId})`);
      return {
        success: true,
        method: 'smtp',
        messageId: info.messageId
      };
    } catch (err) {
      console.error(`[EmailService] Failed to send email via SMTP to ${toEmail}:`, err.message);
      // Fallback to console log so user flow never gets stuck
      logOtpToConsole(toEmail, fullName, otp);
      return {
        success: true,
        method: 'fallback_logged',
        warning: 'SMTP dispatch failed, fell back to secure logger.',
        previewOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      };
    }
  } else {
    // SMTP not configured - Use resilient development/evaluation console fallback
    logOtpToConsole(toEmail, fullName, otp);
    return {
      success: true,
      method: 'simulation_logged',
      message: 'Email simulated in development mode.',
      previewOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    };
  }
}

function logOtpToConsole(toEmail, fullName, otp) {
  console.log('\n================================================================');
  console.log('📧 [CareerPulse AI Email Dispatch — Verification OTP]');
  console.log(`   To:       ${fullName} <${toEmail}>`);
  console.log(`   Subject:  Your CareerPulse AI Verification Code`);
  console.log(`   OTP CODE: [ ${otp.split('').join(' ')} ] (Valid for 10 minutes)`);
  console.log('================================================================\n');
}
