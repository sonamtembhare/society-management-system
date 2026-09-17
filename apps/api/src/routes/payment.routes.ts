import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/error.middleware";
import { createPaymentSchema, updatePaymentSchema } from "../validators/payment.validator";

const router = Router();

router.use(authenticate);

router.get("/", paymentController.getAll);
router.get("/:id", paymentController.getById);
router.post("/", validate(createPaymentSchema), paymentController.create);
router.put("/:id", validate(updatePaymentSchema), paymentController.update);

export default router;
