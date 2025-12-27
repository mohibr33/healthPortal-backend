import prisma from "../config/database";
import { IMealPlan, IMealPlanData } from "../types/mealPlan.types";
import openaiService from "./openai.service";
import healthProfileService from "./healthProfile.service";

class MealPlanService {
  // Generate new meal plan
  async generateMealPlan(userId: string, duration: string): Promise<IMealPlan> {
    // Get user's health profile
    const healthProfile = await healthProfileService.getUserHealthProfile(
      userId
    );

    if (!healthProfile) {
      throw new Error(
        "Health profile not found. Please create your health profile first."
      );
    }

    // Generate meal plan using AI
    const aiResponse: IMealPlanData = await openaiService.generateMealPlan(
      healthProfile,
      duration
    );

    // Extract metadata from the properly structured response
    const totalCalories =
      aiResponse.mealPlan?.summary?.totalCaloriesPerDay || 2000;
    
    // Get estimated cost from the new structure
    const estimatedCost =
      aiResponse.mealPlan?.summary?.estimatedWeeklyCostPKR || 0;

    // Save meal plan to database
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        duration: `${duration} days`,
        userProfileData: JSON.parse(JSON.stringify(healthProfile)),
        mealPlanData: JSON.parse(JSON.stringify(aiResponse)),
        totalCalories,
        estimatedCost,
      },
    });

    return mealPlan as unknown as IMealPlan;
  }

  // Get user's meal plans
  async getUserMealPlans(
    userId: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ mealPlans: IMealPlan[]; total: number }> {
    const [mealPlans, total] = await Promise.all([
      prisma.mealPlan.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.mealPlan.count({ where: { userId } }),
    ]);

    return { mealPlans: mealPlans as unknown as IMealPlan[], total };
  }

  // Get meal plan by ID
  async getMealPlanById(id: string, userId: string): Promise<IMealPlan | null> {
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id,
        userId,
      },
    });
    return mealPlan as unknown as IMealPlan | null;
  }

  // Get active meal plan
  async getActiveMealPlan(userId: string): Promise<IMealPlan | null> {
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        userId,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });
    return mealPlan as unknown as IMealPlan | null;
  }

  // Update meal plan status
  async updateMealPlanStatus(
    id: string,
    userId: string,
    status: "active" | "completed" | "archived"
  ): Promise<IMealPlan> {
    const mealPlan = await prisma.mealPlan.update({
      where: {
        id,
        userId,
      },
      data: { status },
    });
    return mealPlan as unknown as IMealPlan;
  }

  // Delete meal plan
  async deleteMealPlan(id: string, userId: string): Promise<void> {
    await prisma.mealPlan.delete({
      where: {
        id,
        userId,
      },
    });
  }
}

export default new MealPlanService();
