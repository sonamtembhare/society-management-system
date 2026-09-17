import api from "./api";
import { Maintenance, CreateMaintenance, UpdateMaintenance, ApiResponse } from "@/src/types";

export const getMaintenance = async (): Promise<Maintenance[]> => {
  const response = await api.get<ApiResponse<Maintenance[]>>("/maintenance");
  return response.data.data || [];
};

export const getMaintenanceById = async (id: number): Promise<Maintenance> => {
  const response = await api.get<ApiResponse<Maintenance>>(`/maintenance/${id}`);
  return response.data.data!;
};

export const createMaintenance = async (data: CreateMaintenance): Promise<Maintenance> => {
  const response = await api.post<ApiResponse<Maintenance>>("/maintenance", data);
  return response.data.data!;
};

export const updateMaintenance = async (id: number, data: UpdateMaintenance): Promise<Maintenance> => {
  const response = await api.put<ApiResponse<Maintenance>>(`/maintenance/${id}`, data);
  return response.data.data!;
};

export const deleteMaintenance = async (id: number): Promise<void> => {
  await api.delete(`/maintenance/${id}`);
};
