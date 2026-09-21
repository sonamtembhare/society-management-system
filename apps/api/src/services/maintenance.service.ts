import * as maintenanceModel from "../models/maintenance.model";
import * as paymentModel from "../models/payment.model";
import * as residentModel from "../models/resident.model";
import * as flatModel from "../models/flat.model";
import * as settingsService from "./settings.service";
import { AppError } from "../middleware/error.middleware";
import { CreateMaintenanceInput, UpdateMaintenanceInput } from "../validators/maintenance.validator";

export const getAll = async (userId: number, role: string) => {
  if (role === "ADMIN") {
    return maintenanceModel.findAll();
  }
  const resident = await residentModel.findByUserId(userId);
  if (!resident) {
    return [];
  }
  return maintenanceModel.findByResidentId(resident.id);
};

export const getById = async (id: number, userId: number, role: string) => {
  const bill = await maintenanceModel.findById(id);
  if (!bill) {
    throw new AppError("Maintenance bill not found", 404);
  }
  if (role !== "ADMIN") {
    const resident = await residentModel.findByUserId(userId);
    if (!resident || resident.id !== bill.resident_id) {
      throw new AppError("Access denied", 403);
    }
  }
  return bill;
};

export const create = async (data: CreateMaintenanceInput, userId: number) => {
  const results: { flatId: number; success: boolean; message: string }[] = [];

  for (const flatId of data.flat_ids) {
    const flat = await flatModel.findById(flatId);
    if (!flat) {
      results.push({ flatId, success: false, message: `Flat #${flatId} not found` });
      continue;
    }

    const resident = await residentModel.findByFlatId(flatId);
    if (!resident || resident.length === 0) {
      results.push({ flatId, success: false, message: `No resident found for flat ${flat.flat_number}` });
      continue;
    }

    const residentId = resident[0]!.id;

    const duplicate = await maintenanceModel.findDuplicate(flatId, data.billing_month, data.billing_year);
    if (duplicate) {
      results.push({ flatId, success: false, message: `Bill already exists for flat ${flat.flat_number} for this period` });
      continue;
    }

    const totalAmount = data.maintenance_amount + (data.additional_charges ?? 0) + (data.late_fee ?? 0);

    await maintenanceModel.create({
      flat_id: flatId,
      resident_id: residentId,
      billing_month: data.billing_month,
      billing_year: data.billing_year,
      maintenance_amount: data.maintenance_amount,
      additional_charges: data.additional_charges ?? 0,
      late_fee: data.late_fee ?? 0,
      total_amount: totalAmount,
      due_date: new Date(data.due_date),
      status: "UNPAID",
      description: data.description ?? null,
    });

    results.push({ flatId, success: true, message: `Bill created for flat ${flat.flat_number}` });
  }

  return results;
};

export const update = async (id: number, data: UpdateMaintenanceInput) => {
  const existing = await maintenanceModel.findById(id);
  if (!existing) {
    throw new AppError("Maintenance bill not found", 404);
  }
  if (existing.status === "PAID") {
    throw new AppError("Cannot update a paid bill", 400);
  }
  if (existing.status === "CANCELLED") {
    throw new AppError("Cannot update a cancelled bill", 400);
  }

  const updateData: Record<string, unknown> = {};
  if (data.maintenance_amount !== undefined) updateData["maintenance_amount"] = data.maintenance_amount;
  if (data.additional_charges !== undefined) updateData["additional_charges"] = data.additional_charges;
  if (data.late_fee !== undefined) updateData["late_fee"] = data.late_fee;
  if (data.due_date !== undefined) updateData["due_date"] = new Date(data.due_date);
  if (data.description !== undefined) updateData["description"] = data.description ?? null;
  if (data.status !== undefined) updateData["status"] = data.status;

  if (data.maintenance_amount !== undefined || data.additional_charges !== undefined || data.late_fee !== undefined) {
    const maint = data.maintenance_amount ?? existing.maintenance_amount;
    const add = data.additional_charges ?? existing.additional_charges;
    const late = data.late_fee ?? existing.late_fee;
    const newTotal = maint + add + late;
    updateData["total_amount"] = newTotal;
    const paidAmount = existing.total_amount - existing.remaining_amount;
    updateData["remaining_amount"] = Math.max(0, newTotal - paidAmount);
  }

  return maintenanceModel.update(id, updateData);
};

export const cancel = async (id: number) => {
  const existing = await maintenanceModel.findById(id);
  if (!existing) {
    throw new AppError("Maintenance bill not found", 404);
  }
  if (existing.status === "PAID") {
    throw new AppError("Cannot cancel a paid bill", 400);
  }
  if (existing.status === "CANCELLED") {
    throw new AppError("Bill is already cancelled", 400);
  }
  return maintenanceModel.update(id, { status: "CANCELLED" });
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
  const payments = await paymentModel.findByBillId(billId);
  return payments;
};

export const getStats = async () => {
  return maintenanceModel.getStats();
};

export const generateLastMonthBills = async () => {
  const now = new Date();
  const appSettings = await settingsService.getAppSettings();

  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const billingMonth = prevDate.getMonth() + 1;
  const billingYear = prevDate.getFullYear();

  const dueDate = new Date(now.getFullYear(), now.getMonth(), appSettings.dueDay);
  const lateFee = now > dueDate ? appSettings.lateFee : 0;

  const flats = await flatModel.findAll();

  const billingPeriod = {
    month: prevDate.toLocaleString("en-US", { month: "long" }),
    year: billingYear,
  };

  const summary = { totalEligible: 0, created: 0, skipped: 0, failed: 0 };
  const skippedDetails: { flatNumber: string; reason: string }[] = [];

  for (const flat of flats) {
    const residents = await residentModel.findByFlatId(flat.id);
    if (!residents || residents.length === 0) {
      summary.skipped++;
      skippedDetails.push({ flatNumber: flat.flat_number, reason: "No active resident" });
      continue;
    }

    const rate = appSettings.rates[flat.type ?? ""];
    if (rate === undefined || rate === 0) {
      summary.skipped++;
      skippedDetails.push({ flatNumber: flat.flat_number, reason: "Unsupported or missing BHK type" });
      continue;
    }

    summary.totalEligible++;

    const existing = await maintenanceModel.findDuplicate(flat.id, billingMonth, billingYear);
    if (existing) {
      summary.skipped++;
      skippedDetails.push({ flatNumber: flat.flat_number, reason: "Bill already exists for this period" });
      continue;
    }

    try {
      const totalAmount = rate + lateFee;
      await maintenanceModel.create({
        flat_id: flat.id,
        resident_id: residents[0]!.id,
        billing_month: billingMonth,
        billing_year: billingYear,
        maintenance_amount: rate,
        additional_charges: 0,
        late_fee: lateFee,
        total_amount: totalAmount,
        due_date: dueDate,
        status: "UNPAID",
        description: `Monthly maintenance - ${billingPeriod.month} ${billingYear}`,
      });
      summary.created++;
    } catch {
      summary.failed++;
      skippedDetails.push({ flatNumber: flat.flat_number, reason: "Failed to create bill" });
    }
  }

  return { billingPeriod, summary, skippedDetails };
};
