import * as paymentModel from "../models/payment.model";
import * as societyModel from "../models/society.model";
import { sendReminderEmail } from "../utils/email";
import { AppError } from "../middleware/error.middleware";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface ReminderResult {
  sent: number;
  failed: number;
  skipped: number;
  details: {
    flat_number: string;
    resident_name: string;
    email: string;
    total_amount: number;
    remaining_amount: number;
    billing_month: number;
    billing_year: number;
    status: "SENT" | "FAILED" | "SKIPPED";
    error?: string;
  }[];
}

export const sendPaymentReminders = async (adminId: number): Promise<ReminderResult> => {
  const unpaidBills = await paymentModel.findUnpaidBills();
  if (unpaidBills.length === 0) {
    return { sent: 0, failed: 0, skipped: 0, details: [] };
  }

  const societies = await societyModel.findAll();
  const society = societies.length > 0 ? societies[0] : null;

  const result: ReminderResult = { sent: 0, failed: 0, skipped: 0, details: [] };

  for (const bill of unpaidBills) {
    const email = bill.resident_email;
    if (!email) {
      result.skipped++;
      result.details.push({
        flat_number: bill.flat_number,
        resident_name: bill.resident_name,
        email: "",
        total_amount: bill.total_amount,
        remaining_amount: bill.remaining_amount,
        billing_month: bill.billing_month,
        billing_year: bill.billing_year,
        status: "SKIPPED",
        error: "No email address",
      });
      continue;
    }

    try {
      const monthName = monthNames[bill.billing_month - 1];
      const amount = bill.remaining_amount || bill.total_amount;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Maintenance Payment Reminder</h2>
          <p>Dear ${bill.resident_name},</p>
          <p>This is a friendly reminder that your maintenance payment is <strong>${bill.status === "OVERDUE" ? "overdue" : "pending"}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Flat</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${bill.flat_number}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Period</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${monthName} ${bill.billing_year}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Due</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">₹${amount.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${bill.status}</td>
            </tr>
          </table>
          <p>Please make the payment at the earliest to avoid late fees.</p>
          <p>Thank you,<br/>${society?.name || "Society Management"}</p>
        </div>
      `;

      await sendReminderEmail({
        to: email,
        subject: `Maintenance Payment Reminder - ${bill.flat_number} - ${monthName} ${bill.billing_year}`,
        html,
      });

      result.sent++;
      result.details.push({
        flat_number: bill.flat_number,
        resident_name: bill.resident_name,
        email,
        total_amount: bill.total_amount,
        remaining_amount: bill.remaining_amount,
        billing_month: bill.billing_month,
        billing_year: bill.billing_year,
        status: "SENT",
      });
    } catch (error) {
      result.failed++;
      result.details.push({
        flat_number: bill.flat_number,
        resident_name: bill.resident_name,
        email,
        total_amount: bill.total_amount,
        remaining_amount: bill.remaining_amount,
        billing_month: bill.billing_month,
        billing_year: bill.billing_year,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
};
