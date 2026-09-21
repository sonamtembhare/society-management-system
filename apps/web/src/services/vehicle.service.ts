import api from "./api";
import { Vehicle, CreateVehicle, UpdateVehicle, ApiResponse } from "@/src/types";

export const getVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get<ApiResponse<Vehicle[]>>("/vehicles");
  return response.data.data || [];
};

export const getVehicleById = async (id: number): Promise<Vehicle> => {
  const response = await api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);
  return response.data.data!;
};

export const createVehicle = async (data: CreateVehicle): Promise<Vehicle> => {
  const response = await api.post<ApiResponse<Vehicle>>("/vehicles", data);
  return response.data.data!;
};

export const updateVehicle = async (id: number, data: UpdateVehicle): Promise<Vehicle> => {
  const response = await api.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, data);
  return response.data.data!;
};

export const deleteVehicle = async (id: number): Promise<void> => {
  await api.delete(`/vehicles/${id}`);
};

export const searchVehicles = async (query: string): Promise<Vehicle[]> => {
  const response = await api.get<ApiResponse<Vehicle[]>>("/vehicles/search", {
    params: { q: query },
  });
  return response.data.data || [];
};

export const deactivateVehicle = async (id: number): Promise<void> => {
  await api.patch(`/vehicles/${id}/deactivate`);
};
