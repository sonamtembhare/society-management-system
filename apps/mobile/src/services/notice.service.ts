import { api } from "./api";
import type { ApiResponse, Notice, CreateNotice, UpdateNotice } from "../types";

export const noticeService = {
  async getNotices(): Promise<ApiResponse<Notice[]>> {
    return api.get("/notices");
  },

  async getNoticeById(id: number): Promise<ApiResponse<Notice>> {
    return api.get(`/notices/${id}`);
  },

  async createNotice(data: CreateNotice): Promise<ApiResponse<Notice>> {
    return api.post("/notices", data);
  },

  async updateNotice(id: number, data: UpdateNotice): Promise<ApiResponse<Notice>> {
    return api.put(`/notices/${id}`, data);
  },

  async deleteNotice(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/notices/${id}`);
  },
};
