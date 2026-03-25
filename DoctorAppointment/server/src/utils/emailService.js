import nodemailer from 'nodemailer';

const buildTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export const sendVerificationEmail = async ({ email, firstName, verificationToken }) => {
  const verificationUrl = `${
    process.env.CLIENT_URL || 'http://localhost:5173'
  }/verify-email/${verificationToken}`;

  const transporter = buildTransport();

  if (!transporter) {
    console.warn(`SMTP is not configured. Verification URL for ${email}: ${verificationUrl}`);
    return { delivered: false, verificationUrl };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verify your AI-MediCare account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #0f172a;">Verify your email</h2>
        <p>Hello ${firstName || 'there'},</p>
        <p>Welcome to AI-MediCare. Please verify your email address to activate your account.</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 18px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create this account, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { delivered: true, verificationUrl };
};
