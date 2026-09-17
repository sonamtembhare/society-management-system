import { Router } from "express";
import * as noticeController from "../controllers/notice.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createNoticeSchema, updateNoticeSchema } from "../validators/notice.validator";

const router = Router();

router.use(authenticate);

router.get("/", noticeController.getAll);
router.get("/:id", noticeController.getById);
router.post("/", authorize("ADMIN"), validate(createNoticeSchema), noticeController.create);
router.put("/:id", authorize("ADMIN"), validate(updateNoticeSchema), noticeController.update);
router.delete("/:id", authorize("ADMIN"), noticeController.remove);

export default router;
