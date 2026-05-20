import express, { Router } from "express";
import * as medicineController from "../controllers/medicine.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router: Router = express.Router();

// Authenticated routes - with risk evaluation based on health profile
// IMPORTANT: These must come BEFORE /:id to prevent "with-risk" being matched as an ID
router.get("/with-risk/list", authenticateToken, medicineController.getAllMedicinesWithRisk);
router.get("/with-risk/search", authenticateToken, medicineController.searchMedicinesWithRisk);
router.get("/with-risk/slug/:slug", authenticateToken, medicineController.getMedicineBySlugWithRisk);

// Public routes - no authentication required
router.get("/", medicineController.getAllMedicines);
router.get("/brands", medicineController.getAllBrands);
router.get("/search", medicineController.searchMedicines);
router.get("/category/:category", medicineController.getMedicinesByCategory);
router.get("/brand/:brand", medicineController.getMedicinesByBrand);
router.get("/slug/:slug", medicineController.getMedicineBySlug);
router.get("/:id", medicineController.getMedicineById);

export default router;
