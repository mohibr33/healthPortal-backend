import { Request, Response, NextFunction } from "express";
import { IAuthRequest } from "../types/user.types";
import communityService from "../services/community.service";

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const post = await communityService.createPost(userId, req.body);
    res.status(201).json({ success: true, message: "Post created", data: post });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { category, page, limit, search } = req.query;
    const result = await communityService.getPosts({
      category: category as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      userId,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { postId } = req.params;
    const post = await communityService.getPostById(postId, userId);
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { postId } = req.params;
    await communityService.deletePost(postId, userId);
    res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { postId } = req.params;
    const comment = await communityService.addComment(postId, userId, req.body);
    res.status(201).json({ success: true, message: "Comment added", data: comment });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { commentId } = req.params;
    await communityService.deleteComment(commentId, userId);
    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    const comments = await communityService.getComments(postId);
    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

export const toggleReaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { postId } = req.params;
    const result = await communityService.toggleReaction(postId, userId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getCommunityStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const stats = await communityService.getCommunityStats(userId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
