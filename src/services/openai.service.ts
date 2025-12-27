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

    // Ensure all daily meals have required fields
    mealPlan.dailyMeals = mealPlan.dailyMeals.map(
      (day: IDailyMeals, index: number) => {
        // Fix day number if needed
        const fixedDay: IDailyMeals = {
          ...day,
          day: day.day || index + 1,
          dayName: day.dayName || `Day ${index + 1}`,
          waterIntakeGoal: day.waterIntakeGoal || 8,
          dailyTip: day.dailyTip || "Stay hydrated and eat mindfully.",
          meals: day.meals || [],
          dailyTotals: day.dailyTotals || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            fiber: 0,
          },
        };

        // Ensure all meals have required nutrition data
        fixedDay.meals = (day.meals || []).map((meal: IMeal) => ({
          ...meal,
          name: meal.name || "Unnamed Meal",
          nameUrdu: meal.nameUrdu || meal.name || "Unnamed Meal",
          mealType: meal.mealType || "lunch",
          time: meal.time || "12:00 PM",
          description: meal.description || "",
          nutrition: {
            calories: meal.nutrition?.calories || 0,
            protein: meal.nutrition?.protein || 0,
            carbs: meal.nutrition?.carbs || 0,
            fats: meal.nutrition?.fats || 0,
            fiber: meal.nutrition?.fiber || 0,
          },
          ingredients: meal.ingredients || [],
          recipe: meal.recipe || {
            prepTime: 15,
            cookTime: 20,
            steps: ["Prepare ingredients", "Cook as directed", "Serve hot"],
            tips: "Adjust seasoning to taste",
          },
          healthBenefits: meal.healthBenefits || [],
          alternatives: meal.alternatives || [],
        }));

        // Recalculate daily totals if missing or zero
        if (!fixedDay.dailyTotals || fixedDay.dailyTotals.calories === 0) {
          fixedDay.dailyTotals = this.calculateDailyTotals(fixedDay.meals);
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
        estimatedWeeklyCostPKR: 5000,
        estimatedMonthlyCostPKR: 20000,
        keyFeatures: ["Balanced nutrition", "Pakistani cuisine"],
        expectedOutcomes: ["Improved health", "Better energy levels"],
      };
    }

    if (
      !mealPlan.summary.totalCaloriesPerDay ||
      mealPlan.summary.totalCaloriesPerDay === 0
    ) {
      if (mealPlan.dailyMeals.length > 0) {
        const avgCalories =
          mealPlan.dailyMeals.reduce(
            (sum: number, day: IDailyMeals) => sum + day.dailyTotals.calories,
            0
          ) / mealPlan.dailyMeals.length;
        mealPlan.summary.totalCaloriesPerDay = Math.round(avgCalories);
      }
    }

    // Ensure shopping list exists
    if (!mealPlan.shoppingList || mealPlan.shoppingList.length === 0) {
      mealPlan.shoppingList = this.generateShoppingListFromMeals(
        mealPlan.dailyMeals
      );
    }

    // Ensure other required fields
    mealPlan.weeklyTips = mealPlan.weeklyTips || [
      "Plan your meals ahead of time",
      "Stay hydrated throughout the day",
      "Eat slowly and mindfully",
    ];

    mealPlan.healthWarnings = mealPlan.healthWarnings || [];
    mealPlan.mealPrepStrategies = mealPlan.mealPrepStrategies || [
      "Prepare ingredients in bulk on weekends",
      "Store pre-cut vegetables in airtight containers",
    ];
    mealPlan.substitutionGuide = mealPlan.substitutionGuide || [];

    // Ensure disclaimer exists
    validatedResponse.disclaimer =
      validatedResponse.disclaimer ||
      "This meal plan is for informational purposes only and should not replace professional medical advice. Please consult with a healthcare provider before making significant dietary changes.";

    return validatedResponse;
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

CRITICAL REQUIREMENTS:
- ALWAYS provide complete nutritional information for EVERY meal (calories, protein, carbs, fats, fiber)
- ALWAYS include ALL ingredients with quantities and estimated costs in PKR
- ALWAYS provide step-by-step cooking instructions
- ALWAYS include health benefits and alternatives for each meal
- NEVER skip any required fields - all data must be complete
- NEVER provide empty arrays or zero values for nutrition
- Calorie values should be realistic (breakfast: 300-500, lunch: 500-700, dinner: 500-700, snacks: 100-200)`;
  }

  private getUserPrompt(userProfile: any, duration: string): string {
    const daysCount = parseInt(duration) || 7;
    const bmi = this.calculateBMI(userProfile.weight, userProfile.height);
    const targetCalories = this.calculateTargetCalories(userProfile);

    return `Create a COMPLETE and DETAILED ${daysCount}-day meal plan for the following individual.

CRITICAL: You MUST provide EXACTLY ${daysCount} days of meal plans with COMPLETE data for every field.

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
- Meals Per Day: ${userProfile.mealsPerDay}
- Regional Preference: ${userProfile.regionalPreference || "All Pakistani"}
- Fasting Requirements: ${userProfile.fastingRequirements ? "Yes" : "No"}

PRACTICAL CONSTRAINTS:
- Monthly Food Budget: ${userProfile.monthlyBudget || 15000} PKR per person
- Cooking Skill: ${userProfile.cookingSkill || "Intermediate"}
- Max Meal Prep Time: ${userProfile.maxPrepTime || 45} minutes
- Eating Out: ${userProfile.eatingOutFrequency || "Rarely"}
- Location: ${userProfile.city || "Pakistan"}

TARGET NUTRITION:
- Daily Calories: ${targetCalories} kcal (±100)
- Macro Distribution: Carbs 45%, Protein 30%, Fats 25%

MEAL STRUCTURE:
${this.getMealStructure(userProfile.mealsPerDay)}

CRITICAL REQUIREMENTS FOR ${userProfile.medicalConditions?.length > 0 ? "HEALTH CONDITIONS" : "GOALS"}:
${this.generateCriticalRequirements(userProfile)}

MANDATORY OUTPUT REQUIREMENTS:
1. Provide EXACTLY ${daysCount} days in the dailyMeals array (Day 1 through Day ${daysCount})
2. Each meal MUST have complete nutrition data (calories, protein, carbs, fats, fiber) - NO ZEROS
3. Each meal MUST have a complete ingredients list with quantities and costs in PKR
4. Each meal MUST have complete recipe with prep time, cook time, and steps
5. Each meal MUST have health benefits and alternatives
6. Daily totals MUST be calculated correctly from individual meals
7. Shopping list MUST include all ingredients with categories and costs
8. Include variety - avoid repeating the same meals on consecutive days
9. All costs must be realistic for Pakistani markets (current prices)
10. Include both English and Urdu names for dishes

VERIFY YOUR RESPONSE:
- Count the days: You must have exactly ${daysCount} day objects
- Check nutrition: Every meal must have non-zero calorie values
- Check ingredients: Every meal must have at least 3 ingredients
- Check recipes: Every meal must have at least 3 cooking steps`;
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
