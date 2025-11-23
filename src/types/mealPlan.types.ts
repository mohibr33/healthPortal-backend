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

export interface IMealPlan {
  id: string;
  userId: string;
  duration: string;
  status: string;
  userProfileData: any;
  mealPlanData: any;
  totalCalories: number;
  estimatedCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGenerateMealPlanDTO {
  duration: string; // "7" or "30"
}

export interface IMealPlanResponse {
  id: string;
  duration: string;
  status: string;
  mealPlanData: any;
  totalCalories: number;
  estimatedCost: number;
  createdAt: Date;
}
