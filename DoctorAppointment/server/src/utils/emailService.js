import nodemailer from 'nodemailer';

const buildTransport = () => {
  const { EMAIL_USER, EMAIL_PASS, SMTP_HOST, SMTP_PORT } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  if (!SMTP_HOST || !SMTP_PORT) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

export const sendVerificationEmail = async (email, verificationToken, firstName = 'there') => {
  const verificationBaseUrl = process.env.VERIFY_EMAIL_URL || 'http://localhost:3000/verify-email';
  const verificationUrl = `${verificationBaseUrl}?token=${verificationToken}`;

  const transporter = buildTransport();

  if (!transporter) {
    console.warn(`SMTP is not configured. Verification URL for ${email}: ${verificationUrl}`);
    return { delivered: false, verificationUrl };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your AI-MediCare account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #0f172a;">Verify your email</h2>
        <p>Hello ${firstName},</p>
        <p>Welcome to AI-MediCare. Please verify your email address to activate your account.</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 18px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not create this account, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { delivered: true, verificationUrl };
};
