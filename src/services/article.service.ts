import prisma from "../config/database";
import {
  ICreateArticleDTO,
  IUpdateArticleDTO,
  IArticleWithAuthor,
} from "../types/article.types";
import { Article } from "@prisma/client";
import { generateUniqueSlug } from "../utils/slug.util";

class ArticleService {
  // Create article
  async createArticle(
    articleData: ICreateArticleDTO,
    userId: string
  ): Promise<IArticleWithAuthor> {
    const slug = generateUniqueSlug(articleData.title);

    const article = await prisma.article.create({
      data: {
        ...articleData,
        slug,
        createdBy: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return article;
  }

  // Find article by ID
  async findArticleById(id: string): Promise<IArticleWithAuthor | null> {
    return await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Find article by slug
  async findArticleBySlug(slug: string): Promise<IArticleWithAuthor | null> {
    return await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Update article
  async updateArticle(
    id: string,
    updateData: IUpdateArticleDTO
  ): Promise<IArticleWithAuthor> {
    const dataToUpdate: any = { ...updateData };

    // If title is being updated, generate new slug
    if (updateData.title) {
      dataToUpdate.slug = generateUniqueSlug(updateData.title);
    }

    const article = await prisma.article.update({
      where: { id },
      data: dataToUpdate,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return article;
  }

  // Delete article
  async deleteArticle(id: string): Promise<Article> {
    return await prisma.article.delete({
      where: { id },
    });
  }

  // Get all articles with pagination
  async getAllArticles(
    skip: number = 0,
    take: number = 10,
    category?: string
  ): Promise<{ articles: IArticleWithAuthor[]; total: number }> {
    const where = category ? { category } : {};

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.article.count({ where }),
    ]);

    return { articles, total };
  }

  // Search articles
  async searchArticles(
    query: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ articles: IArticleWithAuthor[]; total: number }> {
    const searchTerm = query.trim();

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { shortDescription: { contains: searchTerm, mode: "insensitive" } },
            { content: { contains: searchTerm, mode: "insensitive" } },
            { category: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        skip,
        take,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.article.count({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { shortDescription: { contains: searchTerm, mode: "insensitive" } },
            { content: { contains: searchTerm, mode: "insensitive" } },
            { category: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return { articles, total };
  }

  // Get articles by category
  async getArticlesByCategory(
    category: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ articles: IArticleWithAuthor[]; total: number }> {
    return await this.getAllArticles(skip, take, category);
  }
}

export default new ArticleService();
