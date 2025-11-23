import { Request, Response, NextFunction } from "express";
import mealPlanService from "../services/mealPlan.service";
import { IAuthRequest } from "../types/user.types";

// Generate new meal plan
export const generateMealPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { duration } = req.body;

    const mealPlan = await mealPlanService.generateMealPlan(userId, duration);

    res.status(201).json({
      success: true,
      message: "Meal plan generated successfully",
      data: {
        id: mealPlan.id,
        duration: mealPlan.duration,
        status: mealPlan.status,
        mealPlanData: mealPlan.mealPlanData,
        totalCalories: mealPlan.totalCalories,
        estimatedCost: mealPlan.estimatedCost,
        createdAt: mealPlan.createdAt,
      },
    });
  } catch (error: any) {
    if (error.message.includes("Health profile not found")) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// Get user's meal plans
export const getMyMealPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { mealPlans, total } = await mealPlanService.getUserMealPlans(
      userId,
      skip,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        mealPlans: mealPlans.map((plan) => ({
          id: plan.id,
          duration: plan.duration,
          status: plan.status,
          totalCalories: plan.totalCalories,
          estimatedCost: plan.estimatedCost,
          createdAt: plan.createdAt,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get meal plan by ID
export const getMealPlanById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { id } = req.params;

    const mealPlan = await mealPlanService.getMealPlanById(id, userId);

    if (!mealPlan) {
      res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: mealPlan.id,
        duration: mealPlan.duration,
        status: mealPlan.status,
        mealPlanData: mealPlan.mealPlanData,
        totalCalories: mealPlan.totalCalories,
        estimatedCost: mealPlan.estimatedCost,
        createdAt: mealPlan.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get active meal plan
export const getActiveMealPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;

    const mealPlan = await mealPlanService.getActiveMealPlan(userId);

    if (!mealPlan) {
      res.status(404).json({
        success: false,
        message: "No active meal plan found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: mealPlan.id,
        duration: mealPlan.duration,
        status: mealPlan.status,
        mealPlanData: mealPlan.mealPlanData,
        totalCalories: mealPlan.totalCalories,
        estimatedCost: mealPlan.estimatedCost,
        createdAt: mealPlan.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update meal plan status
export const updateMealPlanStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { id } = req.params;
    const { status } = req.body;

    const mealPlan = await mealPlanService.updateMealPlanStatus(
      id,
      userId,
      status
    );

    res.status(200).json({
      success: true,
      message: "Meal plan status updated successfully",
      data: {
        id: mealPlan.id,
        status: mealPlan.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete meal plan
export const deleteMealPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { id } = req.params;

    await mealPlanService.deleteMealPlan(id, userId);

    res.status(200).json({
      success: true,
      message: "Meal plan deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
