import { Router } from "express";
import * as visitorController from "../controllers/visitor.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createVisitorSchema, updateVisitorSchema } from "../validators/visitor.validator";

const router = Router();

router.use(authenticate);

router.get("/today", authorize("SECURITY", "ADMIN"), visitorController.getTodayVisitors);
router.get("/stats", authorize("ADMIN"), visitorController.getStats);
router.get("/residents-light", authorize("SECURITY"), visitorController.getResidentsLight);
router.get("/", visitorController.getAll);
router.get("/:id", visitorController.getById);
router.post("/", authorize("SECURITY"), validate(createVisitorSchema), visitorController.create);
router.patch("/:id/cancel", authorize("RESIDENT"), visitorController.cancel);
router.put("/:id", validate(updateVisitorSchema), visitorController.update);
router.put("/:id/approve", authorize("ADMIN"), visitorController.approve);
router.put("/:id/reject", authorize("ADMIN"), visitorController.reject);
router.put("/:id/check-in", authorize("SECURITY"), visitorController.checkIn);
router.put("/:id/check-out", authorize("SECURITY"), visitorController.checkOut);

export default router;
