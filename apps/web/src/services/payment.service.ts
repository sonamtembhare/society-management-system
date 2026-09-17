import api from "./api";
import { Payment, CreatePayment, UpdatePayment, ApiResponse } from "@/src/types";

export const getPayments = async (): Promise<Payment[]> => {
  const response = await api.get<ApiResponse<Payment[]>>("/payments");
  return response.data.data || [];
};

export const getPaymentById = async (id: number): Promise<Payment> => {
  const response = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
  return response.data.data!;
};

export const createPayment = async (data: CreatePayment): Promise<Payment> => {
  const response = await api.post<ApiResponse<Payment>>("/payments", data);
  return response.data.data!;
};

export const updatePayment = async (id: number, data: UpdatePayment): Promise<Payment> => {
  const response = await api.put<ApiResponse<Payment>>(`/payments/${id}`, data);
  return response.data.data!;
};
