import { Router } from "express";
import * as maintenanceController from "../controllers/maintenance.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
} from "../validators/maintenance.validator";

const router = Router();

router.use(authenticate);

router.get("/stats", authorize("ADMIN"), maintenanceController.getStats);
router.post("/generate-last-month", authorize("ADMIN"), maintenanceController.generateLastMonth);
router.post("/send-reminders", authorize("ADMIN"), maintenanceController.sendReminders);
router.get("/", maintenanceController.getAll);
router.get("/:id", maintenanceController.getById);
router.post("/", authorize("ADMIN"), validate(createMaintenanceSchema), maintenanceController.create);
router.put("/:id", authorize("ADMIN"), validate(updateMaintenanceSchema), maintenanceController.update);
router.delete("/:id", authorize("ADMIN"), maintenanceController.cancel);
router.get("/:id/payments", maintenanceController.getPaymentHistory);

export default router;
