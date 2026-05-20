import { body, param, query } from "express-validator";

export const createPostValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title must be at most 200 characters"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 1, max: 5000 })
    .withMessage("Content must be between 1 and 5000 characters"),
  body("category")
    .optional()
    .isIn(["stress", "anxiety", "studies", "work_pressure", "general"])
    .withMessage("Invalid category"),
  body("isAnonymous")
    .optional()
    .isBoolean()
    .withMessage("isAnonymous must be a boolean"),
];

export const addCommentValidation = [
  param("postId").isUUID().withMessage("Invalid post ID"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment must be between 1 and 2000 characters"),
  body("isAnonymous")
    .optional()
    .isBoolean()
    .withMessage("isAnonymous must be a boolean"),
  body("parentId")
    .optional()
    .isUUID()
    .withMessage("Invalid parent comment ID"),
];

export const addReactionValidation = [
  param("postId").isUUID().withMessage("Invalid post ID"),
  body("reaction")
    .isIn(["supportive", "empathetic", "grateful", "hopeful", "thoughtful", "encouraging"])
    .withMessage("Invalid reaction type"),
];

export const postIdValidation = [
  param("postId").isUUID().withMessage("Invalid post ID"),
];

export const commentIdValidation = [
  param("commentId").isUUID().withMessage("Invalid comment ID"),
];

export const listPostsValidation = [
  query("category")
    .optional()
    .isIn(["stress", "anxiety", "studies", "work_pressure", "general"])
    .withMessage("Invalid category filter"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Search must be at most 200 characters"),
];
