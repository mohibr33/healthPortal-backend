import { Request, Response, NextFunction } from "express";
import { IAuthRequest } from "../types/user.types";
import stressWellnessService from "../services/stressWellness.service";

// ─── Mood Tracker ─────────────────────────────────────────────────────────

export const createMoodEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const entry = await stressWellnessService.createMoodEntry(userId, req.body);
    res.status(201).json({ success: true, message: "Mood logged successfully", data: entry });
  } catch (error) {
    next(error);
  }
};

export const getMoodHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const days = parseInt(req.query.days as string) || 30;
    const entries = await stressWellnessService.getMoodHistory(userId, days);
    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

export const getMoodTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const trend = await stressWellnessService.getMoodTrend(userId);
    res.status(200).json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
};

// ─── Stress Assessment ────────────────────────────────────────────────────

export const createStressAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const assessment = await stressWellnessService.createStressAssessment(userId, req.body);
    res.status(201).json({ success: true, message: "Stress assessment completed", data: assessment });
  } catch (error) {
    next(error);
  }
};

export const getStressHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const days = parseInt(req.query.days as string) || 30;
    const assessments = await stressWellnessService.getStressHistory(userId, days);
    res.status(200).json({ success: true, data: assessments });
  } catch (error) {
    next(error);
  }
};

export const getStressTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const trend = await stressWellnessService.getStressTrend(userId);
    res.status(200).json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
};

// ─── Anxiety/Depression Screening ─────────────────────────────────────────

export const createScreening = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const result = await stressWellnessService.createScreening(userId, req.body);
    res.status(201).json({ success: true, message: "Screening completed", data: result });
  } catch (error) {
    next(error);
  }
};

export const getScreeningHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const history = await stressWellnessService.getScreeningHistory(userId);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// ─── Anonymous Journaling ─────────────────────────────────────────────────

export const createJournalEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId;
    const entry = await stressWellnessService.createJournalEntry(userId, req.body);
    res.status(201).json({ success: true, message: "Journal entry created", data: entry });
  } catch (error) {
    next(error);
  }
};

export const getJournalEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const entries = await stressWellnessService.getJournalEntries(userId);
    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

export const getJournalEntryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { entryId } = req.params;
    const entry = await stressWellnessService.getJournalEntryById(entryId, userId);
    if (!entry) {
      res.status(404).json({ success: false, message: "Journal entry not found" });
      return;
    }
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

export const analyzeJournalEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { entryId } = req.params;
    const analysis = await stressWellnessService.analyzeJournalEntry(entryId, userId);
    if (!analysis) {
      res.status(404).json({ success: false, message: "Journal entry not found" });
      return;
    }
    res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
};

export const deleteJournalEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { entryId } = req.params;
    await stressWellnessService.deleteJournalEntry(entryId, userId);
    res.status(200).json({ success: true, message: "Journal entry deleted" });
  } catch (error) {
    next(error);
  }
};

// ─── Meditation & Exercises ───────────────────────────────────────────────

export const createMeditationSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const session = await stressWellnessService.createMeditationSession(userId, req.body);
    res.status(201).json({ success: true, message: "Meditation session logged", data: session });
  } catch (error) {
    next(error);
  }
};

export const getMeditationHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const sessions = await stressWellnessService.getMeditationHistory(userId);
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

export const getMeditationStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const stats = await stressWellnessService.getMeditationStats(userId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// ─── Wellness Resources ───────────────────────────────────────────────────

export const createResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resource = await stressWellnessService.createResource(req.body);
    res.status(201).json({ success: true, message: "Resource created", data: resource });
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(409).json({ success: false, message: "A resource with this slug already exists" });
      return;
    }
    next(error);
  }
};

export const getResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, page, limit, search } = req.query;
    const result = await stressWellnessService.getResources({
      category: category as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getResourceBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const resource = await stressWellnessService.getResourceBySlug(slug);
    if (!resource) {
      res.status(404).json({ success: false, message: "Resource not found" });
      return;
    }
    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};

export const deleteResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resourceId } = req.params;
    await stressWellnessService.deleteResource(resourceId);
    res.status(200).json({ success: true, message: "Resource deleted" });
  } catch (error) {
    next(error);
  }
};

// ─── Dashboard / Summary ─────────────────────────────────────────────────

export const getWellnessSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const summary = await stressWellnessService.getWellnessSummary(userId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};
