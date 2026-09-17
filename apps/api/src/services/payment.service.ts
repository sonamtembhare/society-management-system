import * as paymentModel from "../models/payment.model";
import * as residentModel from "../models/resident.model";
import { AppError } from "../middleware/error.middleware";
import { CreatePaymentInput, UpdatePaymentInput } from "../validators/payment.validator";

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN") {
    return paymentModel.findAll();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    throw new AppError("Resident profile not found", 404);
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

export const create = async (data: CreatePaymentInput) => {
  return paymentModel.create({
    maintenance_id: data.maintenance_id,
    resident_id: data.resident_id,
    amount: data.amount,
    payment_method: data.payment_method ?? null,
    transaction_id: data.transaction_id ?? null,
    status: "PENDING",
  });
};

export const update = async (id: number, data: UpdatePaymentInput) => {
  const existing = await paymentModel.findById(id);
  if (!existing) {
    throw new AppError("Payment not found", 404);
  }
  const updateData: Record<string, unknown> = {};
  if (data.status !== undefined) updateData["status"] = data.status;
  if (data.payment_method !== undefined) updateData["payment_method"] = data.payment_method ?? null;
  if (data.transaction_id !== undefined) updateData["transaction_id"] = data.transaction_id ?? null;
  return paymentModel.update(id, updateData);
};
