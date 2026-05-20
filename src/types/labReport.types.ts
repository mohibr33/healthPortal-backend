import { Request } from "express";

export interface IBiomarker {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "normal" | "abnormal" | "critical";
  normalRange?: string;
  explanation?: string;
  causes?: string[];
  relatedConditions?: string[];
}

export interface IReportSummary {
  totalBiomarkers: number;
  normalCount: number;
  abnormalCount: number;
  criticalCount: number;
  overallStatus: "normal" | "abnormal" | "critical";
  keyFindings: string[];
}

export interface ICriticalAlert {
  biomarker: string;
  value: string;
  normalRange: string;
  severity: "critical" | "high";
  message: string;
  recommendation: string;
}

export interface IUploadLabReportDTO {
  title?: string;
  testDate?: string;
  labName?: string;
}

export interface IShareLabReportDTO {
  doctorEmail: string;
}

export interface ILabReportResponse {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  biomarkers: IBiomarker[];
  summary: IReportSummary;
  analysis?: string;
  overallStatus: string;
  criticalAlerts?: ICriticalAlert[];
  flaggedConditions?: string[];
  flaggedMedications?: string[];
  personalizedRecommendations?: string;
  testDate?: string;
  labName?: string;
  uploadedAt: string;
  analyzedAt?: string;
  isSharedWithDoctor: boolean;
  doctorEmail?: string;
}

export interface ILabReportListResponse {
  reports: ILabReportResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IAuthRequest extends Request {
  userId?: string;
  email?: string;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}
