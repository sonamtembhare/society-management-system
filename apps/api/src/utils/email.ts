import { Resend } from "resend";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const getResend = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
};

export const sendReminderEmail = async (options: EmailOptions): Promise<void> => {
  const resend = getResend();
  if (!resend) {
    console.log(`[REMINDER] Email to ${options.to}: ${options.subject}`);
    return;
  }

  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    throw new Error(error.message || "Resend email failed");
  }

  console.log(`[REMINDER] Email sent to ${options.to}: ${options.subject} (id: ${data?.id})`);
};