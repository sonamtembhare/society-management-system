import api from "./api";
import { Complaint, CreateComplaint, UpdateComplaint, ApiResponse } from "@/src/types";

export const getComplaints = async (): Promise<Complaint[]> => {
  const response = await api.get<ApiResponse<Complaint[]>>("/complaints");
  return response.data.data || [];
};

export const getComplaintById = async (id: number): Promise<Complaint> => {
  const response = await api.get<ApiResponse<Complaint>>(`/complaints/${id}`);
  return response.data.data!;
};

export const getComplaintsByResidentId = async (residentId: number): Promise<Complaint[]> => {
  const response = await api.get<ApiResponse<Complaint[]>>(`/complaints/resident/${residentId}`);
  return response.data.data || [];
};

export const createComplaint = async (data: CreateComplaint): Promise<Complaint> => {
  const response = await api.post<ApiResponse<Complaint>>("/complaints", data);
  return response.data.data!;
};

export const uploadComplaintFile = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<ApiResponse<{ url: string }>>("/complaints/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data!;
};

export const uploadComplaintImage = uploadComplaintFile;
export const uploadComplaintVideo = uploadComplaintFile;

export const updateComplaint = async (id: number, data: UpdateComplaint): Promise<Complaint> => {
  const response = await api.put<ApiResponse<Complaint>>(`/complaints/${id}`, data);
  return response.data.data!;
};

export const deleteComplaint = async (id: number): Promise<void> => {
  await api.delete(`/complaints/${id}`);
};
