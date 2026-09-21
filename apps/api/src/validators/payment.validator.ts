import { z } from "zod";

export const createPaymentSchema = z.object({
  bill_id: z.number().int().positive("Valid bill ID is required"),
  payment_method: z.enum(["ONLINE", "OFFLINE"], { message: "Payment method must be ONLINE or OFFLINE" }),
  paid_amount: z.number().positive("Paid amount must be greater than 0"),
  transaction_id: z.string().max(100).optional(),
  receipt_number: z.string().max(100).optional(),
  note: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
  note: z.string().optional(),
});

export const razorpayOrderSchema = z.object({
  bill_id: z.number().int().positive("Valid bill ID is required"),
});

export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  bill_id: z.number().int().positive("Valid bill ID is required"),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type RazorpayOrderInput = z.infer<typeof razorpayOrderSchema>;
export type RazorpayVerifyInput = z.infer<typeof razorpayVerifySchema>;
