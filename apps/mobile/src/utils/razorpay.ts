import RazorpayCheckout from "react-native-razorpay";
import { paymentService } from "../services";
import type { Maintenance } from "../types";
import { getMonthName } from "./formatters";

type RazorpayPaymentData = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function payMaintenanceBill(bill: Maintenance): Promise<void> {
  const res = await paymentService.createRazorpayOrder(bill.id);
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to create payment order");
  }
  const order = res.data;

  const period = `${getMonthName(bill.billing_month)} ${bill.billing_year}`;
  const data = (await RazorpayCheckout.open({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: "Society Maintenance",
    description: `Payment for Flat ${bill.flat_number || ""} — ${period}`,
    order_id: order.orderId,
    prefill: {
      name: bill.resident_name || "",
      email: bill.resident_email || "",
    },
    theme: { color: "#2563EB" },
  })) as RazorpayPaymentData;

  await paymentService.verifyRazorpayPayment({
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    razorpay_signature: data.razorpay_signature,
    bill_id: bill.id,
  });
}