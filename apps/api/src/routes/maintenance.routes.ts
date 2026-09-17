import { Router } from "express";
import * as maintenanceController from "../controllers/maintenance.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createMaintenanceSchema, updateMaintenanceSchema } from "../validators/maintenance.validator";

const router = Router();

router.use(authenticate);

router.get("/", maintenanceController.getAll);
router.get("/:id", maintenanceController.getById);
router.post("/", authorize("ADMIN"), validate(createMaintenanceSchema), maintenanceController.create);
router.put("/:id", authorize("ADMIN"), validate(updateMaintenanceSchema), maintenanceController.update);
router.delete("/:id", authorize("ADMIN"), maintenanceController.remove);

export default router;
