import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

// Validation middleware to handle errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return;
  }
  next();
};

// Create review validation
export const validateCreateReview = [
  body("medicineId").isUUID().withMessage("Valid medicine ID is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("message")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Message must be between 10 and 1000 characters"),
  handleValidationErrors,
];

// Update review validation
export const validateUpdateReview = [
  param("id").isUUID().withMessage("Invalid review ID"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("message")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Message must be between 10 and 1000 characters"),
  handleValidationErrors,
];

// Get review by ID validation
export const validateReviewId = [
  param("id").isUUID().withMessage("Invalid review ID"),
  handleValidationErrors,
];

// Update approval status validation
export const validateUpdateApproval = [
  param("id").isUUID().withMessage("Invalid review ID"),
  body("isApproved")
    .isBoolean()
    .withMessage("isApproved must be a boolean value"),
  handleValidationErrors,
];

// Update publish status validation
export const validateUpdatePublishStatus = [
  param("id").isUUID().withMessage("Invalid review ID"),
  body("isPublished")
    .isBoolean()
    .withMessage("isPublished must be a boolean value"),
  handleValidationErrors,
];

// Query validation for filtering reviews
export const validateReviewFilters = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("medicineId").optional().isUUID().withMessage("Invalid medicine ID"),
  query("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  query("isApproved")
    .optional()
    .isBoolean()
    .withMessage("isApproved must be a boolean"),
  query("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),
  query("orderBy")
    .optional()
    .isIn(["createdAt", "rating"])
    .withMessage("orderBy must be either createdAt or rating"),
  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("order must be either asc or desc"),
  handleValidationErrors,
];
