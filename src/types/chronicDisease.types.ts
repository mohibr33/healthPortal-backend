import { Request } from "express";

export interface IAuthRequest extends Request {
  userId?: string;
}

export type ChronicCondition = "Diabetes" | "Hypertension" | "Asthma" | "Obesity" | "Heart Disease" | "Arthritis";

export interface ICreateConditionDTO {
  condition: ChronicCondition;
  diagnosedAt?: string;
  severity?: string;
  notes?: string;
}

export interface ICreateHealthLogDTO {
  conditionId?: string;
  logDate?: string;
  symptoms?: string[];
  painLevel?: number;
  painLocation?: string[];
  mobilityIssues?: string[];
  fatigueLevel?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugar?: number;
  heartRate?: number;
  oxygenLevel?: number;
  weight?: number;
  temperature?: number;
  medicationTaken?: Array<{ name: string; dose?: string; time?: string }>;
  notes?: string;
}

export interface IHealthLogResponse {
  id: string;
  logDate: string;
  symptoms: string[];
  painLevel: number | null;
  painLocation: string[] | null;
  mobilityIssues: string[] | null;
  fatigueLevel: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  bloodSugar: number | null;
  heartRate: number | null;
  oxygenLevel: number | null;
  weight: number | null;
  temperature: number | null;
  medicationTaken: any;
  notes: string | null;
  condition?: { id: string; condition: string } | null;
  alerts?: any[];
  createdAt: string;
}

export interface IHealthAlertResponse {
  id: string;
  type: string;
  severity: string;
  metric: string;
  value: string;
  threshold: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface IHealthReportResponse {
  id: string;
  title: string;
  dateRange: { from: string; to: string };
  data: any;
  pdfUrl: string | null;
  createdAt: string;
}

export interface IHealthPrediction {
  type: "trend_warning" | "abnormal_pattern" | "improvement";
  severity: "info" | "warning" | "critical";
  metric: string;
  message: string;
  trend: "increasing" | "decreasing" | "stable";
  percentageChange: number;
  consecutiveDays: number;
  currentValue: string;
  recommendation: string;
}

export interface IChronicDashboard {
  conditions: Array<{
    id: string;
    condition: string;
    severity: string | null;
    diagnosedAt: string | null;
    logCount: number;
    lastLog: string | null;
  }>;
  recentLogs: IHealthLogResponse[];
  alerts: IHealthAlertResponse[];
  stats: {
    totalLogs: number;
    totalAlerts: number;
    activeConditions: number;
    thisWeekLogs: number;
  };
}
