import { Request } from "express";
import { MoodLevel, StressLevel, ScreeningType, ScreeningSeverity, MeditationType, ResourceCategory } from "@prisma/client";

export interface IAuthRequest extends Request {
  userId?: string;
  email?: string;
}

// Mood
export interface ICreateMoodEntryDTO {
  mood: MoodLevel;
  note?: string;
  date?: string;
}

export interface IMoodEntryResponse {
  id: string;
  userId: string;
  mood: MoodLevel;
  note: string | null;
  date: Date;
  createdAt: Date;
}

export interface IMoodTrendResponse {
  entries: IMoodEntryResponse[];
  averageMood: number;
  trend: "improving" | "declining" | "stable";
  weeklySummary: { date: string; averageMood: number }[];
  monthlySummary: { week: string; averageMood: number }[];
}

// Stress Assessment
export interface ICreateStressAssessmentDTO {
  answers: { question: string; answer: number }[];
  date?: string;
}

export interface IStressAssessmentResponse {
  id: string;
  userId: string;
  score: number;
  level: StressLevel;
  answers: any;
  date: Date;
  createdAt: Date;
}

export interface IStressTrendResponse {
  assessments: IStressAssessmentResponse[];
  averageScore: number;
  currentLevel: StressLevel;
  weeklySummary: { date: string; averageScore: number }[];
  monthlySummary: { week: string; averageScore: number }[];
}

// Anxiety Screening
export interface ICreateScreeningDTO {
  testType: ScreeningType;
  answers: { question: string; answer: number }[];
}

export interface IScreeningResponse {
  id: string;
  userId: string;
  testType: ScreeningType;
  score: number;
  severity: ScreeningSeverity;
  answers: any;
  recommendation: string | null;
  aiGeneratedSuggestion: string | null;
  createdAt: Date;
}

// Journal
export interface ICreateJournalEntryDTO {
  title?: string;
  content: string;
  isAnonymous?: boolean;
}

export interface IJournalEntryResponse {
  id: string;
  userId: string | null;
  title: string | null;
  content: string;
  isAnonymous: boolean;
  sentiment: any;
  analyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISentimentAnalysis {
  overallSentiment: "positive" | "negative" | "neutral" | "mixed";
  score: number; // -1 to 1
  emotions: { emotion: string; intensity: number }[];
  stressIndicators: string[];
  anxietyIndicators: string[];
  recommendations: string[];
}

// Meditation
export interface ICreateMeditationSessionDTO {
  type: MeditationType;
  duration: number;
  title: string;
  description?: string;
  audioUrl?: string;
  completedAt?: string;
}

export interface IMeditationSessionResponse {
  id: string;
  userId: string;
  type: MeditationType;
  duration: number;
  title: string;
  description: string | null;
  audioUrl: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

// Wellness Resources
export interface ICreateWellnessResourceDTO {
  title: string;
  slug: string;
  category: ResourceCategory;
  excerpt?: string;
  content: string;
  imageUrl?: string;
  author?: string;
  readTime?: number;
  tags?: string[];
  sourceLink?: string;
}

export interface IWellnessResourceResponse {
  id: string;
  title: string;
  slug: string;
  category: ResourceCategory;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  author: string | null;
  readTime: number | null;
  tags: string[] | null;
  sourceLink: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResourcesListResponse {
  resources: IWellnessResourceResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}
