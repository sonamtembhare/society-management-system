import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db";
import { errorHandler } from "./middleware/error.middleware";
import { notFound } from "./middleware/notFound.middleware";
import { sendSuccess } from "./utils/response";

import authRoutes from "./routes/auth.routes";
import societyRoutes from "./routes/society.routes";
import flatRoutes from "./routes/flat.routes";
import residentRoutes from "./routes/resident.routes";
import maintenanceRoutes from "./routes/maintenance.routes";
import paymentRoutes from "./routes/payment.routes";
import complaintRoutes from "./routes/complaint.routes";
import noticeRoutes from "./routes/notice.routes";
import visitorRoutes from "./routes/visitor.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import eventRoutes from "./routes/event.routes";
import settingsRoutes from "./routes/settings.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  sendSuccess(res, 200, "Society Management API is running");
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT NOW()");
    sendSuccess(res, 200, "Society Management API is running", {
      database: "connected",
    });
  } catch (error) {
    sendSuccess(res, 500, "Society Management API is running", {
      database: "disconnected",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/societies", societyRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/settings", settingsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
