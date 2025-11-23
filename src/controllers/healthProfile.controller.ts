import { Request, Response, NextFunction } from "express";
import healthProfileService from "../services/healthProfile.service";
import { IAuthRequest } from "../types/user.types";

// Create or update health profile
export const createHealthProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const profileData = req.body;

    const profile = await healthProfileService.upsertHealthProfile(
      userId,
      profileData
    );

    res.status(201).json({
      success: true,
      message: "Health profile saved successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's health profile
export const getHealthProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;

    const profile = await healthProfileService.getUserHealthProfile(userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Health profile not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// Delete health profile
export const deleteHealthProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;

    await healthProfileService.deleteHealthProfile(userId);

    res.status(200).json({
      success: true,
      message: "Health profile deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
