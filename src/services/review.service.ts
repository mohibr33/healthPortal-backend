import prisma from "../config/database";
import {
  IReview,
  ICreateReviewInput,
  IUpdateReviewInput,
  IReviewFilters,
} from "../types/review.types";

class ReviewService {
  // Create a new review
  async createReview(
    userId: string,
    data: ICreateReviewInput
  ): Promise<IReview> {
    // Check if user already reviewed this medicine
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_medicineId: {
          userId,
          medicineId: data.medicineId,
        },
      },
    });

    if (existingReview) {
      throw new Error("You have already reviewed this medicine");
    }

    // Check if medicine exists
    const medicine = await prisma.medicine.findUnique({
      where: { id: data.medicineId },
    });

    if (!medicine) {
      throw new Error("Medicine not found");
    }

    const review = await prisma.review.create({
      data: {
        userId,
        medicineId: data.medicineId,
        rating: data.rating,
        message: data.message,
        isApproved: true, // Auto-approve by default
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        medicine: {
          select: {
            id: true,
            title: true,
            slug: true,
            brand: true,
          },
        },
      },
    });

    return review as IReview;
  }

  // Get all reviews with filters and pagination
  async getReviews(
    filters: IReviewFilters = {},
    skip: number = 0,
    take: number = 10,
    orderBy: "createdAt" | "rating" = "createdAt",
    order: "asc" | "desc" = "desc"
  ): Promise<{ reviews: IReview[]; total: number }> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.medicineId) where.medicineId = filters.medicineId;
    if (filters.rating !== undefined) where.rating = filters.rating;
    if (filters.isApproved !== undefined) where.isApproved = filters.isApproved;
    if (filters.isPublished !== undefined)
      where.isPublished = filters.isPublished;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { [orderBy]: order },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          medicine: {
            select: {
              id: true,
              title: true,
              slug: true,
              brand: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return { reviews: reviews as IReview[], total };
  }

  // Get published and approved reviews (for public display)
  async getPublishedReviews(
    skip: number = 0,
    take: number = 10,
    medicineId?: string
  ): Promise<{ reviews: IReview[]; total: number; averageRating: number }> {
    const where: any = {
      isPublished: true,
      isApproved: true,
    };

    if (medicineId) {
      where.medicineId = medicineId;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          medicine: {
            select: {
              id: true,
              title: true,
              slug: true,
              brand: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    // Calculate average rating
    const ratingStats = await prisma.review.aggregate({
      where,
      _avg: {
        rating: true,
      },
    });

    const averageRating = ratingStats._avg.rating || 0;

    return {
      reviews: reviews as IReview[],
      total,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  // Get reviews for a specific medicine
  async getMedicineReviews(
    medicineId: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ reviews: IReview[]; total: number; averageRating: number }> {
    return this.getPublishedReviews(skip, take, medicineId);
  }

  // Get review by ID
  async getReviewById(id: string): Promise<IReview | null> {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        medicine: {
          select: {
            id: true,
            title: true,
            slug: true,
            brand: true,
          },
        },
      },
    });

    return review as IReview | null;
  }

  // Get user's own reviews
  async getUserReviews(
    userId: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ reviews: IReview[]; total: number }> {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          medicine: {
            select: {
              id: true,
              title: true,
              slug: true,
              brand: true,
            },
          },
        },
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    return { reviews: reviews as IReview[], total };
  }

  // Update review (only by the user who created it)
  async updateReview(
    id: string,
    userId: string,
    data: IUpdateReviewInput
  ): Promise<IReview> {
    // First check if review belongs to user
    const existingReview = await prisma.review.findFirst({
      where: { id, userId },
    });

    if (!existingReview) {
      throw new Error("Review not found or unauthorized");
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.message !== undefined && { message: data.message }),
        // Keep auto-approved when updated
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        medicine: {
          select: {
            id: true,
            title: true,
            slug: true,
            brand: true,
          },
        },
      },
    });

    return review as IReview;
  }

  // Delete review (only by the user who created it)
  async deleteReview(id: string, userId: string): Promise<void> {
    const existingReview = await prisma.review.findFirst({
      where: { id, userId },
    });

    if (!existingReview) {
      throw new Error("Review not found or unauthorized");
    }

    await prisma.review.delete({
      where: { id },
    });
  }

  // Admin: Approve/reject review
  async updateReviewApproval(
    id: string,
    isApproved: boolean
  ): Promise<IReview> {
    const review = await prisma.review.update({
      where: { id },
      data: { isApproved },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        medicine: {
          select: {
            id: true,
            title: true,
            slug: true,
            brand: true,
          },
        },
      },
    });

    return review as IReview;
  }

  // Admin: Publish/unpublish review
  async updateReviewPublishStatus(
    id: string,
    isPublished: boolean
  ): Promise<IReview> {
    const review = await prisma.review.update({
      where: { id },
      data: { isPublished },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        medicine: {
          select: {
            id: true,
            title: true,
            slug: true,
            brand: true,
          },
        },
      },
    });

    return review as IReview;
  }

  // Admin: Delete any review
  async adminDeleteReview(id: string): Promise<void> {
    await prisma.review.delete({
      where: { id },
    });
  }

  // Get review statistics
  async getReviewStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const [total, approved, pending, ratingStats, allReviews] =
      await Promise.all([
        prisma.review.count(),
        prisma.review.count({ where: { isApproved: true } }),
        prisma.review.count({ where: { isApproved: false } }),
        prisma.review.aggregate({
          _avg: {
            rating: true,
          },
        }),
        prisma.review.findMany({
          select: {
            rating: true,
          },
        }),
      ]);

    // Calculate rating distribution
    const ratingDistribution: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    allReviews.forEach((review) => {
      ratingDistribution[review.rating]++;
    });

    return {
      total,
      approved,
      pending,
      averageRating: Math.round((ratingStats._avg.rating || 0) * 10) / 10,
      ratingDistribution,
    };
  }
}

export default new ReviewService();
