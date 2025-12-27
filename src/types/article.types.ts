// import { Article } from "@prisma/client";

export interface IArticle {
  id: string;
  title: string;
  slug: string;
  imageUrl?: string | null;
  category: string;
  shortDescription: string;
  content: string;
  sourceLink?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateArticleDTO {
  title: string;
  imageUrl?: string;
  category: string;
  shortDescription: string;
  content: string;
  sourceLink?: string;
}

export interface IUpdateArticleDTO {
  title?: string;
  imageUrl?: string;
  category?: string;
  shortDescription?: string;
  content?: string;
  sourceLink?: string;
}

export interface IArticleWithAuthor extends IArticle {
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
