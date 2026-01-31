import express, { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import labReportController from "../controllers/labReport.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { uploadLabReportValidation, shareLabReportValidation } from "../middlewares/labReport.validation";

const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = req.validationErrors;
  if (errors && errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }
  next();
};

const router: Router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `lab-report-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/tiff",
      "image/webp",
      "application/pdf",
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and PDFs are allowed."));
    }
  },
});

// All routes require authentication
router.use(authMiddleware);

// Upload lab report
router.post(
  "/upload",
  upload.single("file"),
  uploadLabReportValidation,
  handleValidationErrors,
  labReportController.uploadLabReport
);

// Get all lab reports for user
router.get("/", labReportController.getLabReports);

// Get trend data for a biomarker (must come before /:id)
router.get("/trend/:biomarker", labReportController.getTrendData);

// Get lab report by ID
router.get("/:id", labReportController.getLabReportById);

// Share lab report with doctor
router.post(
  "/:id/share",
  shareLabReportValidation,
  handleValidationErrors,
  labReportController.shareLabReport
);

// Delete lab report
router.delete("/:id", labReportController.deleteLabReport);

export default router;
