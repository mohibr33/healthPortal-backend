import express, { Router } from "express";
import * as mealPlanController from "../controllers/mealPlan.controller";
import * as healthProfileController from "../controllers/healthProfile.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createHealthProfileValidation,
  generateMealPlanValidation,
} from "../middlewares/mealPlan.validation";

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Health Profile Routes
router.post(
  "/health-profile",
  createHealthProfileValidation,
  validateRequest,
  healthProfileController.createHealthProfile
);
router.get("/health-profile", healthProfileController.getHealthProfile);
router.delete("/health-profile", healthProfileController.deleteHealthProfile);

// Meal Plan Routes
router.post(
  "/generate",
  generateMealPlanValidation,
  validateRequest,
  mealPlanController.generateMealPlan
);
router.get("/my-plans", mealPlanController.getMyMealPlans);
router.get("/active", mealPlanController.getActiveMealPlan);
router.get("/:id", mealPlanController.getMealPlanById);
router.patch("/:id/status", mealPlanController.updateMealPlanStatus);
router.delete("/:id", mealPlanController.deleteMealPlan);

export default router;
