import { api } from "./api";
import type { ApiResponse, Vehicle, CreateVehicle, UpdateVehicle } from "../types";

export const vehicleService = {
  async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return api.get("/vehicles");
  },

  async getVehicleById(id: number): Promise<ApiResponse<Vehicle>> {
    return api.get(`/vehicles/${id}`);
  },

  async createVehicle(data: CreateVehicle): Promise<ApiResponse<Vehicle>> {
    return api.post("/vehicles", data);
  },

  async updateVehicle(id: number, data: UpdateVehicle): Promise<ApiResponse<Vehicle>> {
    return api.put(`/vehicles/${id}`, data);
  },

  async deleteVehicle(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/vehicles/${id}`);
  },

  async searchVehicles(query: string): Promise<ApiResponse<Vehicle[]>> {
    return api.get(`/vehicles/search?q=${encodeURIComponent(query)}`);
  },

  async deactivateVehicle(id: number): Promise<ApiResponse<Vehicle>> {
    return api.patch(`/vehicles/${id}/deactivate`);
  },

  async recordEntry(id: number): Promise<ApiResponse<Vehicle>> {
    return api.patch(`/vehicles/${id}/entry`);
  },

  async recordExit(id: number): Promise<ApiResponse<Vehicle>> {
    return api.patch(`/vehicles/${id}/exit`);
  },
};
