import express, { Router } from "express";
import * as medicineController from "../controllers/medicine.controller";

const router: Router = express.Router();

// Public routes - no authentication required
router.get("/", medicineController.getAllMedicines);
router.get("/brands", medicineController.getAllBrands);
router.get("/search", medicineController.searchMedicines);
router.get("/category/:category", medicineController.getMedicinesByCategory);
router.get("/brand/:brand", medicineController.getMedicinesByBrand);
router.get("/slug/:slug", medicineController.getMedicineBySlug);
router.get("/:id", medicineController.getMedicineById);

export default router;
