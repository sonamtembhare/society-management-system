import * as paymentModel from "../models/payment.model";
import * as maintenanceModel from "../models/maintenance.model";
import * as residentModel from "../models/resident.model";
import { AppError } from "../middleware/error.middleware";
import { CreatePaymentInput } from "../validators/payment.validator";

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN") {
    return paymentModel.findAll();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    return [];
  }
  return paymentModel.findByResidentId(resident.id);
};

export const getById = async (id: number) => {
  const payment = await paymentModel.findById(id);
  if (!payment) {
    throw new AppError("Payment not found", 404);
  }
  return payment;
};

export const recordOfflinePayment = async (data: CreatePaymentInput, adminId: number) => {
  const bill = await maintenanceModel.findById(data.bill_id);
  if (!bill) {
    throw new AppError("Maintenance bill not found", 404);
  }
  if (bill.status === "CANCELLED") {
    throw new AppError("Cannot pay a cancelled bill", 400);
  }
  if (bill.status === "PAID") {
    throw new AppError("This bill is already fully paid", 400);
  }

  if (data.paid_amount > bill.remaining_amount) {
    throw new AppError(`Paid amount cannot exceed the remaining amount of ₹${bill.remaining_amount}`, 400);
  }

  const payment = await paymentModel.create({
    bill_id: data.bill_id,
    payment_method: "OFFLINE",
    paid_amount: data.paid_amount,
    receipt_number: data.receipt_number,
    note: data.note,
    received_by: adminId,
  });

  const newRemaining = bill.remaining_amount - data.paid_amount;
  const newStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

  await maintenanceModel.update(data.bill_id, {
    remaining_amount: Math.max(0, newRemaining),
    status: newStatus,
  });

  return payment;
};

export const processOnlinePayment = async (data: CreatePaymentInput, userId: number) => {
  const bill = await maintenanceModel.findById(data.bill_id);
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

  if (data.paid_amount > bill.remaining_amount) {
    throw new AppError(`Paid amount cannot exceed the remaining amount of ₹${bill.remaining_amount}`, 400);
  }

  const payment = await paymentModel.create({
    bill_id: data.bill_id,
    payment_method: "ONLINE",
    paid_amount: data.paid_amount,
    transaction_id: data.transaction_id,
    note: data.note,
  });

  const newRemaining = bill.remaining_amount - data.paid_amount;
  const newStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

  await maintenanceModel.update(data.bill_id, {
    remaining_amount: Math.max(0, newRemaining),
    status: newStatus,
  });

  return payment;
};

export const getPaymentHistory = async (billId: number, userId: number, role: string) => {
  const bill = await maintenanceModel.findById(billId);
  if (!bill) {
    throw new AppError("Maintenance bill not found", 404);
  }
  if (role !== "ADMIN") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident || resident.id !== bill.resident_id) {
      throw new AppError("Access denied", 403);
    }
  }
  return paymentModel.findByBillId(billId);
};
