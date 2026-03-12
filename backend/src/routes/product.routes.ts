import { Router } from "express";
import { featuredProductsHandler, getProductHandler, latestProductsHandler, listProductsHandler } from "../controllers/product.controller.js";

export const productRoutes = Router();

productRoutes.get("/featured", ...featuredProductsHandler);
productRoutes.get("/latest", ...latestProductsHandler);
productRoutes.get("/", ...listProductsHandler);
productRoutes.get("/:slug", getProductHandler);
