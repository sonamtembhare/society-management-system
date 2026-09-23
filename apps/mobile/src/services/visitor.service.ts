import { api } from "./api";
import type { ApiResponse, Visitor, CreateVisitor, UpdateVisitor, VisitorStats } from "../types";

export const visitorService = {
  async getVisitors(): Promise<ApiResponse<Visitor[]>> {
    return api.get("/visitors");
  },

  async getTodayVisitors(): Promise<ApiResponse<Visitor[]>> {
    return api.get("/visitors/today");
  },

  async getVisitorStats(): Promise<ApiResponse<VisitorStats>> {
    return api.get("/visitors/stats");
  },

  async getVisitorById(id: number): Promise<ApiResponse<Visitor>> {
    return api.get(`/visitors/${id}`);
  },

  async createVisitor(data: CreateVisitor): Promise<ApiResponse<Visitor>> {
    return api.post("/visitors", data);
  },

  async updateVisitor(id: number, data: UpdateVisitor): Promise<ApiResponse<Visitor>> {
    return api.put(`/visitors/${id}`, data);
  },

  async cancelVisitor(id: number): Promise<ApiResponse<Visitor>> {
    return api.patch(`/visitors/${id}/cancel`);
  },

  async approveVisitor(id: number): Promise<ApiResponse<Visitor>> {
    return api.put(`/visitors/${id}/approve`);
  },

  async rejectVisitor(id: number): Promise<ApiResponse<Visitor>> {
    return api.put(`/visitors/${id}/reject`);
  },

  async checkInVisitor(id: number): Promise<ApiResponse<Visitor>> {
    return api.put(`/visitors/${id}/check-in`);
  },

  async checkOutVisitor(id: number): Promise<ApiResponse<Visitor>> {
    return api.put(`/visitors/${id}/check-out`);
  },

  async getResidentsLight(): Promise<ApiResponse<{ id: number; name: string; flat_id: number; flat_number: string }[]>> {
    return api.get("/visitors/residents-light");
  },
};
