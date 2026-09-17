import api from "./api";
import { Resident, ResidentDetail, CreateResident, UpdateResident, ApiResponse } from "@/src/types";

export const getResidents = async (): Promise<Resident[]> => {
  const response = await api.get<ApiResponse<Resident[]>>("/residents");
  return response.data.data || [];
};

export const getResidentById = async (id: number): Promise<ResidentDetail> => {
  const response = await api.get<ApiResponse<ResidentDetail>>(`/residents/${id}`);
  return response.data.data!;
};

export const getOwnProfile = async (): Promise<ResidentDetail> => {
  const response = await api.get<ApiResponse<ResidentDetail>>("/residents/profile");
  return response.data.data!;
};

export const createResident = async (data: CreateResident): Promise<Resident> => {
  const response = await api.post<ApiResponse<Resident>>("/residents", data);
  return response.data.data!;
};

export const updateResident = async (id: number, data: UpdateResident): Promise<Resident> => {
  const response = await api.put<ApiResponse<Resident>>(`/residents/${id}`, data);
  return response.data.data!;
};

export const deleteResident = async (id: number): Promise<void> => {
  await api.delete(`/residents/${id}`);
};
