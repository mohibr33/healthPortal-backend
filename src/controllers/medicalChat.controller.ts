import { Request, Response, NextFunction, RequestHandler } from "express";
import { IAuthRequest } from "../types/user.types";
import medicalChatService from "../services/medicalChat.service";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/chat");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for documents and images (for message attachments)
const documentFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = /\.(jpeg|jpg|png|pdf|doc|docx|txt)$/i;
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg', 
    'image/png',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const extname = allowedExtensions.test(file.originalname.toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: images (jpg, png), documents (pdf, doc, docx, txt). Received: ${file.mimetype}`));
  }
};

// File filter for audio files (for voice messages)
const audioFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = /\.(mp3|wav|webm|ogg|m4a)$/i;
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
  ];

  const extname = allowedExtensions.test(file.originalname.toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error(`Invalid audio file type. Allowed: mp3, wav, webm, ogg, m4a. Received: ${file.mimetype}`));
  }
};

// Middleware for multiple file uploads (up to 5 files)
export const uploadFiles: RequestHandler = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFileFilter,
}).array('files', 5) as RequestHandler;

// Middleware for single audio file upload
export const uploadAudio: RequestHandler = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: audioFileFilter,
}).single('audio') as RequestHandler;

// Legacy middleware (deprecated)
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

// Create new chat session
export const createChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { firstMessage } = req.body;

    const chat = await medicalChatService.createChat(userId, firstMessage);

    res.status(201).json({
      success: true,
      message: "Chat session created successfully",
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's chat sessions
export const getUserChats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const { chats, total } = await medicalChatService.getUserChats(
      userId,
      skip,
      limit,
      status
    );

    res.status(200).json({
      success: true,
      data: {
        chats,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single chat with messages
export const getChatById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { chatId } = req.params;

    const chat = await medicalChatService.getChatById(chatId, userId);

    if (!chat) {
      res.status(404).json({
        success: false,
        message: "Chat not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

// Send text message with optional file attachments
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: "Message content is required",
      });
      return;
    }

    // Get uploaded files (if any)
    const files = req.files as Express.Multer.File[] | undefined;
    const fileAttachments = files?.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/chat/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
    }));

    const result = await medicalChatService.sendMessage(
      chatId,
      userId,
      message.trim(),
      "text",
      undefined,
      undefined,
      fileAttachments
    );

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message === "Chat not found or access denied") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// Send voice message
export const sendVoiceMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { chatId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
      return;
    }

    // Read audio file
    const audioBuffer = fs.readFileSync(file.path);

    // Transcribe audio
    const transcription = await medicalChatService.transcribeAudio(
      audioBuffer,
      file.originalname
    );

    // Generate audio URL (you can replace this with cloud storage URL)
    const audioUrl = `/uploads/chat/${file.filename}`;
    const audioDuration = 0; // You can use ffprobe to get actual duration

    // Send message with transcription
    const result = await medicalChatService.sendMessage(
      chatId,
      userId,
      transcription,
      "voice",
      audioUrl,
      audioDuration
    );

    res.status(200).json({
      success: true,
      message: "Voice message sent successfully",
      data: {
        ...result,
        transcription,
        audioUrl,
      },
    });
  } catch (error: any) {
    if (error.message === "Chat not found or access denied") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// DEPRECATED: Upload file attachment
// Use POST /api/medical-chat/:chatId/messages with files instead
export const uploadAttachment = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.status(410).json({
    success: false,
    message: "This endpoint is deprecated. Please use POST /api/medical-chat/:chatId/messages with 'files' in the request body instead.",
  });
};

// Update chat status
export const updateChatStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { chatId } = req.params;
    const { status } = req.body;

    if (!["active", "archived"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'active' or 'archived'",
      });
      return;
    }

    await medicalChatService.updateChatStatus(chatId, userId, status);

    res.status(200).json({
      success: true,
      message: `Chat ${status} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Delete chat
export const deleteChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { chatId } = req.params;

    await medicalChatService.deleteChat(chatId, userId);

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get chat statistics
export const getChatStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;

    const stats = await medicalChatService.getChatStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
