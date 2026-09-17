import api from "./api";
import { Flat, CreateFlat, UpdateFlat, ApiResponse } from "@/src/types";

export const getFlats = async (): Promise<Flat[]> => {
  const response = await api.get<ApiResponse<Flat[]>>("/flats");
  return response.data.data || [];
};

export const getFlatById = async (id: number): Promise<Flat> => {
  const response = await api.get<ApiResponse<Flat>>(`/flats/${id}`);
  return response.data.data!;
};

export const getFlatsBySociety = async (societyId: number): Promise<Flat[]> => {
  const response = await api.get<ApiResponse<Flat[]>>(`/flats/society/${societyId}`);
  return response.data.data || [];
};

export const createFlat = async (data: CreateFlat): Promise<Flat> => {
  const response = await api.post<ApiResponse<Flat>>("/flats", data);
  return response.data.data!;
};

export const updateFlat = async (id: number, data: UpdateFlat): Promise<Flat> => {
  const response = await api.put<ApiResponse<Flat>>(`/flats/${id}`, data);
  return response.data.data!;
};

export const deleteFlat = async (id: number): Promise<void> => {
  await api.delete(`/flats/${id}`);
};
