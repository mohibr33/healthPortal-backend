import prisma from "../config/database";
import { IMealPlan } from "../types/mealPlan.types";
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
    const aiResponse = await openaiService.generateMealPlan(
      healthProfile,
      duration
    );

    // Extract metadata
    const totalCalories =
      aiResponse.mealPlan?.summary?.totalCaloriesPerDay || 2000;
    const estimatedCost = this.parseEstimatedCost(
      aiResponse.mealPlan?.summary?.estimatedCost
    );

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

    return mealPlan as IMealPlan;
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

    return { mealPlans: mealPlans as IMealPlan[], total };
  }

  // Get meal plan by ID
  async getMealPlanById(id: string, userId: string): Promise<IMealPlan | null> {
    return (await prisma.mealPlan.findFirst({
      where: {
        id,
        userId,
      },
    })) as IMealPlan | null;
  }

  // Get active meal plan
  async getActiveMealPlan(userId: string): Promise<IMealPlan | null> {
    return (await prisma.mealPlan.findFirst({
      where: {
        userId,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    })) as IMealPlan | null;
  }

  // Update meal plan status
  async updateMealPlanStatus(
    id: string,
    userId: string,
    status: "active" | "completed" | "archived"
  ): Promise<IMealPlan> {
    return (await prisma.mealPlan.update({
      where: {
        id,
        userId,
      },
      data: { status },
    })) as IMealPlan;
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

  // Helper: Parse estimated cost from string
  private parseEstimatedCost(costString?: string): number {
    if (!costString) return 0;

    // Extract number from strings like "8500 PKR/week" or "8500"
    const match = costString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}

export default new MealPlanService();
