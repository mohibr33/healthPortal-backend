import prisma from "../config/database";

class RehabService {
  async getProgress(userId: string) {
    const progress = await prisma.rehabProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return progress;
  }

  async updateProgress(userId: string, exerciseId: string) {
    const existing = await prisma.rehabProgress.findFirst({
      where: { userId, exerciseId },
    });
    if (existing) {
      return prisma.rehabProgress.update({
        where: { id: existing.id },
        data: { completedCount: { increment: 1 }, lastCompletedAt: new Date() },
      });
    }
    return prisma.rehabProgress.create({
      data: { userId, exerciseId, completedCount: 1 },
    });
  }

  async getChecklist(userId: string, date: string) {
    return prisma.rehabChecklist.findFirst({
      where: { userId, date },
    });
  }

  async upsertChecklist(userId: string, date: string, items: any[]) {
    const existing = await prisma.rehabChecklist.findFirst({
      where: { userId, date },
    });
    if (existing) {
      return prisma.rehabChecklist.update({
        where: { id: existing.id },
        data: { items },
      });
    }
    return prisma.rehabChecklist.create({
      data: { userId, date, items },
    });
  }
}

export default new RehabService();
