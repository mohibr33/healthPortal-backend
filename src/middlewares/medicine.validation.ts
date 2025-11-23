import { body } from "express-validator";

export const createMedicineValidation = [
  body("productId").trim().notEmpty().withMessage("Product ID is required"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters long"),

  body("productImage")
    .optional()
    .trim()
    .isURL()
    .withMessage("Product image must be a valid URL"),

  body("brand").optional().trim(),

  body("usedFor").optional().trim(),

  body("childCategory").optional().trim(),

  body("howItWorks").optional().trim(),

  body("description").optional().trim(),

  body("generics").optional().trim(),

  body("indication").optional().trim(),

  body("sideEffects").optional().trim(),

  body("whenNotToUse").optional().trim(),

  body("dosage").optional().trim(),

  body("storage").optional().trim(),

  body("precautions").optional().trim(),

  body("warning1").optional().trim(),

  body("warning2").optional().trim(),

  body("warning3").optional().trim(),

  body("pregnancyCategory").optional().trim(),

  body("drugInteractions").optional().trim(),

  body("requiresPrescription")
    .optional()
    .isBoolean()
    .withMessage("Requires prescription must be a boolean value"),
];

export const updateMedicineValidation = [
  body("productId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product ID cannot be empty"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters long"),

  body("productImage")
    .optional()
    .trim()
    .isURL()
    .withMessage("Product image must be a valid URL"),

  body("brand").optional().trim(),

  body("usedFor").optional().trim(),

  body("childCategory").optional().trim(),

  body("howItWorks").optional().trim(),

  body("description").optional().trim(),

  body("generics").optional().trim(),

  body("indication").optional().trim(),

  body("sideEffects").optional().trim(),

  body("whenNotToUse").optional().trim(),

  body("dosage").optional().trim(),

  body("storage").optional().trim(),

  body("precautions").optional().trim(),

  body("warning1").optional().trim(),

  body("warning2").optional().trim(),

  body("warning3").optional().trim(),

  body("pregnancyCategory").optional().trim(),

  body("drugInteractions").optional().trim(),

  body("requiresPrescription")
    .optional()
    .isBoolean()
    .withMessage("Requires prescription must be a boolean value"),
];
