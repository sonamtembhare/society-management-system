import api from "./api";
import { Visitor, CreateVisitor, UpdateVisitor, ApiResponse } from "@/src/types";

export const getVisitors = async (): Promise<Visitor[]> => {
  const response = await api.get<ApiResponse<Visitor[]>>("/visitors");
  return response.data.data || [];
};

export const getTodayVisitors = async (): Promise<Visitor[]> => {
  const response = await api.get<ApiResponse<Visitor[]>>("/visitors/today");
  return response.data.data || [];
};

export const getVisitorStats = async (): Promise<Record<string, number>> => {
  const response = await api.get<ApiResponse<Record<string, number>>>("/visitors/stats");
  return response.data.data || {};
};

export const getVisitorById = async (id: number): Promise<Visitor> => {
  const response = await api.get<ApiResponse<Visitor>>(`/visitors/${id}`);
  return response.data.data!;
};

export const createVisitor = async (data: CreateVisitor): Promise<Visitor> => {
  const response = await api.post<ApiResponse<Visitor>>("/visitors", data);
  return response.data.data!;
};

export const updateVisitor = async (id: number, data: UpdateVisitor): Promise<Visitor> => {
  const response = await api.put<ApiResponse<Visitor>>(`/visitors/${id}`, data);
  return response.data.data!;
};

export const cancelVisitor = async (id: number): Promise<Visitor> => {
  const response = await api.patch<ApiResponse<Visitor>>(`/visitors/${id}/cancel`);
  return response.data.data!;
};

export const approveVisitor = async (id: number): Promise<Visitor> => {
  const response = await api.put<ApiResponse<Visitor>>(`/visitors/${id}/approve`);
  return response.data.data!;
};

export const rejectVisitor = async (id: number): Promise<Visitor> => {
  const response = await api.put<ApiResponse<Visitor>>(`/visitors/${id}/reject`);
  return response.data.data!;
};

export const checkInVisitor = async (id: number): Promise<Visitor> => {
  const response = await api.put<ApiResponse<Visitor>>(`/visitors/${id}/check-in`);
  return response.data.data!;
};

export const checkOutVisitor = async (id: number): Promise<Visitor> => {
  const response = await api.put<ApiResponse<Visitor>>(`/visitors/${id}/check-out`);
  return response.data.data!;
};
