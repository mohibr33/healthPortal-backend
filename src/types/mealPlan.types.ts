// ============================================================================
// HEALTH PROFILE TYPES
// ============================================================================

export interface IHealthProfile {
  id: string;
  userId: string;
  age: number;
  height: number;
  weight: number;
  targetWeight?: number | null;
  medicalConditions?: any;
  medications?: string | null;
  specialConditions?: any;
  allergies?: any;
  dietaryPreference: string;
  dislikedFoods?: any;
  activityLevel: string;
  occupation?: string | null;
  sleepHours?: number | null;
  sleepQuality?: string | null;
  waterIntake?: number | null;
  primaryGoal: string;
  timeline?: string | null;
  mealsPerDay: number;
  regionalPreference?: string | null;
  fastingRequirements: boolean;
  monthlyBudget?: number | null;
  cookingSkill?: string | null;
  maxPrepTime?: number | null;
  eatingOutFrequency?: string | null;
  city?: string | null;
  currentHabits?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateHealthProfileDTO {
  age: number;
  height: number;
  weight: number;
  targetWeight?: number;
  medicalConditions?: string[];
  medications?: string;
  specialConditions?: string[];
  allergies?: string[];
  dietaryPreference: string;
  dislikedFoods?: string[];
  activityLevel: string;
  occupation?: string;
  sleepHours?: number;
  sleepQuality?: string;
  waterIntake?: number;
  primaryGoal: string;
  timeline?: string;
  mealsPerDay?: number;
  regionalPreference?: string;
  fastingRequirements?: boolean;
  monthlyBudget?: number;
  cookingSkill?: string;
  maxPrepTime?: number;
  eatingOutFrequency?: string;
  city?: string;
  currentHabits?: {
    breakfast?: string[];
    lunch?: string[];
    dinner?: string[];
    teaPerDay?: number;
    sugarIntake?: string;
    junkFoodFrequency?: string;
  };
}

// ============================================================================
// MEAL PLAN TYPES - STRICT STRUCTURE
// ============================================================================

// Nutritional information
export interface INutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

// Single ingredient
export interface IIngredient {
  name: string;
  nameUrdu: string;
  quantity: string;
  estimatedCostPKR: number;
}

// Recipe
export interface IRecipe {
  prepTime: number;
  cookTime: number;
  steps: string[];
  tips: string;
}

// Single meal
export interface IMeal {
  name: string;
  nameUrdu: string;
  mealType:
    | "breakfast"
    | "morning_snack"
    | "lunch"
    | "evening_snack"
    | "dinner"
    | "late_snack";
  time: string;
  description: string;
  ingredients: IIngredient[];
  recipe: IRecipe;
  nutrition: INutrition;
  healthBenefits: string[];
  alternatives: string[];
}

// Daily meals
export interface IDailyMeals {
  day: number;
  dayName: string;
  meals: IMeal[];
  dailyTotals: INutrition;
  waterIntakeGoal: number;
  dailyTip: string;
}

// Shopping list item
export interface IShoppingItem {
  item: string;
  quantity: string;
  estimatedCostPKR: number;
  category:
    | "vegetables"
    | "fruits"
    | "proteins"
    | "dairy"
    | "grains"
    | "spices"
    | "oils"
    | "others";
}

// Summary
export interface IMealPlanSummary {
  totalCaloriesPerDay: number;
  macroBreakdown: {
    carbsPercent: number;
    proteinPercent: number;
    fatsPercent: number;
  };
  estimatedWeeklyCostPKR: number;
  estimatedMonthlyCostPKR: number;
  keyFeatures: string[];
  expectedOutcomes: string[];
}

// Health warning
export interface IHealthWarning {
  condition: string;
  warning: string;
  recommendations: string[];
}

// Substitution guide item
export interface ISubstitutionGuide {
  original: string;
  substitutes: string[];
  notes: string;
}

// Complete meal plan data structure (from AI)
export interface IMealPlanData {
  mealPlan: {
    summary: IMealPlanSummary;
    dailyMeals: IDailyMeals[];
    shoppingList: IShoppingItem[];
    weeklyTips: string[];
    healthWarnings: IHealthWarning[];
    mealPrepStrategies: string[];
    substitutionGuide: ISubstitutionGuide[];
  };
  disclaimer: string;
}

// Database meal plan model
export interface IMealPlan {
  id: string;
  userId: string;
  duration: string;
  status: string;
  userProfileData: any;
  mealPlanData: IMealPlanData;
  totalCalories: number;
  estimatedCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGenerateMealPlanDTO {
  duration: "7"; // Only 7-day plans supported
}

export interface IMealPlanResponse {
  id: string;
  duration: string;
  status: string;
  mealPlanData: IMealPlanData;
  totalCalories: number;
  estimatedCost: number;
  createdAt: Date;
}
