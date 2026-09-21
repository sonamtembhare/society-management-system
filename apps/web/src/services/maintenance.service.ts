import api from "./api";
import { Maintenance, CreateMaintenance, UpdateMaintenance, MaintenanceStats, GenerateLastMonthResponse, SendRemindersResponse, ApiResponse } from "@/src/types";

export const getMaintenance = async (): Promise<Maintenance[]> => {
  const response = await api.get<ApiResponse<Maintenance[]>>("/maintenance");
  return response.data.data || [];
};

export const getMaintenanceById = async (id: number): Promise<Maintenance> => {
  const response = await api.get<ApiResponse<Maintenance>>(`/maintenance/${id}`);
  return response.data.data!;
};

export const createMaintenance = async (data: CreateMaintenance): Promise<{ flatId: number; success: boolean; message: string }[]> => {
  const response = await api.post<ApiResponse<{ flatId: number; success: boolean; message: string }[]>>("/maintenance", data);
  return response.data.data!;
};

export const updateMaintenance = async (id: number, data: UpdateMaintenance): Promise<Maintenance> => {
  const response = await api.put<ApiResponse<Maintenance>>(`/maintenance/${id}`, data);
  return response.data.data!;
};

export const cancelMaintenance = async (id: number): Promise<void> => {
  await api.delete(`/maintenance/${id}`);
};

export const getMaintenanceStats = async (): Promise<MaintenanceStats> => {
  const response = await api.get<ApiResponse<MaintenanceStats>>("/maintenance/stats");
  return response.data.data!;
};

export const getMaintenancePayments = async (billId: number): Promise<unknown[]> => {
  const response = await api.get<ApiResponse<unknown[]>>(`/maintenance/${billId}/payments`);
  return response.data.data || [];
};

export const generateLastMonthBills = async (): Promise<GenerateLastMonthResponse> => {
  const response = await api.post<ApiResponse<GenerateLastMonthResponse>>("/maintenance/generate-last-month");
  return response.data.data!;
};

export const sendReminders = async (): Promise<SendRemindersResponse> => {
  const response = await api.post<ApiResponse<SendRemindersResponse>>("/maintenance/send-reminders");
  return response.data.data!;
};
