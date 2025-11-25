import { Request, Response, NextFunction } from "express";
import reviewService from "../services/review.service";
import { IAuthRequest } from "../types/user.types";

// Create a new review
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { medicineId, rating, message } = req.body;

    const review = await reviewService.createReview(userId, {
      medicineId,
      rating,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  } catch (error: any) {
    if (
      error.message === "You have already reviewed this medicine" ||
      error.message === "Medicine not found"
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// Get all published reviews (public)
export const getPublishedReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const medicineId = req.query.medicineId as string | undefined;

    const { reviews, total, averageRating } =
      await reviewService.getPublishedReviews(skip, limit, medicineId);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating,
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

// Get reviews for a specific medicine (public)
export const getMedicineReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { medicineId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { reviews, total, averageRating } =
      await reviewService.getMedicineReviews(medicineId, skip, limit);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating,
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

// Get user's own reviews
export const getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { reviews, total } = await reviewService.getUserReviews(
      userId,
      skip,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        reviews,
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

// Get review by ID
export const getReviewById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// Update user's own review
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { id } = req.params;
    const { rating, message } = req.body;

    const review = await reviewService.updateReview(id, userId, {
      rating,
      message,
    });

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error: any) {
    if (error.message === "Review not found or unauthorized") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// Delete user's own review
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { id } = req.params;

    await reviewService.deleteReview(id, userId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Review not found or unauthorized") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// Admin: Get all reviews with filters
export const getAllReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = {};
    if (req.query.medicineId)
      filters.medicineId = req.query.medicineId as string;
    if (req.query.rating) filters.rating = parseInt(req.query.rating as string);
    if (req.query.isApproved !== undefined)
      filters.isApproved = req.query.isApproved === "true";
    if (req.query.isPublished !== undefined)
      filters.isPublished = req.query.isPublished === "true";

    const orderBy =
      (req.query.orderBy as "createdAt" | "rating") || "createdAt";
    const order = (req.query.order as "asc" | "desc") || "desc";

    const { reviews, total } = await reviewService.getReviews(
      filters,
      skip,
      limit,
      orderBy,
      order
    );

    res.status(200).json({
      success: true,
      data: {
        reviews,
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

// Admin: Update review approval status
export const updateReviewApproval = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await reviewService.updateReviewApproval(id, isApproved);

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? "approved" : "rejected"} successfully`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update review publish status
export const updateReviewPublishStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const review = await reviewService.updateReviewPublishStatus(
      id,
      isPublished
    );

    res.status(200).json({
      success: true,
      message: `Review ${
        isPublished ? "published" : "unpublished"
      } successfully`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete any review
export const adminDeleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await reviewService.adminDeleteReview(id);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get review statistics
export const getReviewStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await reviewService.getReviewStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
