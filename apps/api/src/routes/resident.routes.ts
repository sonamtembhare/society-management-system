import { Router } from "express";
import * as residentController from "../controllers/resident.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createResidentSchema, updateResidentSchema } from "../validators/resident.validator";

const router = Router();

router.use(authenticate);

router.get("/profile", residentController.getOwnProfile);
router.get("/", residentController.getAll);
router.get("/:id", residentController.getById);
router.post("/", authorize("ADMIN"), validate(createResidentSchema), residentController.create);
router.put("/:id", validate(updateResidentSchema), residentController.update);
router.delete("/:id", authorize("ADMIN"), residentController.remove);

export default router;
