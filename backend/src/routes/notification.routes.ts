import { Router } from "express";
import { listNotificationsHandler, markNotificationReadHandler } from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const notificationRoutes = Router();

notificationRoutes.get("/", requireAuth, listNotificationsHandler);
notificationRoutes.post("/:id/read", requireAuth, markNotificationReadHandler);

