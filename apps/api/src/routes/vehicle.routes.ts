import { Router } from "express";
import * as vehicleController from "../controllers/vehicle.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/error.middleware";
import { createVehicleSchema, updateVehicleSchema } from "../validators/vehicle.validator";

const router = Router();

router.use(authenticate);

router.get("/", vehicleController.getAll);
router.get("/:id", vehicleController.getById);
router.post("/", validate(createVehicleSchema), vehicleController.create);
router.put("/:id", validate(updateVehicleSchema), vehicleController.update);
router.delete("/:id", vehicleController.remove);

export default router;
