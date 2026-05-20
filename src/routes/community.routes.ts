import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import {
  createPostValidation,
  addCommentValidation,
  addReactionValidation,
  postIdValidation,
  commentIdValidation,
  listPostsValidation,
} from "../middlewares/community.validation";
import * as communityController from "../controllers/community.controller";

const router: Router = Router();

router.use(authenticateToken);

router.post("/posts", createPostValidation, validateRequest, communityController.createPost);
router.get("/posts", listPostsValidation, validateRequest, communityController.getPosts);
router.get("/posts/stats", communityController.getCommunityStats);
router.get("/posts/:postId", postIdValidation, validateRequest, communityController.getPostById);
router.delete("/posts/:postId", postIdValidation, validateRequest, communityController.deletePost);

router.post("/posts/:postId/comments", addCommentValidation, validateRequest, communityController.addComment);
router.get("/posts/:postId/comments", postIdValidation, validateRequest, communityController.getComments);
router.delete("/comments/:commentId", commentIdValidation, validateRequest, communityController.deleteComment);

router.post("/posts/:postId/reactions", addReactionValidation, validateRequest, communityController.toggleReaction);

export default router;
