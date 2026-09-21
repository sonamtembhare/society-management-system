import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createPaymentSchema, razorpayOrderSchema, razorpayVerifySchema } from "../validators/payment.validator";

const router = Router();

router.use(authenticate);

router.get("/", paymentController.getAll);
router.get("/:id", paymentController.getById);
router.post("/offline", authorize("ADMIN"), validate(createPaymentSchema), paymentController.recordOfflinePayment);
router.post("/online", validate(createPaymentSchema), paymentController.processOnlinePayment);
router.get("/bill/:billId", paymentController.getPaymentHistory);
router.post("/razorpay/create-order", validate(razorpayOrderSchema), paymentController.createRazorpayOrder);
router.post("/razorpay/verify", validate(razorpayVerifySchema), paymentController.verifyRazorpayPayment);
router.get("/:id/receipt", paymentController.downloadReceipt);

export default router;
