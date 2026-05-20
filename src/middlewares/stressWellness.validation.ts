import { body, param, query } from "express-validator";

export const createMoodEntryValidation = [
  body("mood")
    .isIn(["very_bad", "bad", "neutral", "good", "very_good"])
    .withMessage("Mood must be one of: very_bad, bad, neutral, good, very_good"),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Note must be at most 1000 characters"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),
];

export const createStressAssessmentValidation = [
  body("answers")
    .isArray({ min: 1 })
    .withMessage("Answers must be a non-empty array"),
  body("answers.*.question")
    .trim()
    .notEmpty()
    .withMessage("Each answer must have a question"),
  body("answers.*.answer")
    .isInt({ min: 0, max: 5 })
    .withMessage("Each answer must be an integer between 0 and 5"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),
];

export const createScreeningValidation = [
  body("testType")
    .isIn(["phq9", "gad7"])
    .withMessage("Test type must be either 'phq9' or 'gad7'"),
  body("answers")
    .isArray({ min: 1 })
    .withMessage("Answers must be a non-empty array"),
  body("answers.*.question")
    .trim()
    .notEmpty()
    .withMessage("Each answer must have a question"),
  body("answers.*.answer")
    .isInt({ min: 0, max: 3 })
    .withMessage("Each answer must be an integer between 0 and 3"),
];

export const createJournalEntryValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title must be at most 200 characters"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 1, max: 10000 })
    .withMessage("Content must be between 1 and 10000 characters"),
  body("isAnonymous")
    .optional()
    .isBoolean()
    .withMessage("isAnonymous must be a boolean"),
];

export const journalEntryIdValidation = [
  param("entryId").isUUID().withMessage("Invalid journal entry ID"),
];

export const createMeditationSessionValidation = [
  body("type")
    .isIn(["guided_meditation", "breathing", "relaxation", "stress_relief"])
    .withMessage("Invalid meditation type"),
  body("duration")
    .isInt({ min: 10 })
    .withMessage("Duration must be at least 10 seconds"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title must be at most 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be at most 2000 characters"),
  body("audioUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Audio URL must be a valid URL"),
  body("completedAt")
    .optional()
    .isISO8601()
    .withMessage("Completed date must be a valid ISO 8601 date"),
];

export const createResourceValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 300 })
    .withMessage("Title must be at most 300 characters"),
  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Slug is required")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug must contain only lowercase letters, numbers, and hyphens"),
  body("category")
    .isIn(["mental_health", "stress_management", "self_care", "healthy_lifestyle"])
    .withMessage("Invalid resource category"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required"),
  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Excerpt must be at most 500 characters"),
  body("imageUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Image URL must be a valid URL"),
  body("author")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Author must be at most 100 characters"),
  body("readTime")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Read time must be a positive integer"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array of strings"),
  body("sourceLink")
    .optional()
    .trim()
    .isURL()
    .withMessage("Source link must be a valid URL"),
];

export const resourceSlugValidation = [
  param("slug")
    .trim()
    .notEmpty()
    .withMessage("Resource slug is required"),
];

export const resourceIdValidation = [
  param("resourceId").isUUID().withMessage("Invalid resource ID"),
];

export const listResourcesValidation = [
  query("category")
    .optional()
    .isIn(["mental_health", "stress_management", "self_care", "healthy_lifestyle"])
    .withMessage("Invalid category filter"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Search must be at most 200 characters"),
];

export const moodHistoryValidation = [
  query("days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Days must be between 1 and 365"),
];
