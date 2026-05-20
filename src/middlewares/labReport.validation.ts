import { body } from "express-validator";

export const uploadLabReportValidation = [
  body("title").optional().trim().isLength({ max: 255 }).withMessage("Title must be less than 255 characters"),
  body("testDate").optional().isISO8601().withMessage("Test date must be a valid date"),
  body("labName").optional().trim().isLength({ max: 255 }).withMessage("Lab name must be less than 255 characters"),
];

export const shareLabReportValidation = [
  body("doctorEmail").isEmail().withMessage("Valid doctor email is required"),
];

export const getTrendDataValidation = [
  body("biomarker").notEmpty().withMessage("Biomarker name is required"),
];
