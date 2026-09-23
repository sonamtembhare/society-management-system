import { api } from "./api";
import type { ApiResponse, Flat, CreateFlat, UpdateFlat } from "../types";

export const flatService = {
  async getFlats(): Promise<ApiResponse<Flat[]>> {
    return api.get("/flats");
  },

  async getFlatById(id: number): Promise<ApiResponse<Flat>> {
    return api.get(`/flats/${id}`);
  },

  async getFlatsBySociety(societyId: number): Promise<ApiResponse<Flat[]>> {
    return api.get(`/flats/society/${societyId}`);
  },

  async createFlat(data: CreateFlat): Promise<ApiResponse<Flat>> {
    return api.post("/flats", data);
  },

  async updateFlat(id: number, data: UpdateFlat): Promise<ApiResponse<Flat>> {
    return api.put(`/flats/${id}`, data);
  },

  async deleteFlat(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/flats/${id}`);
  },
};
