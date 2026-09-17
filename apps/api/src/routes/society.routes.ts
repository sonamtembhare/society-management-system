import { Router } from "express";
import * as societyController from "../controllers/society.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createSocietySchema, updateSocietySchema } from "../validators/society.validator";

const router = Router();

router.use(authenticate);

router.get("/", societyController.getAll);
router.get("/:id", societyController.getById);
router.post("/", authorize("ADMIN"), validate(createSocietySchema), societyController.create);
router.put("/:id", authorize("ADMIN"), validate(updateSocietySchema), societyController.update);
router.delete("/:id", authorize("ADMIN"), societyController.remove);

export default router;
