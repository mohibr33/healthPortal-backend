import { body, ValidationChain } from "express-validator";

export const createArticleValidation: ValidationChain[] = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),

  body("imageUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Image URL must be a valid URL"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),

  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("Short description is required")
    .isLength({ min: 10, max: 300 })
    .withMessage("Short description must be between 10 and 300 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 50 })
    .withMessage("Content must be at least 50 characters"),

  body("sourceLink")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Short link must not exceed 100 characters"),
];

export const updateArticleValidation: ValidationChain[] = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),

  body("imageUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Image URL must be a valid URL"),

  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage("Short description must be between 10 and 300 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 50 })
    .withMessage("Content must be at least 50 characters"),

  body("sourceLink")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Short link must not exceed 100 characters"),
];
