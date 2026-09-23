import { api } from "./api";
import type { ApiResponse, Setting, AppSettings, UpdateSettingsRequest } from "../types";

export const settingsService = {
  async getAllSettings(): Promise<ApiResponse<Setting[]>> {
    return api.get("/settings");
  },

  async getAppSettings(): Promise<ApiResponse<AppSettings>> {
    return api.get("/settings/app");
  },

  async updateSettings(data: UpdateSettingsRequest): Promise<ApiResponse<void>> {
    return api.put("/settings", data);
  },
};
