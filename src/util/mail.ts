import nodemailer, { SendMailOptions } from 'nodemailer';

const transporter = nodemailer.createTransport({
  name: `${process.env.EMAIL_SMTP_HOSTNAME}`,
  host: `${process.env.EMAIL_SMTP_HOST}`,
  port: 465,
  secure: true,
  auth: {
    user: `${process.env.EMAIL_SMTP_USER}`,
    pass: `${process.env.EMAIL_SMTP_PASSWORD}`,
  },
});

export async function sendMailNodemailer(msg: SendMailOptions): Promise<void> {
  try {
    await transporter.sendMail(msg);

    if (msg.subject === '[One More Step] Verify Your Registration Email')
      console.log('Verify Your Registration Email Sent');
  } catch (e) {
    throw new Error(`Could not send email: ${e.message}`);
  }
}