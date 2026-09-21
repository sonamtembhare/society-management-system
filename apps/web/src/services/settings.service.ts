import api from "./api";
import { Setting, AppSettings, UpdateSettingsRequest, ApiResponse } from "@/src/types/settings";

export const getAllSettings = async (): Promise<Setting[]> => {
  const response = await api.get<ApiResponse<Setting[]>>("/settings");
  return response.data.data || [];
};

export const getAppSettings = async (): Promise<AppSettings> => {
  const response = await api.get<ApiResponse<AppSettings>>("/settings/app");
  return response.data.data!;
};

export const updateSettings = async (data: UpdateSettingsRequest): Promise<Setting[]> => {
  const response = await api.put<ApiResponse<Setting[]>>("/settings", data);
  return response.data.data!;
};
