import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createEventSchema, updateEventSchema, rejectEventSchema } from "../validators/event.validator";

const router = Router();

router.use(authenticate);

router.get("/resident", authorize("RESIDENT"), eventController.getByResident);
router.get("/", eventController.getAll);
router.get("/:id", eventController.getById);
router.post("/", authorize("RESIDENT", "ADMIN"), validate(createEventSchema), eventController.create);
router.put("/:id", authorize("ADMIN"), validate(updateEventSchema), eventController.update);
router.post("/:id/approve", authorize("ADMIN"), eventController.approve);
router.post("/:id/reject", authorize("ADMIN"), validate(rejectEventSchema), eventController.reject);
router.post("/:id/cancel", authorize("RESIDENT"), eventController.cancel);
router.delete("/:id", authorize("ADMIN"), eventController.remove);

export default router;
