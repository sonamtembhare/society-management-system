import { Request, Response, NextFunction } from "express";
import * as paymentService from "../services/payment.service";
import * as razorpayService from "../services/razorpay.service";
import * as receiptService from "../services/receipt.service";
import { sendSuccess } from "../utils/response";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payments = await paymentService.getAll(req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Payments retrieved", payments);
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const payment = await paymentService.getById(id);
    sendSuccess(res, 200, "Payment retrieved", payment);
  } catch (error) {
    next(error);
  }
};

export const recordOfflinePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payment = await paymentService.recordOfflinePayment(req.body, req.user!.id);
    sendSuccess(res, 201, "Offline payment recorded", payment);
  } catch (error) {
    next(error);
  }
};

export const processOnlinePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payment = await paymentService.processOnlinePayment(req.body, req.user!.id);
    sendSuccess(res, 201, "Online payment processed", payment);
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const billId = Number(req.params["billId"]);
    const payments = await paymentService.getPaymentHistory(billId, req.user!.id, req.user!.role);
    sendSuccess(res, 200, "Payment history retrieved", payments);
  } catch (error) {
    next(error);
  }
};

export const createRazorpayOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await razorpayService.createOrder(req.body.bill_id, req.user!.id);
    sendSuccess(res, 201, "Razorpay order created", result);
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bill_id } = req.body;
    const payment = await razorpayService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bill_id,
      req.user!.id
    );
    sendSuccess(res, 201, "Payment verified successfully", payment);
  } catch (error) {
    next(error);
  }
};

export const downloadReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params["id"]);
    const pdfBuffer = await receiptService.generateReceipt(id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="receipt-${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
