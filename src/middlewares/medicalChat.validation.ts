import { body, param } from "express-validator";

export const createChatValidation = [
  body("firstMessage")
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("First message must be between 1 and 2000 characters"),
];

export const sendMessageValidation = [
  param("chatId").isUUID().withMessage("Invalid chat ID"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Message must be between 1 and 2000 characters"),
];

export const sendVoiceMessageValidation = [
  param("chatId").isUUID().withMessage("Invalid chat ID"),
];

export const uploadAttachmentValidation = [
  param("chatId").isUUID().withMessage("Invalid chat ID"),
  param("messageId").isUUID().withMessage("Invalid message ID"),
];

export const updateChatStatusValidation = [
  param("chatId").isUUID().withMessage("Invalid chat ID"),
  body("status")
    .isIn(["active", "archived"])
    .withMessage("Status must be either 'active' or 'archived'"),
];

export const chatIdValidation = [
  param("chatId").isUUID().withMessage("Invalid chat ID"),
];
