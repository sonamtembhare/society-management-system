import api from "./api";
import { Society, CreateSociety, UpdateSociety, ApiResponse } from "@/src/types";

export const getSocieties = async (): Promise<Society[]> => {
  const response = await api.get<ApiResponse<Society[]>>("/societies");
  return response.data.data || [];
};

export const getSocietyById = async (id: number): Promise<Society> => {
  const response = await api.get<ApiResponse<Society>>(`/societies/${id}`);
  return response.data.data!;
};

export const createSociety = async (data: CreateSociety): Promise<Society> => {
  const response = await api.post<ApiResponse<Society>>("/societies", data);
  return response.data.data!;
};

export const updateSociety = async (id: number, data: UpdateSociety): Promise<Society> => {
  const response = await api.put<ApiResponse<Society>>(`/societies/${id}`, data);
  return response.data.data!;
};

export const deleteSociety = async (id: number): Promise<void> => {
  await api.delete(`/societies/${id}`);
};
