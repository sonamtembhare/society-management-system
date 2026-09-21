import { Router } from "express";
import * as settingsController from "../controllers/settings.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", authorize("ADMIN"), settingsController.getAllSettings);
router.get("/app", settingsController.getAppSettings);
router.put("/", authorize("ADMIN"), settingsController.updateSettings);

export default router;
