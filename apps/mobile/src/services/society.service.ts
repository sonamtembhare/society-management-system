import { api } from "./api";
import type { ApiResponse, Society, CreateSociety, UpdateSociety } from "../types";

export const societyService = {
  async getSocieties(): Promise<ApiResponse<Society[]>> {
    return api.get("/societies");
  },

  async getSocietyById(id: number): Promise<ApiResponse<Society>> {
    return api.get(`/societies/${id}`);
  },

  async createSociety(data: CreateSociety): Promise<ApiResponse<Society>> {
    return api.post("/societies", data);
  },

  async updateSociety(id: number, data: UpdateSociety): Promise<ApiResponse<Society>> {
    return api.put(`/societies/${id}`, data);
  },

  async deleteSociety(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/societies/${id}`);
  },
};
