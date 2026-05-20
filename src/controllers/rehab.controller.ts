import { Request, Response, NextFunction } from "express";
import { IAuthRequest } from "../types/rehab.types";
import rehabService from "../services/rehab.service";

export const getProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const progress = await rehabService.getProgress(userId);
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { exerciseId } = req.body;
    const progress = await rehabService.updateProgress(userId, exerciseId);
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

export const getChecklist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { date } = req.params;
    const checklist = await rehabService.getChecklist(userId, date);
    res.json({ success: true, data: checklist });
  } catch (error) {
    next(error);
  }
};

export const saveChecklist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { date, items } = req.body;
    const checklist = await rehabService.upsertChecklist(userId, date, items);
    res.json({ success: true, data: checklist });
  } catch (error) {
    next(error);
  }
};
