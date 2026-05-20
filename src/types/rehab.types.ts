export interface IAuthRequest extends Request {
  userId?: string;
}

import { Request } from "express";

export interface IExerciseProgress {
  exerciseId: string;
  completedCount: number;
  lastCompletedAt: string;
}

export interface IDailyChecklist {
  id: string;
  date: string;
  items: IChecklistItem[];
}

export interface IChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}
