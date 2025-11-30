import { body, ValidationChain, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

// Validation middleware to handle errors
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  next();
};

export const registerValidation: ValidationChain[] = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),

  body("phone")
    .optional()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Phone number must be between 10 and 15 digits"),
];

export const loginValidation: ValidationChain[] = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

export const verifyOTPValidation: ValidationChain[] = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email")
    .normalizeEmail(),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),
];

export const updateProfileValidation: ValidationChain[] = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),

  body("phone")
    .optional()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Phone number must be between 10 and 15 digits"),
];

export const resetPasswordValidation: ValidationChain[] = [
  body("otp")
    .notEmpty()
    .withMessage("OTP is required"), // change message to match field

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];