import { api } from "./api";
import type { ApiResponse, Complaint, CreateComplaint, UpdateComplaint } from "../types";

export const complaintService = {
  async getComplaints(): Promise<ApiResponse<Complaint[]>> {
    return api.get("/complaints");
  },

  async getComplaintById(id: number): Promise<ApiResponse<Complaint>> {
    return api.get(`/complaints/${id}`);
  },

  async getComplaintsByResidentId(residentId: number): Promise<ApiResponse<Complaint[]>> {
    return api.get(`/complaints/resident/${residentId}`);
  },

  async createComplaint(data: CreateComplaint): Promise<ApiResponse<Complaint>> {
    return api.post("/complaints", data);
  },

  async updateComplaint(id: number, data: UpdateComplaint): Promise<ApiResponse<Complaint>> {
    return api.put(`/complaints/${id}`, data);
  },

  async deleteComplaint(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/complaints/${id}`);
  },
};
