import OpenAI from "openai";
import type {
  IMealPlanData,
  INutrition,
  IDailyMeals,
  IMeal,
  IShoppingItem,
} from "../types/mealPlan.types";

// ============================================================================
// JSON SCHEMA FOR STRUCTURED OUTPUT
// ============================================================================

const mealPlanJsonSchema = {
  name: "meal_plan",
  strict: true,
  schema: {
    type: "object",
    properties: {
      mealPlan: {
        type: "object",
        properties: {
          summary: {
            type: "object",
            properties: {
              totalCaloriesPerDay: { type: "number" },
              macroBreakdown: {
                type: "object",
                properties: {
                  carbsPercent: { type: "number" },
                  proteinPercent: { type: "number" },
                  fatsPercent: { type: "number" },
                },
                required: ["carbsPercent", "proteinPercent", "fatsPercent"],
                additionalProperties: false,
              },
              estimatedWeeklyCostPKR: { type: "number" },
              estimatedMonthlyCostPKR: { type: "number" },
              keyFeatures: { type: "array", items: { type: "string" } },
              expectedOutcomes: { type: "array", items: { type: "string" } },
            },
            required: [
              "totalCaloriesPerDay",
              "macroBreakdown",
              "estimatedWeeklyCostPKR",
              "estimatedMonthlyCostPKR",
              "keyFeatures",
              "expectedOutcomes",
            ],
            additionalProperties: false,
          },
          dailyMeals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                dayName: { type: "string" },
                meals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      nameUrdu: { type: "string" },
                      mealType: {
                        type: "string",
                        enum: [
                          "breakfast",
                          "morning_snack",
                          "lunch",
                          "evening_snack",
                          "dinner",
                          "late_snack",
                        ],
                      },
                      time: { type: "string" },
                      description: { type: "string" },
                      ingredients: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            nameUrdu: { type: "string" },
                            quantity: { type: "string" },
                            estimatedCostPKR: { type: "number" },
                          },
                          required: [
                            "name",
                            "nameUrdu",
                            "quantity",
                            "estimatedCostPKR",
                          ],
                          additionalProperties: false,
                        },
                      },
                      recipe: {
                        type: "object",
                        properties: {
                          prepTime: { type: "number" },
                          cookTime: { type: "number" },
                          steps: { type: "array", items: { type: "string" } },
                          tips: { type: "string" },
                        },
                        required: ["prepTime", "cookTime", "steps", "tips"],
                        additionalProperties: false,
                      },
                      nutrition: {
                        type: "object",
                        properties: {
                          calories: { type: "number" },
                          protein: { type: "number" },
                          carbs: { type: "number" },
                          fats: { type: "number" },
                          fiber: { type: "number" },
                        },
                        required: [
                          "calories",
                          "protein",
                          "carbs",
                          "fats",
                          "fiber",
                        ],
                        additionalProperties: false,
                      },
                      healthBenefits: {
                        type: "array",
                        items: { type: "string" },
                      },
                      alternatives: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: [
                      "name",
                      "nameUrdu",
                      "mealType",
                      "time",
                      "description",
                      "ingredients",
                      "recipe",
                      "nutrition",
                      "healthBenefits",
                      "alternatives",
                    ],
                    additionalProperties: false,
                  },
                },
                dailyTotals: {
                  type: "object",
                  properties: {
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fats: { type: "number" },
                    fiber: { type: "number" },
                  },
                  required: ["calories", "protein", "carbs", "fats", "fiber"],
                  additionalProperties: false,
                },
                waterIntakeGoal: { type: "number" },
                dailyTip: { type: "string" },
              },
              required: [
                "day",
                "dayName",
                "meals",
                "dailyTotals",
                "waterIntakeGoal",
                "dailyTip",
              ],
              additionalProperties: false,
            },
          },
          shoppingList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                quantity: { type: "string" },
                estimatedCostPKR: { type: "number" },
                category: {
                  type: "string",
                  enum: [
                    "vegetables",
                    "fruits",
                    "proteins",
                    "dairy",
                    "grains",
                    "spices",
                    "oils",
                    "others",
                  ],
                },
              },
              required: ["item", "quantity", "estimatedCostPKR", "category"],
              additionalProperties: false,
            },
          },
          weeklyTips: { type: "array", items: { type: "string" } },
          healthWarnings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                condition: { type: "string" },
                warning: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["condition", "warning", "recommendations"],
              additionalProperties: false,
            },
          },
          mealPrepStrategies: { type: "array", items: { type: "string" } },
          substitutionGuide: {
            type: "array",
            items: {
              type: "object",
              properties: {
                original: { type: "string" },
                substitutes: { type: "array", items: { type: "string" } },
                notes: { type: "string" },
              },
              required: ["original", "substitutes", "notes"],
              additionalProperties: false,
            },
          },
        },
        required: [
          "summary",
          "dailyMeals",
          "shoppingList",
          "weeklyTips",
          "healthWarnings",
          "mealPrepStrategies",
          "substitutionGuide",
        ],
        additionalProperties: false,
      },
      disclaimer: { type: "string" },
    },
    required: ["mealPlan", "disclaimer"],
    additionalProperties: false,
  },
};

// ============================================================================
// OPENAI SERVICE
// ============================================================================

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateMealPlan(
    userProfile: any,
    duration: string
  ): Promise<IMealPlanData> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(userProfile, duration);
    const daysCount = parseInt(duration) || 7;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: mealPlanJsonSchema,
        },
        temperature: 0.7,
        max_tokens: 16000,
      });

      const responseContent = completion.choices[0].message.content;

      if (!responseContent) {
        throw new Error("Empty response from AI");
      }

      let parsedResponse: IMealPlanData;
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        throw new Error("Failed to parse meal plan response");
      }

      // Validate that we got the correct number of days
      const actualDays = parsedResponse.mealPlan?.dailyMeals?.length || 0;
      if (actualDays < daysCount) {
        console.warn(
          `Expected ${daysCount} days but got ${actualDays}. Response may be incomplete.`
        );
      }

      // Validate and fix any missing data
      const validatedResponse = this.validateAndFixResponse(
        parsedResponse,
        daysCount
      );

      return validatedResponse;
    } catch (error: any) {
      console.error("OpenAI API Error:", error.message);

      // Handle specific OpenAI errors
      if (error.code === "invalid_api_key") {
        throw new Error("OpenAI API key is invalid or not configured");
      }

      if (error.code === "insufficient_quota") {
        throw new Error("OpenAI API quota exceeded. Please try again later.");
      }

      if (error.message?.includes("parse")) {
        throw new Error(
          "Failed to generate properly structured meal plan. Please try again."
        );
      }

      throw new Error(`Failed to generate meal plan: ${error.message}`);
    }
  }

  private validateAndFixResponse(
    response: IMealPlanData,
    _expectedDays: number
  ): IMealPlanData {
    const validatedResponse = JSON.parse(JSON.stringify(response));
    const { mealPlan } = validatedResponse;

    // Ensure dailyMeals exists and is an array
    if (!mealPlan.dailyMeals || !Array.isArray(mealPlan.dailyMeals)) {
      mealPlan.dailyMeals = [];
    }

    // Track if we need to recalculate summary
    let totalDailyCalories = 0;
    let daysWithData = 0;

    // Ensure all daily meals have required fields
    mealPlan.dailyMeals = mealPlan.dailyMeals.map(
      (day: IDailyMeals, index: number) => {
        // Fix day number if needed
        const fixedDay: IDailyMeals = {
          ...day,
          day: day.day || index + 1,
          dayName: day.dayName || this.getDayName(index),
          waterIntakeGoal: day.waterIntakeGoal || 8,
          dailyTip: day.dailyTip || this.getDefaultDailyTip(index),
          meals: day.meals || [],
          dailyTotals: day.dailyTotals || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            fiber: 0,
          },
        };

        // Ensure all meals have required nutrition data with realistic defaults
        fixedDay.meals = (day.meals || []).map((meal: IMeal, mealIndex: number) => {
          const mealType = meal.mealType || this.inferMealType(mealIndex);
          const defaultNutrition = this.getDefaultNutrition(mealType);

          return {
            ...meal,
            name: meal.name || "Traditional Pakistani Dish",
            nameUrdu: meal.nameUrdu || meal.name || "روایتی پاکستانی پکوان",
            mealType: mealType,
            time: meal.time || this.getDefaultMealTime(mealType),
            description: meal.description || "A nutritious Pakistani meal prepared with fresh ingredients.",
            nutrition: {
              calories: meal.nutrition?.calories && meal.nutrition.calories > 0 
                ? meal.nutrition.calories 
                : defaultNutrition.calories,
              protein: meal.nutrition?.protein && meal.nutrition.protein > 0 
                ? meal.nutrition.protein 
                : defaultNutrition.protein,
              carbs: meal.nutrition?.carbs && meal.nutrition.carbs > 0 
                ? meal.nutrition.carbs 
                : defaultNutrition.carbs,
              fats: meal.nutrition?.fats && meal.nutrition.fats > 0 
                ? meal.nutrition.fats 
                : defaultNutrition.fats,
              fiber: meal.nutrition?.fiber && meal.nutrition.fiber > 0 
                ? meal.nutrition.fiber 
                : defaultNutrition.fiber,
            },
            ingredients: meal.ingredients && meal.ingredients.length > 0 
              ? meal.ingredients 
              : this.getDefaultIngredients(mealType),
            recipe: {
              prepTime: meal.recipe?.prepTime && meal.recipe.prepTime > 0 ? meal.recipe.prepTime : 15,
              cookTime: meal.recipe?.cookTime && meal.recipe.cookTime > 0 ? meal.recipe.cookTime : 25,
              steps: meal.recipe?.steps && meal.recipe.steps.length > 0 
                ? meal.recipe.steps 
                : ["Prepare all ingredients", "Heat oil in a pan", "Cook ingredients as required", "Season to taste and serve hot"],
              tips: meal.recipe?.tips || "Adjust seasoning according to your preference",
            },
            healthBenefits: meal.healthBenefits && meal.healthBenefits.length > 0 
              ? meal.healthBenefits 
              : ["Provides essential nutrients", "Supports overall health"],
            alternatives: meal.alternatives && meal.alternatives.length > 0 
              ? meal.alternatives 
              : ["Similar dish with chicken", "Vegetarian version available"],
          };
        });

        // Recalculate daily totals from meals
        fixedDay.dailyTotals = this.calculateDailyTotals(fixedDay.meals);
        
        // Track for summary calculation
        if (fixedDay.dailyTotals.calories > 0) {
          totalDailyCalories += fixedDay.dailyTotals.calories;
          daysWithData++;
        }

        return fixedDay;
      }
    );

    // Ensure summary exists and has valid data
    if (!mealPlan.summary) {
      mealPlan.summary = {
        totalCaloriesPerDay: 2000,
        macroBreakdown: {
          carbsPercent: 45,
          proteinPercent: 30,
          fatsPercent: 25,
        },
        estimatedWeeklyCostPKR: 7000,
        estimatedMonthlyCostPKR: 28000,
        keyFeatures: [
          "Balanced nutrition tailored to your goals",
          "Traditional Pakistani recipes",
          "Budget-friendly ingredients",
        ],
        expectedOutcomes: [
          "Improved energy levels",
          "Better nutritional intake",
          "Progress towards health goals",
        ],
      };
    }

    // Fix totalCaloriesPerDay if missing or zero
    if (!mealPlan.summary.totalCaloriesPerDay || mealPlan.summary.totalCaloriesPerDay === 0) {
      if (daysWithData > 0) {
        mealPlan.summary.totalCaloriesPerDay = Math.round(totalDailyCalories / daysWithData);
      } else {
        mealPlan.summary.totalCaloriesPerDay = 2000;
      }
    }

    // Validate and fix macroBreakdown to ensure it sums to 100
    if (!mealPlan.summary.macroBreakdown) {
      mealPlan.summary.macroBreakdown = {
        carbsPercent: 45,
        proteinPercent: 30,
        fatsPercent: 25,
      };
    } else {
      const { carbsPercent, proteinPercent, fatsPercent } = mealPlan.summary.macroBreakdown;
      const total = (carbsPercent || 0) + (proteinPercent || 0) + (fatsPercent || 0);
      
      if (total !== 100 || !carbsPercent || !proteinPercent || !fatsPercent) {
        // Recalculate from actual meal data if possible
        const macros = this.calculateAverageMacros(mealPlan.dailyMeals);
        mealPlan.summary.macroBreakdown = macros;
      }
    }

    // Ensure cost estimates are present
    if (!mealPlan.summary.estimatedWeeklyCostPKR || mealPlan.summary.estimatedWeeklyCostPKR === 0) {
      mealPlan.summary.estimatedWeeklyCostPKR = this.estimateCostFromMeals(mealPlan.dailyMeals, 7);
    }
    if (!mealPlan.summary.estimatedMonthlyCostPKR || mealPlan.summary.estimatedMonthlyCostPKR === 0) {
      mealPlan.summary.estimatedMonthlyCostPKR = mealPlan.summary.estimatedWeeklyCostPKR * 4;
    }

    // Ensure arrays have content
    if (!mealPlan.summary.keyFeatures || mealPlan.summary.keyFeatures.length === 0) {
      mealPlan.summary.keyFeatures = [
        "Balanced nutrition tailored to your goals",
        "Traditional Pakistani recipes",
        "Budget-friendly ingredients",
      ];
    }
    if (!mealPlan.summary.expectedOutcomes || mealPlan.summary.expectedOutcomes.length === 0) {
      mealPlan.summary.expectedOutcomes = [
        "Improved energy levels",
        "Better nutritional intake",
        "Progress towards health goals",
      ];
    }

    // Ensure shopping list exists
    if (!mealPlan.shoppingList || mealPlan.shoppingList.length === 0) {
      mealPlan.shoppingList = this.generateShoppingListFromMeals(mealPlan.dailyMeals);
    }

    // Ensure other required fields
    mealPlan.weeklyTips = mealPlan.weeklyTips && mealPlan.weeklyTips.length > 0 
      ? mealPlan.weeklyTips 
      : [
          "Plan your meals ahead of time to save money and reduce waste",
          "Stay hydrated - drink at least 8 glasses of water daily",
          "Eat slowly and mindfully to improve digestion",
          "Include a variety of colorful vegetables in your meals",
        ];

    mealPlan.healthWarnings = mealPlan.healthWarnings || [];
    mealPlan.mealPrepStrategies = mealPlan.mealPrepStrategies && mealPlan.mealPrepStrategies.length > 0
      ? mealPlan.mealPrepStrategies
      : [
          "Prepare ingredients in bulk on weekends",
          "Store pre-cut vegetables in airtight containers",
          "Cook grains and lentils in batches for the week",
        ];
    mealPlan.substitutionGuide = mealPlan.substitutionGuide || [];

    // Ensure disclaimer exists
    validatedResponse.disclaimer =
      validatedResponse.disclaimer ||
      "This meal plan is for informational purposes only and should not replace professional medical advice. Please consult with a healthcare provider before making significant dietary changes, especially if you have existing health conditions.";

    return validatedResponse;
  }

  // Helper methods for validation
  private getDayName(index: number): string {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[index % 7];
  }

  private getDefaultDailyTip(index: number): string {
    const tips = [
      "Start your day with a glass of warm water with lemon.",
      "Include protein in every meal to stay fuller longer.",
      "Take a short walk after meals to aid digestion.",
      "Avoid screens while eating - focus on your food.",
      "Try to eat dinner at least 2 hours before bedtime.",
      "Include fermented foods like yogurt for gut health.",
      "Plan your meals for the upcoming week today.",
    ];
    return tips[index % tips.length];
  }

  private inferMealType(mealIndex: number): IMeal["mealType"] {
    const types: IMeal["mealType"][] = ["breakfast", "morning_snack", "lunch", "evening_snack", "dinner", "late_snack"];
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

  private getDefaultNutrition(mealType: string): INutrition {
    const nutritionByType: { [key: string]: INutrition } = {
      breakfast: { calories: 400, protein: 20, carbs: 50, fats: 15, fiber: 6 },
      morning_snack: { calories: 150, protein: 8, carbs: 20, fats: 5, fiber: 3 },
      lunch: { calories: 600, protein: 35, carbs: 65, fats: 20, fiber: 8 },
      evening_snack: { calories: 150, protein: 6, carbs: 22, fats: 5, fiber: 2 },
      dinner: { calories: 550, protein: 30, carbs: 55, fats: 18, fiber: 7 },
      late_snack: { calories: 100, protein: 5, carbs: 15, fats: 3, fiber: 2 },
    };
    return nutritionByType[mealType] || { calories: 450, protein: 25, carbs: 50, fats: 15, fiber: 5 };
  }

  private getDefaultIngredients(mealType: string): IMeal["ingredients"] {
    // Return generic but realistic Pakistani ingredients based on meal type
    if (mealType === "breakfast") {
      return [
        { name: "Whole wheat flour", nameUrdu: "گندم کا آٹا", quantity: "100g", estimatedCostPKR: 25 },
        { name: "Eggs", nameUrdu: "انڈے", quantity: "2 pieces", estimatedCostPKR: 60 },
        { name: "Milk", nameUrdu: "دودھ", quantity: "1 cup", estimatedCostPKR: 40 },
        { name: "Cooking oil", nameUrdu: "کھانے کا تیل", quantity: "1 tbsp", estimatedCostPKR: 15 },
      ];
    }
    return [
      { name: "Chicken", nameUrdu: "مرغی", quantity: "200g", estimatedCostPKR: 150 },
      { name: "Onions", nameUrdu: "پیاز", quantity: "2 medium", estimatedCostPKR: 30 },
      { name: "Tomatoes", nameUrdu: "ٹماٹر", quantity: "2 medium", estimatedCostPKR: 40 },
      { name: "Rice", nameUrdu: "چاول", quantity: "1 cup", estimatedCostPKR: 50 },
      { name: "Spices", nameUrdu: "مصالحے", quantity: "as needed", estimatedCostPKR: 20 },
    ];
  }

  private calculateAverageMacros(dailyMeals: IDailyMeals[]): { carbsPercent: number; proteinPercent: number; fatsPercent: number } {
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let mealCount = 0;

    dailyMeals.forEach((day) => {
      day.meals.forEach((meal) => {
        if (meal.nutrition) {
          totalProtein += meal.nutrition.protein || 0;
          totalCarbs += meal.nutrition.carbs || 0;
          totalFats += meal.nutrition.fats || 0;
          mealCount++;
        }
      });
    });

    if (mealCount === 0 || (totalProtein + totalCarbs + totalFats) === 0) {
      return { carbsPercent: 45, proteinPercent: 30, fatsPercent: 25 };
    }

    // Calculate calories from macros (protein: 4cal/g, carbs: 4cal/g, fats: 9cal/g)
    const proteinCals = totalProtein * 4;
    const carbsCals = totalCarbs * 4;
    const fatsCals = totalFats * 9;
    const totalCals = proteinCals + carbsCals + fatsCals;

    if (totalCals === 0) {
      return { carbsPercent: 45, proteinPercent: 30, fatsPercent: 25 };
    }

    return {
      carbsPercent: Math.round((carbsCals / totalCals) * 100),
      proteinPercent: Math.round((proteinCals / totalCals) * 100),
      fatsPercent: Math.round((fatsCals / totalCals) * 100),
    };
  }

  private estimateCostFromMeals(dailyMeals: IDailyMeals[], days: number): number {
    let totalCost = 0;
    
    dailyMeals.slice(0, days).forEach((day) => {
      day.meals.forEach((meal) => {
        meal.ingredients?.forEach((ing) => {
          totalCost += ing.estimatedCostPKR || 0;
        });
      });
    });

    // If no cost data, return a reasonable default
    return totalCost > 0 ? totalCost : 7000;
  }

  private calculateDailyTotals(meals: IMeal[]): INutrition {
    return meals.reduce(
      (totals: INutrition, meal: IMeal) => ({
        calories: totals.calories + (meal.nutrition?.calories || 0),
        protein: totals.protein + (meal.nutrition?.protein || 0),
        carbs: totals.carbs + (meal.nutrition?.carbs || 0),
        fats: totals.fats + (meal.nutrition?.fats || 0),
        fiber: totals.fiber + (meal.nutrition?.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  }

  private generateShoppingListFromMeals(dailyMeals: IDailyMeals[]): IShoppingItem[] {
    const ingredientMap = new Map<
      string,
      { quantity: string; cost: number; category: string }
    >();

    dailyMeals.forEach((day: IDailyMeals) => {
      day.meals.forEach((meal: IMeal) => {
        meal.ingredients?.forEach((ingredient) => {
          const existing = ingredientMap.get(ingredient.name);
          if (existing) {
            existing.cost += ingredient.estimatedCostPKR || 0;
          } else {
            ingredientMap.set(ingredient.name, {
              quantity: ingredient.quantity,
              cost: ingredient.estimatedCostPKR || 0,
              category: "others",
            });
          }
        });
      });
    });

    return Array.from(ingredientMap.entries()).map(([name, data]) => ({
      item: name,
      quantity: data.quantity,
      estimatedCostPKR: data.cost,
      category: data.category as IShoppingItem["category"],
    }));
  }

  private getSystemPrompt(): string {
    return `You are an expert Pakistani nutritionist and dietitian with 15+ years of experience. You specialize in creating culturally relevant, medically sound meal plans for Pakistani individuals.

Your expertise includes:
- Pakistani cuisine and traditional cooking methods
- Local food availability and seasonal produce in Pakistan
- Disease-specific dietary requirements (diabetes, hypertension, PCOS, etc.)
- Halal dietary guidelines
- Budget-conscious meal planning using local ingredients
- Family-style cooking adapted for individual health needs
- Understanding of Pakistani eating habits and meal timing

Your meal plans MUST:
1. Use locally available ingredients from Pakistani markets
2. Include traditional dishes adapted for health goals
3. Respect cultural and religious dietary practices
4. Be practical and affordable within the specified budget
5. Consider the cooking skill level and time constraints
6. Provide measurements in Pakistani units (kg, grams, cups, tablespoons)
7. Include both Urdu and English recipe names where applicable
8. Account for Pakistani climate and seasonal food availability

═══════════════════════════════════════════════════════════════════════════════
MANDATORY DATA REQUIREMENTS - FAILURE TO COMPLY WILL RESULT IN INVALID OUTPUT
═══════════════════════════════════════════════════════════════════════════════

For EVERY SINGLE MEAL, you MUST provide:
1. NUTRITION (all fields REQUIRED, NO ZEROS allowed):
   - calories: realistic value (breakfast: 300-500, lunch: 500-700, dinner: 500-700, snacks: 100-200)
   - protein: grams (typically 15-40g per meal)
   - carbs: grams (typically 30-80g per meal)
   - fats: grams (typically 10-30g per meal)
   - fiber: grams (typically 3-10g per meal)

2. INGREDIENTS (minimum 4 ingredients per meal):
   - name: English name
   - nameUrdu: Urdu name
   - quantity: specific amount (e.g., "200g", "2 cups", "1 tablespoon")
   - estimatedCostPKR: realistic cost in Pakistani Rupees

3. RECIPE (all fields REQUIRED):
   - prepTime: minutes (number, e.g., 15)
   - cookTime: minutes (number, e.g., 20)
   - steps: array of at least 4 detailed cooking steps
   - tips: helpful cooking tip as a string

4. OTHER REQUIRED FIELDS:
   - name: dish name in English
   - nameUrdu: dish name in Urdu
   - mealType: breakfast/lunch/dinner/morning_snack/evening_snack/late_snack
   - time: meal time (e.g., "8:00 AM")
   - description: 1-2 sentence description
   - healthBenefits: array of at least 2 health benefits
   - alternatives: array of at least 2 alternative dishes

For SUMMARY (all fields REQUIRED):
- totalCaloriesPerDay: calculated daily average (1500-2500 typically)
- macroBreakdown: carbsPercent + proteinPercent + fatsPercent MUST equal 100
- estimatedWeeklyCostPKR: realistic weekly cost (3000-10000 PKR typically)
- estimatedMonthlyCostPKR: weekly cost × 4
- keyFeatures: array of at least 3 features
- expectedOutcomes: array of at least 3 outcomes

For DAILY TOTALS (calculated by summing all meals for that day):
- calories, protein, carbs, fats, fiber: sum of all meals for that day

VALIDATION CHECKLIST (verify before responding):
✓ Every meal has calories > 0
✓ Every meal has protein > 0
✓ Every meal has carbs > 0
✓ Every meal has fats > 0
✓ Every meal has fiber > 0
✓ Every meal has at least 4 ingredients
✓ Every meal has at least 4 recipe steps
✓ Daily totals are correctly calculated
✓ macroBreakdown percentages sum to 100`;
  }

  private getUserPrompt(userProfile: any, duration: string): string {
    const daysCount = parseInt(duration) || 7;
    const bmi = this.calculateBMI(userProfile.weight, userProfile.height);
    const targetCalories = this.calculateTargetCalories(userProfile);
    const mealsPerDay = userProfile.mealsPerDay || 3;

    return `Create a COMPLETE and DETAILED ${daysCount}-day meal plan for the following individual.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: COMPLETE DATA IS MANDATORY - DO NOT SKIP ANY FIELDS
═══════════════════════════════════════════════════════════════════════════════

PERSONAL INFORMATION:
- Age: ${userProfile.age} years
- Gender: ${userProfile.user?.gender || "Not specified"}
- Height: ${userProfile.height} cm
- Current Weight: ${userProfile.weight} kg
- Target Weight: ${userProfile.targetWeight || "Not specified"} kg
- BMI: ${bmi.toFixed(1)}
- Goal: ${userProfile.primaryGoal}

HEALTH PROFILE:
- Medical Conditions: ${JSON.stringify(userProfile.medicalConditions || [])}
- Current Medications: ${userProfile.medications || "None"}
- Special Conditions: ${JSON.stringify(userProfile.specialConditions || [])}

ALLERGIES & RESTRICTIONS:
- Food Allergies: ${JSON.stringify(userProfile.allergies || [])}
- Dietary Type: ${userProfile.dietaryPreference}
- Foods to Avoid: ${JSON.stringify(userProfile.dislikedFoods || [])}

LIFESTYLE:
- Activity Level: ${userProfile.activityLevel}
- Occupation: ${userProfile.occupation || "Not specified"}
- Sleep: ${userProfile.sleepHours || 7} hours/night
- Water Intake: ${userProfile.waterIntake || 6} glasses/day

GOALS & PREFERENCES:
- Primary Goal: ${userProfile.primaryGoal}
- Timeline: ${userProfile.timeline || "Not specified"}
- Meals Per Day: ${mealsPerDay}
- Regional Preference: ${userProfile.regionalPreference || "All Pakistani"}
- Fasting Requirements: ${userProfile.fastingRequirements ? "Yes" : "No"}

PRACTICAL CONSTRAINTS:
- Monthly Food Budget: ${userProfile.monthlyBudget || 15000} PKR per person
- Cooking Skill: ${userProfile.cookingSkill || "Intermediate"}
- Max Meal Prep Time: ${userProfile.maxPrepTime || 45} minutes
- Eating Out: ${userProfile.eatingOutFrequency || "Rarely"}
- Location: ${userProfile.city || "Pakistan"}

TARGET NUTRITION (MUST be reflected in meal plan):
- Daily Calories: ${targetCalories} kcal (±100)
- Macro Distribution: Carbs 45-50%, Protein 25-30%, Fats 20-25%

MEAL STRUCTURE (${mealsPerDay} meals per day):
${this.getMealStructure(mealsPerDay)}

CRITICAL REQUIREMENTS FOR ${userProfile.medicalConditions?.length > 0 ? "HEALTH CONDITIONS" : "GOALS"}:
${this.generateCriticalRequirements(userProfile)}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT STRUCTURE REQUIREMENTS - ALL FIELDS MANDATORY
═══════════════════════════════════════════════════════════════════════════════

You MUST provide EXACTLY ${daysCount} days in dailyMeals array.
Each day MUST have EXACTLY ${mealsPerDay} meals.

FOR EACH MEAL (${daysCount} days × ${mealsPerDay} meals = ${daysCount * mealsPerDay} total meals):
┌─────────────────────────────────────────────────────────────────────────────┐
│ FIELD              │ REQUIREMENT                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ name               │ Dish name in English (e.g., "Chicken Karahi")         │
│ nameUrdu           │ Dish name in Urdu (e.g., "مرغ کڑاہی")                   │
│ mealType           │ breakfast/lunch/dinner/morning_snack/evening_snack    │
│ time               │ Time string (e.g., "8:00 AM")                         │
│ description        │ 1-2 sentences describing the dish                     │
│ nutrition.calories │ NUMBER > 0 (breakfast: 350-500, lunch/dinner: 500-700)│
│ nutrition.protein  │ NUMBER > 0 (typically 15-40g)                         │
│ nutrition.carbs    │ NUMBER > 0 (typically 30-80g)                         │
│ nutrition.fats     │ NUMBER > 0 (typically 10-30g)                         │
│ nutrition.fiber    │ NUMBER > 0 (typically 3-10g)                          │
│ ingredients        │ ARRAY of 4+ items with name, nameUrdu, quantity, cost │
│ recipe.prepTime    │ NUMBER in minutes (e.g., 15)                          │
│ recipe.cookTime    │ NUMBER in minutes (e.g., 20)                          │
│ recipe.steps       │ ARRAY of 4+ detailed steps                            │
│ recipe.tips        │ STRING with cooking tip                               │
│ healthBenefits     │ ARRAY of 2+ benefits                                  │
│ alternatives       │ ARRAY of 2+ alternative dishes                        │
└─────────────────────────────────────────────────────────────────────────────┘

FOR DAILY TOTALS (calculate by summing all meals for that day):
- calories: SUM of all meal calories for that day (should be ~${targetCalories})
- protein: SUM of all meal protein
- carbs: SUM of all meal carbs
- fats: SUM of all meal fats
- fiber: SUM of all meal fiber

FOR SUMMARY:
- totalCaloriesPerDay: ${targetCalories} (as calculated)
- macroBreakdown: MUST sum to 100% (e.g., carbs: 45, protein: 30, fats: 25)
- estimatedWeeklyCostPKR: realistic cost (5000-15000 PKR range)
- estimatedMonthlyCostPKR: weekly × 4

═══════════════════════════════════════════════════════════════════════════════
FINAL VERIFICATION BEFORE RESPONDING
═══════════════════════════════════════════════════════════════════════════════
□ I have provided exactly ${daysCount} days of meals
□ Each day has exactly ${mealsPerDay} meals
□ EVERY meal has calories > 0 (NOT zero)
□ EVERY meal has protein > 0 (NOT zero)
□ EVERY meal has carbs > 0 (NOT zero)
□ EVERY meal has fats > 0 (NOT zero)
□ EVERY meal has fiber > 0 (NOT zero)
□ EVERY meal has at least 4 ingredients with costs
□ EVERY meal has at least 4 recipe steps
□ Daily totals are correctly summed from meals
□ macroBreakdown percentages sum to exactly 100
□ All costs are in PKR and realistic for Pakistani markets`;
  }

  private getMealStructure(mealsPerDay: number): string {
    const structures: { [key: number]: string } = {
      2: `- Breakfast (8:00 AM): Main morning meal
- Dinner (8:00 PM): Main evening meal`,
      3: `- Breakfast (8:00 AM): Main morning meal
- Lunch (1:00 PM): Midday meal
- Dinner (8:00 PM): Evening meal`,
      4: `- Breakfast (8:00 AM): Main morning meal
- Morning Snack (11:00 AM): Light healthy snack
- Lunch (1:00 PM): Midday meal
- Dinner (8:00 PM): Evening meal`,
      5: `- Breakfast (8:00 AM): Main morning meal
- Morning Snack (11:00 AM): Light healthy snack
- Lunch (1:00 PM): Midday meal
- Evening Snack (5:00 PM): Chai time snack
- Dinner (8:00 PM): Evening meal`,
      6: `- Early Morning (6:00 AM): Pre-breakfast light item
- Breakfast (8:00 AM): Main morning meal
- Morning Snack (11:00 AM): Light healthy snack
- Lunch (1:00 PM): Midday meal
- Evening Snack (5:00 PM): Chai time snack
- Dinner (8:00 PM): Evening meal`,
    };

    return structures[mealsPerDay] || structures[3];
  }

  private calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  private calculateTargetCalories(userProfile: any): number {
    const { weight, height, age, activityLevel, primaryGoal } = userProfile;
    const gender = userProfile.user?.gender || "Male";

    // Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === "Male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
      Athlete: 1.9,
    };

    let tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

    // Adjust for goals
    if (primaryGoal === "Weight Loss") tdee -= 500;
    if (primaryGoal === "Weight Gain") tdee += 500;
    if (primaryGoal === "Muscle Building") tdee += 300;

    return Math.round(tdee);
  }

  private generateCriticalRequirements(userProfile: any): string {
    const requirements: string[] = [];
    const conditions = userProfile.medicalConditions || [];

    if (
      conditions.includes("Diabetes") ||
      conditions.includes("Diabetes Type 2")
    ) {
      requirements.push(
        "- DIABETIC DIET: Low glycemic index foods only, no refined sugar, controlled carb portions (max 45g per meal)"
      );
      requirements.push(
        "- Include fiber-rich foods with every meal to manage blood sugar"
      );
      requirements.push("- Avoid: white rice, white bread, sugary drinks, sweets");
    }

    if (
      conditions.includes("Hypertension") ||
      conditions.includes("High Blood Pressure")
    ) {
      requirements.push(
        "- LOW SODIUM: Maximum 1500mg sodium/day, avoid processed foods, pickles (achar), and excessive salt"
      );
      requirements.push(
        "- Include potassium-rich foods: bananas, yogurt, spinach, sweet potatoes"
      );
      requirements.push("- Avoid: papad, chips, processed meats, canned foods");
    }

    if (conditions.includes("High Cholesterol")) {
      requirements.push(
        "- LOW FAT: Limit saturated fats, avoid ghee/butter, use mustard/olive oil sparingly"
      );
      requirements.push(
        "- Include omega-3 sources: fish (twice weekly), walnuts, flaxseeds"
      );
      requirements.push("- Avoid: fried foods, red meat, full-fat dairy");
    }

    if (conditions.includes("PCOS") || conditions.includes("PCOD")) {
      requirements.push(
        "- PCOS DIET: Low-GI foods, anti-inflammatory ingredients, balanced hormones"
      );
      requirements.push(
        "- Include: spearmint tea, cinnamon, omega-3 rich foods, leafy greens"
      );
      requirements.push("- Avoid: processed foods, excessive dairy, refined carbs");
    }

    if (conditions.includes("Kidney Disease")) {
      requirements.push(
        "- RENAL DIET: Limited protein, low potassium, low phosphorus"
      );
      requirements.push("- Avoid: bananas, oranges, tomatoes, dairy products");
    }

    if (
      userProfile.specialConditions?.includes("Pregnant") ||
      userProfile.specialConditions?.includes("Breastfeeding")
    ) {
      requirements.push(
        "- PREGNANCY NUTRITION: Adequate folate, iron, calcium, and protein"
      );
      requirements.push(
        "- Include: leafy greens, eggs, dairy, lean meats, fortified cereals"
      );
      requirements.push(
        "- Avoid: raw/undercooked foods, unpasteurized dairy, excessive caffeine"
      );
    }

    if (userProfile.primaryGoal === "Weight Loss") {
      requirements.push(
        "- CALORIC DEFICIT: 500 kcal/day deficit for safe weight loss (0.5kg/week)"
      );
      requirements.push(
        "- High protein (keeps you full), moderate carbs, healthy fats"
      );
      requirements.push(
        "- Include filling foods: dal, vegetables, whole grains, lean protein"
      );
    }

    if (userProfile.primaryGoal === "Muscle Building") {
      requirements.push(
        "- HIGH PROTEIN: 1.6-2g protein per kg body weight"
      );
      requirements.push(
        "- Include: eggs, chicken, fish, dal, paneer, Greek yogurt"
      );
      requirements.push("- Post-workout nutrition with protein and carbs");
    }

    if (userProfile.allergies && userProfile.allergies.length > 0) {
      requirements.push(
        `- ALLERGIES: Strictly avoid ${userProfile.allergies.join(", ")}`
      );
    }

    if (userProfile.dislikedFoods && userProfile.dislikedFoods.length > 0) {
      requirements.push(
        `- AVOID: User dislikes ${userProfile.dislikedFoods.join(", ")}`
      );
    }

    return requirements.length > 0
      ? requirements.join("\n")
      : "- No specific dietary restrictions, focus on balanced nutrition";
  }
}

export default new OpenAIService();
