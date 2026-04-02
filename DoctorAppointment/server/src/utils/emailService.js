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

const sendEmail = async ({ to, subject, html, debugLabel }) => {
  const transporter = buildTransport();

  if (!transporter) {
    console.warn(`SMTP is not configured. Unable to send "${debugLabel}" email to ${to}.`);
    return { delivered: false };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });

  return { delivered: true };
};

export const sendVerificationEmail = async (email, verificationToken, firstName = 'there') => {
  const verificationBaseUrl = process.env.VERIFY_EMAIL_URL || 'http://localhost:5000/verify-email';
  const verificationUrl = `${verificationBaseUrl}?token=${verificationToken}`;
  const result = await sendEmail({
    to: email,
    subject: 'Verify your AI-MediCare account',
    debugLabel: 'verification',
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

  if (!result.delivered) {
    console.warn(`Verification URL for ${email}: ${verificationUrl}`);
  }

  return { delivered: result.delivered, verificationUrl };
};

const formatAppointmentDate = (value) => {
  return new Date(value).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const sendAppointmentConfirmedEmail = async ({
  patientEmail,
  patientName,
  doctorName,
  appointmentDate,
  startTime,
  endTime,
  reason = '',
}) => {
  return sendEmail({
    to: patientEmail,
    subject: 'Appointment Confirmed',
    debugLabel: 'patient appointment confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #0f172a;">Appointment Confirmed</h2>
        <p>Hello ${patientName || 'Patient'},</p>
        <p>Your appointment has been confirmed successfully.</p>
        <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
        <p><strong>Date:</strong> ${formatAppointmentDate(appointmentDate)}</p>
        <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Reason:</strong> ${reason || 'General consultation'}</p>
      </div>
    `,
  });
};

export const sendNewAppointmentAssignedEmail = async ({
  doctorEmail,
  doctorName,
  patientName,
  appointmentDate,
  startTime,
  endTime,
  reason = '',
}) => {
  return sendEmail({
    to: doctorEmail,
    subject: 'New Appointment Assigned',
    debugLabel: 'doctor appointment assignment',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #0f172a;">New Appointment Assigned</h2>
        <p>Hello Dr. ${doctorName},</p>
        <p>A new patient appointment has been assigned to your schedule.</p>
        <p><strong>Patient:</strong> ${patientName || 'Patient'}</p>
        <p><strong>Date:</strong> ${formatAppointmentDate(appointmentDate)}</p>
        <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Reason:</strong> ${reason || 'General consultation'}</p>
      </div>
    `,
  });
};
