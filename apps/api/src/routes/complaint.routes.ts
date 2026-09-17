import { Router } from "express";
import * as complaintController from "../controllers/complaint.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createComplaintSchema, updateComplaintSchema } from "../validators/complaint.validator";

const router = Router();

router.use(authenticate);

router.get("/", complaintController.getAll);
router.get("/:id", complaintController.getById);
router.post("/", authorize("RESIDENT"), validate(createComplaintSchema), complaintController.create);
router.put("/:id", validate(updateComplaintSchema), complaintController.update);
router.delete("/:id", authorize("ADMIN"), complaintController.remove);

export default router;
