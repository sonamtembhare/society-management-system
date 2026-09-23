import { api } from "./api";
import type { ApiResponse, Payment, CreatePayment, UpdatePayment, RazorpayOrderResponse, RazorpayVerifyRequest } from "../types";

export const paymentService = {
  async getPayments(): Promise<ApiResponse<Payment[]>> {
    return api.get("/payments");
  },

  async getPaymentById(id: number): Promise<ApiResponse<Payment>> {
    return api.get(`/payments/${id}`);
  },

  async recordOfflinePayment(data: CreatePayment): Promise<ApiResponse<Payment>> {
    return api.post("/payments/offline", data);
  },

  async processOnlinePayment(data: CreatePayment): Promise<ApiResponse<Payment>> {
    return api.post("/payments/online", data);
  },

  async getPaymentHistoryByBill(billId: number): Promise<ApiResponse<Payment[]>> {
    return api.get(`/payments/bill/${billId}`);
  },

  async createRazorpayOrder(billId: number): Promise<ApiResponse<RazorpayOrderResponse>> {
    return api.post(`/payments/razorpay/create-order`, { bill_id: billId });
  },

  async verifyRazorpayPayment(data: RazorpayVerifyRequest): Promise<ApiResponse<Payment>> {
    return api.post("/payments/razorpay/verify", data);
  },

  async downloadReceipt(paymentId: number): Promise<ArrayBuffer> {
    return api.getBinary(`/payments/${paymentId}/receipt`);
  },
};
