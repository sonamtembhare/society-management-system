import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/.env";
import * as maintenanceModel from "../models/maintenance.model";
import * as paymentModel from "../models/payment.model";
import * as residentModel from "../models/resident.model";
import * as settingsService from "./settings.service";
import { AppError } from "../middleware/error.middleware";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (billId: number, userId: number) => {
  const bill = await maintenanceModel.findById(billId);
  if (!bill) {
    throw new AppError("Maintenance bill not found", 404);
  }

  const resident = await residentModel.findByUserId(userId);
  if (!resident || resident.id !== bill.resident_id) {
    throw new AppError("Access denied", 403);
  }

  if (bill.status === "CANCELLED") {
    throw new AppError("Cannot pay a cancelled bill", 400);
  }

  if (bill.status === "PAID") {
    throw new AppError("This bill is already fully paid", 400);
  }

  const amountInPaise = Math.round(bill.remaining_amount * 100);
  const appSettings = await settingsService.getAppSettings();

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: appSettings.currency,
    receipt: `bill_${billId}_flat_${bill.flat_id}`,
    notes: {
      bill_id: String(billId),
      flat_number: bill.flat_number,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
  };
};

export const verifyPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  billId: number,
  userId: number
) => {
  const bill = await maintenanceModel.findById(billId);
  if (!bill) {
    throw new AppError("Maintenance bill not found", 404);
  }

  const resident = await residentModel.findByUserId(userId);
  if (!resident || resident.id !== bill.resident_id) {
    throw new AppError("Access denied", 403);
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw new AppError("Payment verification failed", 400);
  }

  const currentBill = await maintenanceModel.findById(billId);
  if (!currentBill) {
    throw new AppError("Maintenance bill not found", 404);
  }

  if (currentBill.status === "PAID") {
    throw new AppError("This bill is already fully paid", 409);
  }

  const payment = await paymentModel.create({
    bill_id: billId,
    payment_method: "ONLINE",
    paid_amount: currentBill.remaining_amount,
    transaction_id: razorpayPaymentId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  });

  await maintenanceModel.update(billId, {
    remaining_amount: 0,
    status: "PAID",
  });

  return payment;
};
