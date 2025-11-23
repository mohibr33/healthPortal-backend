import { Router } from "express";
import articleController from "../controllers/article.controller";

const router = Router();

// Public routes
router.get("/", articleController.getAllArticles.bind(articleController));
router.get("/search", articleController.searchArticles.bind(articleController));
router.get(
  "/category/:category",
  articleController.getArticlesByCategory.bind(articleController)
);
router.get(
  "/:slug",
  articleController.getArticleBySlug.bind(articleController)
);

export default router;
