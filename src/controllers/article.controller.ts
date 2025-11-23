import { Request, Response } from "express";
import articleService from "../services/article.service";
import { IAuthRequest } from "../types/user.types";

class ArticleController {
  // Create article (Admin only)
  async createArticle(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as IAuthRequest).userId!;
      const {
        title,
        imageUrl,
        category,
        shortDescription,
        content,
        sourceLink,
      } = req.body;

      const article = await articleService.createArticle(
        {
          title,
          imageUrl,
          category,
          shortDescription,
          content,
          sourceLink,
        },
        userId
      );

      return res.status(201).json({
        success: true,
        message: "Article created successfully",
        data: { article },
      });
    } catch (error: any) {
      console.error("Create article error:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating article",
        error: error.message,
      });
    }
  }

  // Get all articles (Public)
  async getAllArticles(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string | undefined;
      const skip = (page - 1) * limit;

      const result = await articleService.getAllArticles(skip, limit, category);

      return res.status(200).json({
        success: true,
        data: {
          articles: result.articles,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Get all articles error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching articles",
        error: error.message,
      });
    }
  }

  // Get article by slug (Public)
  async getArticleBySlug(req: Request, res: Response): Promise<Response> {
    try {
      const { slug } = req.params;

      const article = await articleService.findArticleBySlug(slug);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: "Article not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: { article },
      });
    } catch (error: any) {
      console.error("Get article by slug error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching article",
        error: error.message,
      });
    }
  }

  // Get article by ID (Admin)
  async getArticleById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const article = await articleService.findArticleById(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: "Article not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: { article },
      });
    } catch (error: any) {
      console.error("Get article by ID error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching article",
        error: error.message,
      });
    }
  }

  // Update article (Admin only)
  async updateArticle(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const {
        title,
        imageUrl,
        category,
        shortDescription,
        content,
        sourceLink,
      } = req.body;

      // Check if article exists
      const existingArticle = await articleService.findArticleById(id);
      if (!existingArticle) {
        return res.status(404).json({
          success: false,
          message: "Article not found",
        });
      }

      const article = await articleService.updateArticle(id, {
        title,
        imageUrl,
        category,
        shortDescription,
        content,
        sourceLink,
      });

      return res.status(200).json({
        success: true,
        message: "Article updated successfully",
        data: { article },
      });
    } catch (error: any) {
      console.error("Update article error:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating article",
        error: error.message,
      });
    }
  }

  // Delete article (Admin only)
  async deleteArticle(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      // Check if article exists
      const existingArticle = await articleService.findArticleById(id);
      if (!existingArticle) {
        return res.status(404).json({
          success: false,
          message: "Article not found",
        });
      }

      await articleService.deleteArticle(id);

      return res.status(200).json({
        success: true,
        message: "Article deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete article error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting article",
        error: error.message,
      });
    }
  }

  // Search articles (Public)
  async searchArticles(req: Request, res: Response): Promise<Response> {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const result = await articleService.searchArticles(query, skip, limit);

      return res.status(200).json({
        success: true,
        data: {
          articles: result.articles,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Search articles error:", error);
      return res.status(500).json({
        success: false,
        message: "Error searching articles",
        error: error.message,
      });
    }
  }

  // Get articles by category (Public)
  async getArticlesByCategory(req: Request, res: Response): Promise<Response> {
    try {
      const { category } = req.params;
      console.log("Fetching articles for category:", category);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const result = await articleService.getArticlesByCategory(
        category,
        skip,
        limit
      );

      return res.status(200).json({
        success: true,
        data: {
          articles: result.articles,
          category,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Get articles by category error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching articles by category",
        error: error.message,
      });
    }
  }
}

export default new ArticleController();
