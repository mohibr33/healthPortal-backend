import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createMoodEntryValidation,
  createStressAssessmentValidation,
  createScreeningValidation,
  createJournalEntryValidation,
  journalEntryIdValidation,
  createMeditationSessionValidation,
  createResourceValidation,
  resourceSlugValidation,
  resourceIdValidation,
  listResourcesValidation,
  moodHistoryValidation,
} from "../middlewares/stressWellness.validation";
import * as stressWellnessController from "../controllers/stressWellness.controller";

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// ─── Mood Tracker ───────────────────────────────────────────────────────
router.post("/mood", createMoodEntryValidation, validateRequest, stressWellnessController.createMoodEntry);
router.get("/mood", moodHistoryValidation, validateRequest, stressWellnessController.getMoodHistory);
router.get("/mood/trend", stressWellnessController.getMoodTrend);

// ─── Stress Assessment ──────────────────────────────────────────────────
router.post("/stress", createStressAssessmentValidation, validateRequest, stressWellnessController.createStressAssessment);
router.get("/stress", moodHistoryValidation, validateRequest, stressWellnessController.getStressHistory);
router.get("/stress/trend", stressWellnessController.getStressTrend);

// ─── Anxiety/Depression Screening ───────────────────────────────────────
router.post("/screening", createScreeningValidation, validateRequest, stressWellnessController.createScreening);
router.get("/screening", stressWellnessController.getScreeningHistory);

// ─── Anonymous Journaling ───────────────────────────────────────────────
router.post("/journal", createJournalEntryValidation, validateRequest, stressWellnessController.createJournalEntry);
router.get("/journal", stressWellnessController.getJournalEntries);
router.get("/journal/:entryId", journalEntryIdValidation, validateRequest, stressWellnessController.getJournalEntryById);
router.post("/journal/:entryId/analyze", journalEntryIdValidation, validateRequest, stressWellnessController.analyzeJournalEntry);
router.delete("/journal/:entryId", journalEntryIdValidation, validateRequest, stressWellnessController.deleteJournalEntry);

// ─── Meditation & Exercises ─────────────────────────────────────────────
router.post("/meditation", createMeditationSessionValidation, validateRequest, stressWellnessController.createMeditationSession);
router.get("/meditation", stressWellnessController.getMeditationHistory);
router.get("/meditation/stats", stressWellnessController.getMeditationStats);

// ─── Wellness Resources ─────────────────────────────────────────────────
router.post("/resources", createResourceValidation, validateRequest, stressWellnessController.createResource);
router.get("/resources", listResourcesValidation, validateRequest, stressWellnessController.getResources);
router.get("/resources/:slug", resourceSlugValidation, validateRequest, stressWellnessController.getResourceBySlug);
router.delete("/resources/:resourceId", resourceIdValidation, validateRequest, stressWellnessController.deleteResource);

// ─── Dashboard ──────────────────────────────────────────────────────────
router.get("/summary", stressWellnessController.getWellnessSummary);

export default router;
