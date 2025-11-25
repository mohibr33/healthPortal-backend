export interface IReview {
  id: string;
  userId: string;
  medicineId: string;
  rating: number;
  message: string;
  isApproved: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  medicine?: {
    id: string;
    title: string;
    slug: string;
    brand: string;
  };
}

export interface ICreateReviewInput {
  medicineId: string;
  rating: number;
  message: string;
}

export interface IUpdateReviewInput {
  rating?: number;
  message?: string;
}

export interface IReviewFilters {
  userId?: string;
  medicineId?: string;
  rating?: number;
  isApproved?: boolean;
  isPublished?: boolean;
}
