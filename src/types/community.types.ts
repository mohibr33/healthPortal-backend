import { Request } from "express";
import { PostCategory, PostReaction } from "@prisma/client";

export interface IAuthRequest extends Request {
  userId?: string;
  email?: string;
}

export interface ICreatePostDTO {
  title?: string;
  content: string;
  category?: PostCategory;
  isAnonymous?: boolean;
}

export interface IUpdatePostDTO {
  title?: string;
  content?: string;
  category?: PostCategory;
}

export interface IAddCommentDTO {
  content: string;
  isAnonymous?: boolean;
  parentId?: string;
}

export interface IAddReactionDTO {
  reaction: PostReaction;
}

export interface IPostResponse {
  id: string;
  userId: string | null;
  title: string | null;
  content: string;
  category: PostCategory;
  isAnonymous: boolean;
  reactionCount: number;
  commentCount: number;
  userReaction?: PostReaction | null;
  comments?: ICommentResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentResponse {
  id: string;
  postId: string;
  userId: string | null;
  parentId: string | null;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
  replies?: ICommentResponse[];
}

export interface IReactionResponse {
  id: string;
  postId: string;
  userId: string;
  reaction: PostReaction;
}

export interface IPostsListResponse {
  posts: IPostResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ICommunityStats {
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  myPosts: number;
  categoryBreakdown: Record<string, number>;
}
