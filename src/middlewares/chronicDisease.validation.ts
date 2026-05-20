import { body, query } from "express-validator";

export const createConditionValidation = [
  body("condition")
    .trim()
    .notEmpty()
    .withMessage("Condition is required")
    .isLength({ max: 100 })
    .withMessage("Condition must be at most 100 characters"),
  body("diagnosedAt")
    .optional()
    .isISO8601()
    .withMessage("Diagnosed date must be a valid ISO 8601 date"),
  body("severity")
    .optional()
    .trim()
    .customSanitizer((value: string) => value.toLowerCase())
    .isIn(["mild", "moderate", "severe"])
    .withMessage("Severity must be one of: mild, moderate, severe"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Notes must be at most 2000 characters"),
];

export const createLogValidation = [
  body("conditionId")
    .optional()
    .isUUID()
    .withMessage("Condition ID must be a valid UUID"),
  body("logDate")
    .optional()
    .isISO8601()
    .withMessage("Log date must be a valid ISO 8601 date"),
  body("symptoms")
    .optional()
    .isArray()
    .withMessage("Symptoms must be an array of strings"),
  body("painLevel")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Pain level must be between 0 and 10"),
  body("painLocation")
    .optional()
    .isArray()
    .withMessage("Pain location must be an array of strings"),
  body("mobilityIssues")
    .optional()
    .isArray()
    .withMessage("Mobility issues must be an array of strings"),
  body("fatigueLevel")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Fatigue level must be between 0 and 10"),
  body("bloodPressureSystolic")
    .optional()
    .isInt({ min: 50, max: 250 })
    .withMessage("Systolic BP must be between 50 and 250"),
  body("bloodPressureDiastolic")
    .optional()
    .isInt({ min: 30, max: 150 })
    .withMessage("Diastolic BP must be between 30 and 150"),
  body("bloodSugar")
    .optional()
    .isFloat({ min: 20, max: 600 })
    .withMessage("Blood sugar must be between 20 and 600 mg/dL"),
  body("heartRate")
    .optional()
    .isInt({ min: 30, max: 250 })
    .withMessage("Heart rate must be between 30 and 250 bpm"),
  body("oxygenLevel")
    .optional()
    .isFloat({ min: 50, max: 100 })
    .withMessage("Oxygen level must be between 50 and 100%"),
  body("weight")
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage("Weight must be between 1 and 500 kg"),
  body("temperature")
    .optional()
    .isFloat({ min: 30, max: 45 })
    .withMessage("Temperature must be between 30 and 45°C"),
  body("medicationTaken")
    .optional()
    .isArray()
    .withMessage("Medication taken must be an array"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Notes must be at most 2000 characters"),
];

export const getLogsValidation = [
  query("from")
    .optional()
    .isISO8601()
    .withMessage("From date must be a valid ISO 8601 date"),
  query("to")
    .optional()
    .isISO8601()
    .withMessage("To date must be a valid ISO 8601 date"),
  query("conditionId")
    .optional()
    .isUUID()
    .withMessage("Condition ID must be a valid UUID"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

export const reportDateRangeValidation = [
  body("from")
    .notEmpty()
    .withMessage("From date is required")
    .isISO8601()
    .withMessage("From date must be a valid ISO 8601 date"),
  body("to")
    .notEmpty()
    .withMessage("To date is required")
    .isISO8601()
    .withMessage("To date must be a valid ISO 8601 date"),
];
