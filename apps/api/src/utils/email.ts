interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendReminderEmail = async (options: EmailOptions): Promise<void> => {
  console.log(`[REMINDER] Email to ${options.to}: ${options.subject}`);
};
