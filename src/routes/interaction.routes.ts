import express, { Router } from "express";
import * as interactionController from "../controllers/interaction.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/interactions/check - Full interaction check with AI analysis
router.post("/check", interactionController.checkInteractions);

// POST /api/interactions/quick-check - Quick check without AI (faster)
router.post("/quick-check", interactionController.quickCheck);

// GET /api/interactions/search?q=medicine - Search medicines for autocomplete
router.get("/search", interactionController.searchMedicines);

// GET /api/interactions/health-profile - Get user's health profile summary
router.get("/health-profile", interactionController.getHealthProfileSummary);

// GET /api/interactions/history - Get user's scan history
router.get("/history", interactionController.getScanHistory);

// GET /api/interactions/latest - Get user's latest scan
router.get("/latest", interactionController.getLatestScan);

// GET /api/interactions/:id - Get a specific scan by ID
router.get("/:id", interactionController.getScanById);

// DELETE /api/interactions/:id - Delete a scan
router.delete("/:id", interactionController.deleteScan);

export default router;
