import { Router } from "express";
import * as vehicleController from "../controllers/vehicle.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createVehicleSchema, updateVehicleSchema } from "../validators/vehicle.validator";

const router = Router();

router.use(authenticate);

router.get("/search", vehicleController.search);
router.get("/", vehicleController.getAll);
router.get("/:id", vehicleController.getById);
router.post("/", validate(createVehicleSchema), vehicleController.create);
router.put("/:id", validate(updateVehicleSchema), vehicleController.update);
router.patch("/:id/entry", authorize("SECURITY"), vehicleController.recordEntry);
router.patch("/:id/exit", authorize("SECURITY"), vehicleController.recordExit);
router.patch("/:id/deactivate", vehicleController.deactivate);
router.delete("/:id", vehicleController.remove);

export default router;
