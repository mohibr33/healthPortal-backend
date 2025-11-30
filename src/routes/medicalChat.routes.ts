import { Router } from "express";
import * as medicalChatController from "../controllers/medicalChat.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  createChatValidation,
  sendMessageValidation,
  sendVoiceMessageValidation,
  updateChatStatusValidation,
  chatIdValidation,
} from "../middlewares/medicalChat.validation";
import { validateRequest } from "../middlewares/validation.middleware";

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// Chat session management
router.post(
  "/",
  createChatValidation,
  validateRequest,
  medicalChatController.createChat
);

router.get("/", medicalChatController.getUserChats);

router.get(
  "/stats",
  medicalChatController.getChatStats
);

router.get(
  "/:chatId",
  chatIdValidation,
  validateRequest,
  medicalChatController.getChatById
);

router.patch(
  "/:chatId/status",
  updateChatStatusValidation,
  validateRequest,
  medicalChatController.updateChatStatus
);

router.delete(
  "/:chatId",
  chatIdValidation,
  validateRequest,
  medicalChatController.deleteChat
);

// Messaging
router.post(
  "/:chatId/messages",
  medicalChatController.uploadFiles, // Handle multiple file uploads
  sendMessageValidation,
  validateRequest,
  medicalChatController.sendMessage
);

router.post(
  "/:chatId/voice",
  medicalChatController.uploadAudio, // Single audio file upload
  sendVoiceMessageValidation,
  validateRequest,
  medicalChatController.sendVoiceMessage
);

// DEPRECATED: Use POST /:chatId/messages with files instead
router.post(
  "/:chatId/messages/:messageId/attachments",
  medicalChatController.uploadAttachment
);

export default router;
