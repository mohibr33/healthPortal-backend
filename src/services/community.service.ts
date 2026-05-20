import prisma from "../config/database";
import {
  ICreatePostDTO,
  IAddCommentDTO,
  IAddReactionDTO,
  IPostResponse,
  ICommentResponse,
  ICommunityStats,
} from "../types/community.types";

class CommunityService {
  // ─── Posts ──────────────────────────────────────────────────────────

  async createPost(userId: string, data: ICreatePostDTO): Promise<IPostResponse> {
    const post = await prisma.communityPost.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        category: data.category || "general",
        isAnonymous: data.isAnonymous ?? true,
      },
      include: { reactions: true, comments: true },
    });
    return this.formatPost(post, userId);
  }

  async getPosts(params: {
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
    userId: string;
  }) {
    const { category, page = 1, limit = 20, search, userId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reactions: true,
          comments: {
            orderBy: { createdAt: "desc" },
            take: 2,
          },
          _count: { select: { comments: true, reactions: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    const formatted = posts.map((p) => this.formatPost(p, userId));
    return { posts: formatted, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPostById(postId: string, currentUserId: string): Promise<IPostResponse | null> {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        reactions: true,
        comments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!post) return null;
    return this.formatPost(post, currentUserId);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    await prisma.communityPost.deleteMany({
      where: { id: postId, userId },
    });
  }

  // ─── Comments ───────────────────────────────────────────────────────

  async addComment(postId: string, userId: string, data: IAddCommentDTO) {
    const comment = await prisma.communityComment.create({
      data: {
        postId,
        userId,
        content: data.content,
        isAnonymous: data.isAnonymous ?? true,
        parentId: data.parentId || null,
      },
    });

    await prisma.communityPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  async deleteComment(commentId: string, _userId: string): Promise<void> {
    const comment = await prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!comment) return;
    await prisma.communityComment.delete({ where: { id: commentId } });
    await prisma.communityPost.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });
  }

  async getComments(postId: string) {
    return prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ─── Reactions ──────────────────────────────────────────────────────

  async toggleReaction(postId: string, userId: string, data: IAddReactionDTO) {
    const existing = await prisma.communityReaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      if (existing.reaction === data.reaction) {
        await prisma.communityReaction.delete({ where: { id: existing.id } });
        await prisma.communityPost.update({
          where: { id: postId },
          data: { reactionCount: { decrement: 1 } },
        });
        return { reacted: false, reaction: null };
      }
      await prisma.communityReaction.update({
        where: { id: existing.id },
        data: { reaction: data.reaction },
      });
      return { reacted: true, reaction: data.reaction };
    }

    await prisma.communityReaction.create({
      data: { postId, userId, reaction: data.reaction },
    });
    await prisma.communityPost.update({
      where: { id: postId },
      data: { reactionCount: { increment: 1 } },
    });
    return { reacted: true, reaction: data.reaction };
  }

  // ─── Stats ──────────────────────────────────────────────────────────

  async getCommunityStats(userId: string): Promise<ICommunityStats> {
    const [totalPosts, totalComments, totalReactions, myPosts, categoryAgg] = await Promise.all([
      prisma.communityPost.count(),
      prisma.communityComment.count(),
      prisma.communityReaction.count(),
      prisma.communityPost.count({ where: { userId } }),
      prisma.communityPost.groupBy({
        by: ["category"],
        _count: { id: true },
      }),
    ]);

    const categoryBreakdown = categoryAgg.reduce<Record<string, number>>((acc: Record<string, number>, c: { category: string; _count: { id: number } }) => {
      acc[c.category] = c._count.id;
      return acc;
    }, {});

    return { totalPosts, totalComments, totalReactions, myPosts, categoryBreakdown };
  }

  // ─── Helpers ────────────────────────────────────────────────────────

  private formatPost(post: any, currentUserId: string): IPostResponse {
    const userReaction = currentUserId
      ? post.reactions?.find((r: any) => r.userId === currentUserId)?.reaction || null
      : null;

    const allComments: ICommentResponse[] = (post.comments || []).map((c: any) => ({
      id: c.id,
      postId: c.postId,
      userId: c.isAnonymous ? null : c.userId,
      parentId: c.parentId || null,
      content: c.content,
      isAnonymous: c.isAnonymous,
      createdAt: c.createdAt,
      replies: [],
    }));

    const commentMap = new Map<string, ICommentResponse>();
    const topLevel: ICommentResponse[] = [];
    for (const c of allComments) {
      commentMap.set(c.id, c);
      if (!c.parentId) {
        topLevel.push(c);
      }
    }
    for (const c of allComments) {
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId)!.replies!.push(c);
      }
    }

    return {
      id: post.id,
      userId: post.isAnonymous ? null : post.userId,
      title: post.title,
      content: post.content,
      category: post.category,
      isAnonymous: post.isAnonymous,
      reactionCount: post.reactionCount ?? post._count?.reactions ?? post.reactions?.length ?? 0,
      commentCount: post.commentCount ?? post._count?.comments ?? post.comments?.length ?? 0,
      userReaction,
      comments: topLevel,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}

export default new CommunityService();
