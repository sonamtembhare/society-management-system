import { api } from "./api";
import type { ApiResponse, Resident, ResidentDetail, CreateResident, UpdateResident } from "../types";

export const residentService = {
  async getResidents(): Promise<ApiResponse<Resident[]>> {
    return api.get("/residents");
  },

  async getResidentById(id: number): Promise<ApiResponse<ResidentDetail>> {
    return api.get(`/residents/${id}`);
  },

  async getOwnProfile(): Promise<ApiResponse<ResidentDetail>> {
    return api.get("/residents/profile");
  },

  async createResident(data: CreateResident): Promise<ApiResponse<Resident>> {
    return api.post("/residents", data);
  },

  async updateResident(id: number, data: UpdateResident): Promise<ApiResponse<Resident>> {
    return api.put(`/residents/${id}`, data);
  },

  async deleteResident(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/residents/${id}`);
  },
};
