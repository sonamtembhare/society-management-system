import { api } from "./api";
import type { ApiResponse, Maintenance, CreateMaintenance, UpdateMaintenance, MaintenanceStats, GenerateLastMonthResponse, SendRemindersResponse } from "../types";

export const maintenanceService = {
  async getMaintenance(): Promise<ApiResponse<Maintenance[]>> {
    return api.get("/maintenance");
  },

  async getMaintenanceById(id: number): Promise<ApiResponse<Maintenance>> {
    return api.get(`/maintenance/${id}`);
  },

  async createMaintenance(data: CreateMaintenance): Promise<ApiResponse<Maintenance>> {
    return api.post("/maintenance", data);
  },

  async updateMaintenance(id: number, data: UpdateMaintenance): Promise<ApiResponse<Maintenance>> {
    return api.put(`/maintenance/${id}`, data);
  },

  async cancelMaintenance(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/maintenance/${id}`);
  },

  async getMaintenanceStats(): Promise<ApiResponse<MaintenanceStats>> {
    return api.get("/maintenance/stats");
  },

  async getMaintenancePayments(billId: number): Promise<ApiResponse<unknown[]>> {
    return api.get(`/maintenance/${billId}/payments`);
  },

  async generateLastMonthBills(): Promise<ApiResponse<GenerateLastMonthResponse>> {
    return api.post("/maintenance/generate-last-month");
  },

  async sendReminders(): Promise<ApiResponse<SendRemindersResponse>> {
    return api.post("/maintenance/send-reminders");
  },
};
