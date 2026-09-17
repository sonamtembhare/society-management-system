import { Router } from "express";
import * as flatController from "../controllers/flat.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createFlatSchema, updateFlatSchema } from "../validators/flat.validator";

const router = Router();

router.use(authenticate);

router.get("/", flatController.getAll);
router.get("/:id", flatController.getById);
router.get("/society/:societyId", flatController.getBySocietyId);
router.post("/", authorize("ADMIN"), validate(createFlatSchema), flatController.create);
router.put("/:id", authorize("ADMIN"), validate(updateFlatSchema), flatController.update);
router.delete("/:id", authorize("ADMIN"), flatController.remove);

export default router;
