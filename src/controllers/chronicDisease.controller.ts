import { Request, Response, NextFunction } from "express";
import { IAuthRequest } from "../types/chronicDisease.types";
import chronicDiseaseService from "../services/chronicDisease.service";

// ─── Dashboard ─────────────────────────────────────────────────────────────

export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const dashboard = await chronicDiseaseService.getDashboard(userId);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
};

// ─── Conditions ────────────────────────────────────────────────────────────

export const createCondition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const condition = await chronicDiseaseService.createCondition(userId, req.body);
    res.status(201).json({ success: true, message: "Condition added successfully", data: condition });
  } catch (error) {
    next(error);
  }
};

export const getConditions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const conditions = await chronicDiseaseService.getConditions(userId);
    res.status(200).json({ success: true, data: conditions });
  } catch (error) {
    next(error);
  }
};

export const deleteCondition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { conditionId } = req.params;
    await chronicDiseaseService.deleteCondition(conditionId, userId);
    res.status(200).json({ success: true, message: "Condition deleted" });
  } catch (error) {
    next(error);
  }
};

// ─── Health Logs ──────────────────────────────────────────────────────────

export const createLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const log = await chronicDiseaseService.createLog(userId, req.body);
    res.status(201).json({ success: true, message: "Health log created", data: log });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { from, to, conditionId, page, limit } = req.query;
    const result = await chronicDiseaseService.getLogs(userId, {
      from: from as string,
      to: to as string,
      conditionId: conditionId as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getLogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { logId } = req.params;
    const log = await chronicDiseaseService.getLogById(logId, userId);
    if (!log) {
      res.status(404).json({ success: false, message: "Health log not found" });
      return;
    }
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// ─── Alerts ───────────────────────────────────────────────────────────────

export const getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const alerts = await chronicDiseaseService.getAlerts(userId);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};

export const markAlertRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { alertId } = req.params;
    const alert = await chronicDiseaseService.markAlertRead(alertId, userId);
    if (!alert) {
      res.status(404).json({ success: false, message: "Alert not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Alert marked as read", data: alert });
  } catch (error) {
    next(error);
  }
};

// ─── Reports ─────────────────────────────────────────────────────────────

export const generateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { from, to } = req.body;
    const report = await chronicDiseaseService.generateReport(userId, from, to);
    res.status(201).json({ success: true, message: "Report generated", data: report });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const reports = await chronicDiseaseService.getReports(userId);
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const reportId = req.params.id;
    await chronicDiseaseService.deleteReport(reportId, userId);
    res.status(200).json({ success: true, message: "Report deleted" });
  } catch (error) {
    next(error);
  }
};

export const downloadReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const reportId = req.params.id;
    const report = await chronicDiseaseService.getReportById(reportId, userId);
    if (!report) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }
    const path = require("path");
    const fs = require("fs");
    const reportsDir = path.join(__dirname, "..", "..", "reports");
    const filePath = path.join(reportsDir, `${reportId}.pdf`);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: "Report PDF not found" });
      return;
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=health-report-${reportId}.pdf`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// ─── Trends ───────────────────────────────────────────────────────────────

// ─── AI Predictions ────────────────────────────────────────────────────────

export const getPredictions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const predictions = await chronicDiseaseService.getPredictions(userId);
    res.status(200).json({ success: true, data: predictions });
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const conditionId = req.query.conditionId as string | undefined;
    const period = (req.query.period as "day" | "week" | "month") || "week";
    const trends = await chronicDiseaseService.getTrends(userId, conditionId, period);
    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
};
