import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createConditionValidation,
  createLogValidation,
  getLogsValidation,
  reportDateRangeValidation,
} from "../middlewares/chronicDisease.validation";
import * as chronicDiseaseController from "../controllers/chronicDisease.controller";

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// ─── Dashboard ───────────────────────────────────────────────────────────
router.get("/dashboard", chronicDiseaseController.getDashboard);

// ─── Conditions ─────────────────────────────────────────────────────────
router.post("/conditions", createConditionValidation, validateRequest, chronicDiseaseController.createCondition);
router.get("/conditions", chronicDiseaseController.getConditions);
router.delete("/conditions/:conditionId", chronicDiseaseController.deleteCondition);

// ─── Health Logs ────────────────────────────────────────────────────────
router.post("/logs", createLogValidation, validateRequest, chronicDiseaseController.createLog);
router.get("/logs", getLogsValidation, validateRequest, chronicDiseaseController.getLogs);
router.get("/logs/:logId", chronicDiseaseController.getLogById);

// ─── Alerts ─────────────────────────────────────────────────────────────
router.get("/alerts", chronicDiseaseController.getAlerts);
router.patch("/alerts/:alertId/read", chronicDiseaseController.markAlertRead);

// ─── Reports ────────────────────────────────────────────────────────────
router.post("/reports/generate", reportDateRangeValidation, validateRequest, chronicDiseaseController.generateReport);
router.get("/reports", chronicDiseaseController.getReports);
router.get("/reports/download/:id", chronicDiseaseController.downloadReport);
router.delete("/reports/:id", chronicDiseaseController.deleteReport);

// ─── Trends ─────────────────────────────────────────────────────────────
router.get("/trends", chronicDiseaseController.getTrends);

// ─── AI Predictions ─────────────────────────────────────────────────────
router.get("/predictions", chronicDiseaseController.getPredictions);

export default router;
