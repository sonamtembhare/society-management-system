import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import * as complaintController from "../controllers/complaint.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/error.middleware";
import { createComplaintSchema, updateComplaintSchema } from "../validators/complaint.validator";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: "society-complaints",
      allowed_formats: isVideo
        ? ["mp4", "mov", "webm", "avi"]
        : ["jpg", "jpeg", "png", "webp", "gif"],
      resource_type: isVideo ? "video" : "image",
      transformation: isVideo
        ? [{ width: 1280, height: 720, crop: "limit" }]
        : [{ width: 1200, height: 1200, crop: "limit" }],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

const router = Router();

router.use(authenticate);

router.get("/", complaintController.getAll);
router.get("/resident/:residentId", complaintController.getByResidentId);
router.get("/:id", complaintController.getById);
router.post("/", authorize("RESIDENT"), validate(createComplaintSchema), complaintController.create);
router.post("/upload", authorize("RESIDENT", "ADMIN"), upload.single("file"), complaintController.upload);
router.put("/:id", validate(updateComplaintSchema), complaintController.update);
router.delete("/:id", authorize("ADMIN"), complaintController.remove);

export default router;
