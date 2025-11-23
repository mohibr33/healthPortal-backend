import { body } from "express-validator";

export const createTicketValidation = [
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ min: 5, max: 255 })
    .withMessage("Subject must be between 5 and 255 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),

  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
];

export const resolveTicketValidation = [
  body("resolutionNote")
    .trim()
    .notEmpty()
    .withMessage("Resolution note is required")
    .isLength({ min: 10 })
    .withMessage("Resolution note must be at least 10 characters long"),
];
