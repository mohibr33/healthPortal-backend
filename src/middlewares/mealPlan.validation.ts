import { body } from "express-validator";

export const createHealthProfileValidation = [
  body("age")
    .isInt({ min: 1, max: 120 })
    .withMessage("Age must be between 1 and 120"),

  body("height")
    .isFloat({ min: 50, max: 300 })
    .withMessage("Height must be between 50 and 300 cm"),

  body("weight")
    .isFloat({ min: 20, max: 300 })
    .withMessage("Weight must be between 20 and 300 kg"),

  body("targetWeight")
    .optional()
    .isFloat({ min: 20, max: 300 })
    .withMessage("Target weight must be between 20 and 300 kg"),

  body("medicalConditions")
    .optional()
    .isArray()
    .withMessage("Medical conditions must be an array"),

  body("medications").optional().trim(),

  body("specialConditions")
    .optional()
    .isArray()
    .withMessage("Special conditions must be an array"),

  body("allergies")
    .optional()
    .isArray()
    .withMessage("Allergies must be an array"),

  body("dietaryPreference")
    .trim()
    .notEmpty()
    .withMessage("Dietary preference is required")
    .isIn([
      "Non-Vegetarian",
      "Vegetarian",
      "Vegan",
      "Pescatarian",
      "Halal only",
    ])
    .withMessage("Invalid dietary preference"),

  body("dislikedFoods")
    .optional()
    .isArray()
    .withMessage("Disliked foods must be an array"),

  body("activityLevel")
    .trim()
    .notEmpty()
    .withMessage("Activity level is required")
    .isIn([
      "Sedentary",
      "Lightly Active",
      "Moderately Active",
      "Very Active",
      "Athlete",
    ])
    .withMessage("Invalid activity level"),

  body("occupation").optional().trim(),

  body("sleepHours")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Sleep hours must be between 1 and 12"),

  body("sleepQuality")
    .optional()
    .isIn(["Poor", "Fair", "Good", "Excellent"])
    .withMessage("Invalid sleep quality"),

  body("waterIntake")
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage("Water intake must be between 0 and 20 glasses"),

  body("primaryGoal")
    .trim()
    .notEmpty()
    .withMessage("Primary goal is required")
    .isIn([
      "Weight Loss",
      "Weight Gain",
      "Muscle Building",
      "Maintenance",
      "Disease Management",
      "Improved Energy",
      "Better Digestion",
      "Overall Health",
    ])
    .withMessage("Invalid primary goal"),

  body("timeline").optional().trim(),

  body("mealsPerDay")
    .optional()
    .isInt({ min: 2, max: 6 })
    .withMessage("Meals per day must be between 2 and 6"),

  body("regionalPreference").optional().trim(),

  body("fastingRequirements")
    .optional()
    .isBoolean()
    .withMessage("Fasting requirements must be a boolean"),

  body("monthlyBudget")
    .optional()
    .isInt({ min: 1000 })
    .withMessage("Monthly budget must be at least 1000 PKR"),

  body("cookingSkill")
    .optional()
    .isIn(["Beginner", "Intermediate", "Advanced", "Have a cook"])
    .withMessage("Invalid cooking skill"),

  body("maxPrepTime")
    .optional()
    .isInt({ min: 10, max: 180 })
    .withMessage("Max prep time must be between 10 and 180 minutes"),

  body("eatingOutFrequency").optional().trim(),

  body("city").optional().trim(),

  body("currentHabits")
    .optional()
    .isObject()
    .withMessage("Current habits must be an object"),
];

export const generateMealPlanValidation = [
  body("duration")
    .trim()
    .notEmpty()
    .withMessage("Duration is required")
    .isIn(["7"])
    .withMessage("Duration must be 7 days"),
];
