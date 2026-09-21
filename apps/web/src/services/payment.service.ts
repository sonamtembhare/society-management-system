import api from "./api";
import { Payment, CreatePayment, RazorpayOrderResponse, RazorpayVerifyRequest, ApiResponse } from "@/src/types";

export const getPayments = async (): Promise<Payment[]> => {
  const response = await api.get<ApiResponse<Payment[]>>("/payments");
  return response.data.data || [];
};

export const getPaymentById = async (id: number): Promise<Payment> => {
  const response = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
  return response.data.data!;
};

export const recordOfflinePayment = async (data: CreatePayment): Promise<Payment> => {
  const response = await api.post<ApiResponse<Payment>>("/payments/offline", data);
  return response.data.data!;
};

export const processOnlinePayment = async (data: CreatePayment): Promise<Payment> => {
  const response = await api.post<ApiResponse<Payment>>("/payments/online", data);
  return response.data.data!;
};

export const getPaymentHistoryByBill = async (billId: number): Promise<Payment[]> => {
  const response = await api.get<ApiResponse<Payment[]>>(`/payments/bill/${billId}`);
  return response.data.data || [];
};

export const createRazorpayOrder = async (billId: number): Promise<RazorpayOrderResponse> => {
  const response = await api.post<ApiResponse<RazorpayOrderResponse>>("/payments/razorpay/create-order", { bill_id: billId });
  return response.data.data!;
};

export const verifyRazorpayPayment = async (data: RazorpayVerifyRequest): Promise<Payment> => {
  const response = await api.post<ApiResponse<Payment>>("/payments/razorpay/verify", data);
  return response.data.data!;
};

export const downloadReceipt = async (paymentId: number): Promise<void> => {
  const response = await api.get(`/payments/${paymentId}/receipt`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `receipt-${paymentId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
