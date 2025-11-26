import { Router } from "express";
import {
  createReview,
  getPublishedReviews,
  getMedicineReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getAllReviews,
  updateReviewApproval,
  updateReviewPublishStatus,
  adminDeleteReview,
  getReviewStats,
} from "../controllers/review.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import {
  validateCreateReview,
  validateUpdateReview,
  validateReviewId,
  validateUpdateApproval,
  validateUpdatePublishStatus,
  validateReviewFilters,
} from "../middlewares/review.validation";

const router: Router = Router();

// Public routes
router.get("/published", getPublishedReviews);
router.get("/medicine/:medicineId", getMedicineReviews);
router.get("/:id", validateReviewId, getReviewById);

// Protected user routes
router.post("/", authenticateToken, validateCreateReview, createReview);
router.get("/my/reviews", authenticateToken, getMyReviews);
router.put("/:id", authenticateToken, validateUpdateReview, updateReview);
router.delete("/:id", authenticateToken, validateReviewId, deleteReview);

// Admin routes
router.get(
  "/admin/all",
  authenticateToken,
  isAdmin,
  validateReviewFilters,
  getAllReviews
);
router.get("/admin/stats", authenticateToken, isAdmin, getReviewStats);
router.patch(
  "/admin/:id/approve",
  authenticateToken,
  isAdmin,
  validateUpdateApproval,
  updateReviewApproval
);
router.patch(
  "/admin/:id/publish",
  authenticateToken,
  isAdmin,
  validateUpdatePublishStatus,
  updateReviewPublishStatus
);
router.delete(
  "/admin/:id",
  authenticateToken,
  isAdmin,
  validateReviewId,
  adminDeleteReview
);

export default router;
