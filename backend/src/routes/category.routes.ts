import { Router } from "express";
import { createCategoryHandler, listCategoriesHandler } from "../controllers/category.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

export const categoryRoutes = Router();

categoryRoutes.get("/", listCategoriesHandler);
categoryRoutes.post("/", requireAuth, requireRole(["Admin"]), ...createCategoryHandler);

