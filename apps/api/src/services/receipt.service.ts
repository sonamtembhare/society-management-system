import PDFDocument from "pdfkit";
import * as paymentModel from "../models/payment.model";
import * as societyModel from "../models/society.model";
import { AppError } from "../middleware/error.middleware";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const generateReceipt = async (paymentId: number): Promise<Buffer> => {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  const societies = await societyModel.findAll();
  const society = societies.length > 0 ? societies[0] : null;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: Error) => reject(err));

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text("PAYMENT RECEIPT", { align: "center" });
    doc.moveDown(0.5);

    // Society info
    if (society) {
      doc.fontSize(14).font("Helvetica-Bold").text(society.name, { align: "center" });
      doc.fontSize(10).font("Helvetica").text(society.address || "", { align: "center" });
      if (society.phone || society.email) {
        doc.text(`${society.phone || ""} ${society.email ? `| ${society.email}` : ""}`, { align: "center" });
      }
    }

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Receipt info
    const receiptY = doc.y;
    doc.fontSize(10).font("Helvetica-Bold").text("Receipt No:", 50, receiptY);
    doc.font("Helvetica").text(`#${payment.id}`, 160, receiptY);

    doc.font("Helvetica-Bold").text("Date:", 350, receiptY);
    doc.font("Helvetica").text(new Date(payment.payment_date).toLocaleDateString("en-IN"), 420, receiptY);

    doc.moveDown(1.5);

    // Bill details
    doc.fontSize(12).font("Helvetica-Bold").text("Bill Details", 50);
    doc.moveDown(0.3);

    const detailY = doc.y;
    doc.fontSize(10).font("Helvetica").text("Flat Number:", 50, detailY);
    doc.font("Helvetica-Bold").text(payment.flat_number || "-", 160, detailY);

    doc.font("Helvetica").text("Resident:", 350, detailY);
    doc.font("Helvetica-Bold").text(payment.resident_name || "-", 420, detailY);

    doc.moveDown(0.8);
    const detailY2 = doc.y;
    doc.font("Helvetica").text("Billing Period:", 50, detailY2);
    doc.font("Helvetica-Bold").text(
      payment.billing_month && payment.billing_year
        ? `${monthNames[payment.billing_month - 1]} ${payment.billing_year}`
        : "-",
      160, detailY2
    );

    doc.font("Helvetica").text("Payment Method:", 350, detailY2);
    doc.font("Helvetica-Bold").text(payment.payment_method, 460, detailY2);

    doc.moveDown(0.8);
    const detailY3 = doc.y;
    doc.font("Helvetica").text("Bill Status:", 50, detailY3);
    doc.font("Helvetica-Bold").text(payment.bill_status || "-", 160, detailY3);

    if (payment.transaction_id) {
      doc.font("Helvetica").text("Transaction ID:", 350, detailY3);
      doc.font("Helvetica-Bold").text(payment.transaction_id, 460, detailY3);
    }

    if (payment.receipt_number) {
      doc.moveDown(0.8);
      const detailY4 = doc.y;
      doc.font("Helvetica").text("Receipt Number:", 50, detailY4);
      doc.font("Helvetica-Bold").text(payment.receipt_number, 160, detailY4);
    }

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Payment summary
    doc.fontSize(12).font("Helvetica-Bold").text("Payment Summary", 50);
    doc.moveDown(0.3);

    const summaryY = doc.y;
    doc.fontSize(10).font("Helvetica").text("Bill Amount:", 50, summaryY);
    doc.font("Helvetica-Bold").text(`Rs. ${payment.total_amount || "-"}`, 160, summaryY);

    if (payment.remaining_amount !== undefined && payment.remaining_amount !== null) {
      doc.font("Helvetica").text("Remaining After Payment:", 350, summaryY);
      doc.font("Helvetica-Bold").text(`Rs. ${payment.remaining_amount}`, 500, summaryY);
    }

    doc.moveDown(0.8);
    const summaryY2 = doc.y;
    doc.fontSize(14).font("Helvetica-Bold").text("Amount Paid:", 50, summaryY2);
    doc.fontSize(14).font("Helvetica-Bold").text(`Rs. ${payment.paid_amount}`, 160, summaryY2);

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Footer
    doc.fontSize(9).font("Helvetica").fillColor("#666666")
      .text("This is a computer-generated receipt. No signature is required.", { align: "center" });

    doc.end();
  });
};
