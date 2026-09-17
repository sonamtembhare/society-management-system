import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createEventSchema, updateEventSchema } from "../validators/event.validator";

const router = Router();

router.use(authenticate);

router.get("/", eventController.getAll);
router.get("/:id", eventController.getById);
router.post("/", authorize("ADMIN"), validate(createEventSchema), eventController.create);
router.put("/:id", authorize("ADMIN"), validate(updateEventSchema), eventController.update);
router.delete("/:id", authorize("ADMIN"), eventController.remove);

export default router;
