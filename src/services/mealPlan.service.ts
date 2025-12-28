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

    // Normalize meal plan data for consistency
    const normalizedMealPlans = mealPlans.map((plan) => 
      this.normalizeMealPlanData(plan as unknown as IMealPlan)
    );

    return { mealPlans: normalizedMealPlans, total };
  }

  // Get meal plan by ID
  async getMealPlanById(id: string, userId: string): Promise<IMealPlan | null> {
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id,
        userId,
      },
    });
    
    if (!mealPlan) return null;
    
    // Normalize the data before returning
    return this.normalizeMealPlanData(mealPlan as unknown as IMealPlan);
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
    
    if (!mealPlan) return null;
    
    return this.normalizeMealPlanData(mealPlan as unknown as IMealPlan);
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
    return this.normalizeMealPlanData(mealPlan as unknown as IMealPlan);
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

  // Normalize meal plan data to ensure consistent structure and fill missing values
  private normalizeMealPlanData(mealPlan: IMealPlan): IMealPlan {
    const data = mealPlan.mealPlanData as any;
    if (!data) return mealPlan;

    // Get the daily meals array from various possible structures
    const dailyMeals = data.mealPlan?.dailyMeals || data.days || [];
    
    // Normalize each day's meals
    const normalizedDailyMeals = dailyMeals.map((day: any, dayIndex: number) => {
      const meals = day.meals || [];
      
      // Normalize each meal
      const normalizedMeals = Array.isArray(meals) 
        ? meals.map((meal: any, mealIndex: number) => this.normalizeMeal(meal, mealIndex))
        : Object.entries(meals).map(([mealType, meal]: [string, any], mealIndex: number) => 
            this.normalizeMeal({ ...meal, mealType }, mealIndex)
          );

      // Calculate daily totals from normalized meals
      const dailyTotals = this.calculateDailyTotals(normalizedMeals);

      return {
        ...day,
        day: day.day || dayIndex + 1,
        dayName: day.dayName || this.getDayName(dayIndex),
        meals: normalizedMeals,
        dailyTotals,
        waterIntakeGoal: day.waterIntakeGoal || 8,
        dailyTip: day.dailyTip || "Stay hydrated and eat mindfully.",
      };
    });

    // Calculate average daily calories from normalized data
    const avgCalories = normalizedDailyMeals.length > 0
      ? Math.round(normalizedDailyMeals.reduce((sum: number, day: any) => sum + day.dailyTotals.calories, 0) / normalizedDailyMeals.length)
      : 2000;

    // Normalize summary
    const summary = data.mealPlan?.summary || data.summary || {};
    const normalizedSummary = {
      totalCaloriesPerDay: summary.totalCaloriesPerDay || avgCalories,
      macroBreakdown: this.normalizeMacroBreakdown(summary.macroBreakdown || summary.macroDistribution || summary.macronutrients),
      estimatedWeeklyCostPKR: summary.estimatedWeeklyCostPKR || summary.weeklyCost || 7000,
      estimatedMonthlyCostPKR: summary.estimatedMonthlyCostPKR || summary.monthlyCost || 28000,
      keyFeatures: summary.keyFeatures || ["Balanced nutrition", "Pakistani cuisine", "Budget-friendly"],
      expectedOutcomes: summary.expectedOutcomes || ["Improved energy", "Better health", "Weight management"],
    };

    // Build normalized mealPlanData
    const normalizedData: IMealPlanData = {
      mealPlan: {
        summary: normalizedSummary,
        dailyMeals: normalizedDailyMeals,
        shoppingList: data.mealPlan?.shoppingList || data.shoppingList || [],
        weeklyTips: data.mealPlan?.weeklyTips || data.weeklyTips || [],
        healthWarnings: data.mealPlan?.healthWarnings || data.healthWarnings || [],
        mealPrepStrategies: data.mealPlan?.mealPrepStrategies || data.mealPrepStrategies || [],
        substitutionGuide: data.mealPlan?.substitutionGuide || data.substitutionGuide || [],
      },
      disclaimer: data.disclaimer || data.mealPlan?.disclaimer || "This meal plan is for informational purposes only.",
    };

    // Update totalCalories if it was 0
    const totalCalories = mealPlan.totalCalories > 0 
      ? mealPlan.totalCalories 
      : normalizedSummary.totalCaloriesPerDay * normalizedDailyMeals.length;

    return {
      ...mealPlan,
      mealPlanData: normalizedData,
      totalCalories,
    };
  }

  // Normalize a single meal with realistic default values
  private normalizeMeal(meal: any, mealIndex: number): any {
    const mealType = meal.mealType || this.inferMealType(mealIndex);
    const defaultNutrition = this.getDefaultNutrition(mealType);

    // Check if nutrition exists and has non-zero values
    const hasValidNutrition = meal.nutrition && 
      meal.nutrition.calories > 0 && 
      meal.nutrition.protein > 0;

    const nutrition = hasValidNutrition ? meal.nutrition : {
      calories: meal.calories || defaultNutrition.calories,
      protein: meal.protein || defaultNutrition.protein,
      carbs: meal.carbs || defaultNutrition.carbs,
      fats: meal.fats || defaultNutrition.fats,
      fiber: meal.fiber || defaultNutrition.fiber,
    };

    return {
      ...meal,
      name: meal.name || meal.dishName || meal.mealName || "Pakistani Dish",
      nameUrdu: meal.nameUrdu || meal.name || "پاکستانی کھانا",
      mealType,
      time: meal.time || meal.mealTime || this.getDefaultMealTime(mealType),
      description: meal.description || "A nutritious Pakistani meal.",
      nutrition,
      // Keep calories at top level for backward compatibility
      calories: nutrition.calories,
      ingredients: meal.ingredients || [],
      recipe: meal.recipe || { prepTime: 15, cookTime: 20, steps: [], tips: "" },
      healthBenefits: meal.healthBenefits || [],
      alternatives: meal.alternatives || [],
    };
  }

  // Normalize macro breakdown to ensure it sums to 100
  private normalizeMacroBreakdown(macros: any): { carbsPercent: number; proteinPercent: number; fatsPercent: number } {
    if (!macros) {
      return { carbsPercent: 45, proteinPercent: 30, fatsPercent: 25 };
    }

    const carbs = macros.carbsPercent || macros.carbs || 45;
    const protein = macros.proteinPercent || macros.protein || 30;
    const fats = macros.fatsPercent || macros.fats || 25;
    const total = carbs + protein + fats;

    // If they don't sum to 100, normalize them
    if (total !== 100 && total > 0) {
      return {
        carbsPercent: Math.round((carbs / total) * 100),
        proteinPercent: Math.round((protein / total) * 100),
        fatsPercent: Math.round((fats / total) * 100),
      };
    }

    return { carbsPercent: carbs, proteinPercent: protein, fatsPercent: fats };
  }

  // Calculate daily totals from meals
  private calculateDailyTotals(meals: any[]): { calories: number; protein: number; carbs: number; fats: number; fiber: number } {
    return meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + (meal.nutrition?.calories || meal.calories || 0),
        protein: totals.protein + (meal.nutrition?.protein || meal.protein || 0),
        carbs: totals.carbs + (meal.nutrition?.carbs || meal.carbs || 0),
        fats: totals.fats + (meal.nutrition?.fats || meal.fats || 0),
        fiber: totals.fiber + (meal.nutrition?.fiber || meal.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  }

  // Helper methods
  private getDayName(index: number): string {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[index % 7];
  }

  private inferMealType(mealIndex: number): string {
    const types = ["breakfast", "morning_snack", "lunch", "evening_snack", "dinner", "late_snack"];
    return types[mealIndex % types.length] || "lunch";
  }

  private getDefaultMealTime(mealType: string): string {
    const times: { [key: string]: string } = {
      breakfast: "8:00 AM",
      morning_snack: "11:00 AM",
      lunch: "1:00 PM",
      evening_snack: "5:00 PM",
      dinner: "8:00 PM",
      late_snack: "10:00 PM",
    };
    return times[mealType] || "12:00 PM";
  }

  private getDefaultNutrition(mealType: string): { calories: number; protein: number; carbs: number; fats: number; fiber: number } {
    const nutritionByType: { [key: string]: any } = {
      breakfast: { calories: 450, protein: 20, carbs: 55, fats: 18, fiber: 6 },
      morning_snack: { calories: 150, protein: 8, carbs: 20, fats: 5, fiber: 3 },
      lunch: { calories: 600, protein: 35, carbs: 65, fats: 22, fiber: 8 },
      evening_snack: { calories: 150, protein: 6, carbs: 22, fats: 5, fiber: 2 },
      dinner: { calories: 550, protein: 30, carbs: 55, fats: 20, fiber: 7 },
      late_snack: { calories: 100, protein: 5, carbs: 15, fats: 3, fiber: 2 },
    };
    return nutritionByType[mealType] || { calories: 450, protein: 25, carbs: 50, fats: 15, fiber: 5 };
  }
}

export default new MealPlanService();
