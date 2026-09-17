import api from "./api";
import { Notice, CreateNotice, UpdateNotice, ApiResponse } from "@/src/types";

export const getNotices = async (): Promise<Notice[]> => {
  const response = await api.get<ApiResponse<Notice[]>>("/notices");
  return response.data.data || [];
};

export const getNoticeById = async (id: number): Promise<Notice> => {
  const response = await api.get<ApiResponse<Notice>>(`/notices/${id}`);
  return response.data.data!;
};

export const createNotice = async (data: CreateNotice): Promise<Notice> => {
  const response = await api.post<ApiResponse<Notice>>("/notices", data);
  return response.data.data!;
};

export const updateNotice = async (id: number, data: UpdateNotice): Promise<Notice> => {
  const response = await api.put<ApiResponse<Notice>>(`/notices/${id}`, data);
  return response.data.data!;
};

export const deleteNotice = async (id: number): Promise<void> => {
  await api.delete(`/notices/${id}`);
};
