import prisma from "../config/database";
import OpenAI from "openai";
import {
  MoodLevel,
  StressLevel,
  ScreeningType,
  ScreeningSeverity,
} from "@prisma/client";
import {
  ICreateMoodEntryDTO,
  IMoodTrendResponse,
  ICreateStressAssessmentDTO,
  IStressTrendResponse,
  ICreateScreeningDTO,
  IScreeningResponse,
  ICreateJournalEntryDTO,
  ISentimentAnalysis,
  ICreateMeditationSessionDTO,
  ICreateWellnessResourceDTO,
} from "../types/stressWellness.types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class StressWellnessService {
  // ─── Mood Tracker ─────────────────────────────────────────────────────

  async createMoodEntry(userId: string, data: ICreateMoodEntryDTO) {
    const entry = await prisma.moodEntry.create({
      data: {
        userId,
        mood: data.mood,
        note: data.note,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
    return entry;
  }

  async getMoodHistory(userId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const entries = await prisma.moodEntry.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "desc" },
    });

    return entries;
  }

  async getMoodTrend(userId: string): Promise<IMoodTrendResponse> {
    const entries = await this.getMoodHistory(userId, 30);
    const moodValues: Record<MoodLevel, number> = {
      very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5,
    };

    if (entries.length === 0) {
      return { entries, averageMood: 0, trend: "stable", weeklySummary: [], monthlySummary: [] };
    }

    const avgMood = entries.reduce((sum, e) => sum + moodValues[e.mood], 0) / entries.length;

    const trend: "improving" | "declining" | "stable" =
      entries.length >= 2
        ? entries[0].date > entries[entries.length - 1].date
          ? "declining"
          : "improving"
        : "stable";

    const weeklySummary = this.buildWeeklyMoodSummary(entries, moodValues);
    const monthlySummary = this.buildMonthlyMoodSummary(entries, moodValues);

    return { entries, averageMood: parseFloat(avgMood.toFixed(2)), trend, weeklySummary, monthlySummary };
  }

  private buildWeeklyMoodSummary(entries: { date: Date; mood: MoodLevel }[], moodValues: Record<MoodLevel, number>) {
    const weeks: Record<string, number[]> = {};
    entries.forEach((e) => {
      const week = this.getWeekKey(e.date);
      if (!weeks[week]) weeks[week] = [];
      weeks[week].push(moodValues[e.mood]);
    });
    return Object.entries(weeks).map(([date, values]) => ({
      date,
      averageMood: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
    }));
  }

  private buildMonthlyMoodSummary(entries: { date: Date; mood: MoodLevel }[], moodValues: Record<MoodLevel, number>) {
    const months: Record<string, number[]> = {};
    entries.forEach((e) => {
      const month = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
      if (!months[month]) months[month] = [];
      months[month].push(moodValues[e.mood]);
    });
    return Object.entries(months).map(([week, values]) => ({
      week,
      averageMood: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
    }));
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // ─── Stress Assessment ────────────────────────────────────────────────

  async createStressAssessment(userId: string, data: ICreateStressAssessmentDTO) {
    const total = data.answers.reduce((sum, a) => sum + a.answer, 0);
    const maxScore = data.answers.length * 5;
    const score = Math.round((total / maxScore) * 100);
    const level = this.calculateStressLevel(score);

    const assessment = await prisma.stressAssessment.create({
      data: {
        userId,
        score,
        level,
        answers: data.answers,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
    return assessment;
  }

  private calculateStressLevel(score: number): StressLevel {
    if (score < 25) return "low";
    if (score < 50) return "moderate";
    if (score < 75) return "high";
    return "severe";
  }

  async getStressHistory(userId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.stressAssessment.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "desc" },
    });
  }

  async getStressTrend(userId: string): Promise<IStressTrendResponse> {
    const assessments = await this.getStressHistory(userId, 30);

    if (assessments.length === 0) {
      return {
        assessments, averageScore: 0, currentLevel: "low",
        weeklySummary: [], monthlySummary: [],
      };
    }

    const avgScore = assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length;
    const currentLevel = this.calculateStressLevel(assessments[0].score);

    return {
      assessments,
      averageScore: Math.round(avgScore),
      currentLevel,
      weeklySummary: this.buildWeeklyStressSummary(assessments),
      monthlySummary: this.buildMonthlyStressSummary(assessments),
    };
  }

  private buildWeeklyStressSummary(assessments: { date: Date; score: number }[]) {
    const weeks: Record<string, number[]> = {};
    assessments.forEach((a) => {
      const week = this.getWeekKey(a.date);
      if (!weeks[week]) weeks[week] = [];
      weeks[week].push(a.score);
    });
    return Object.entries(weeks).map(([date, scores]) => ({
      date,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));
  }

  private buildMonthlyStressSummary(assessments: { date: Date; score: number }[]) {
    const months: Record<string, number[]> = {};
    assessments.forEach((a) => {
      const month = `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, "0")}`;
      if (!months[month]) months[month] = [];
      months[month].push(a.score);
    });
    return Object.entries(months).map(([week, scores]) => ({
      week,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));
  }

  // ─── Anxiety/Depression Screening ─────────────────────────────────────

  async createScreening(userId: string, data: ICreateScreeningDTO): Promise<IScreeningResponse> {
    const totalScore = data.answers.reduce((sum, a) => sum + a.answer, 0);
    const severity = this.calculateScreeningSeverity(data.testType, totalScore);
    const suggestion = await this.generateAISuggestion(data.testType, totalScore, severity);

    const screening = await prisma.anxietyScreening.create({
      data: {
        userId,
        testType: data.testType,
        score: totalScore,
        severity,
        answers: data.answers,
        aiGeneratedSuggestion: suggestion,
      },
    });

    return screening as unknown as IScreeningResponse;
  }

  private calculateScreeningSeverity(type: ScreeningType, score: number): ScreeningSeverity {
    if (type === "phq9") {
      if (score <= 4) return "minimal";
      if (score <= 9) return "mild";
      if (score <= 14) return "moderate";
      if (score <= 19) return "moderately_severe";
      return "severe";
    }
    // GAD-7
    if (score <= 4) return "minimal";
    if (score <= 9) return "mild";
    if (score <= 14) return "moderate";
    return "severe";
  }

  private async generateAISuggestion(type: ScreeningType, score: number, severity: ScreeningSeverity): Promise<string> {
    try {
      const testName = type === "phq9" ? "PHQ-9 (Depression)" : "GAD-7 (Anxiety)";
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a mental health support assistant. Provide compassionate, evidence-based wellness suggestions. Never diagnose. Always recommend professional help when scores indicate moderate or higher severity.",
          },
          {
            role: "user",
            content: `A user completed a ${testName} screening. Score: ${score}/${type === "phq9" ? 27 : 21}, Severity: ${severity}. Provide 2-3 personalized wellness suggestions and a recommendation about seeking professional help if needed. Keep it concise and supportive.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });
      return completion.choices[0].message.content || "";
    } catch (error) {
      console.error("AI suggestion generation error:", error);
      return this.getDefaultRecommendation(severity);
    }
  }

  private getDefaultRecommendation(severity: ScreeningSeverity): string {
    if (severity === "minimal" || severity === "mild") {
      return "Your results suggest you're doing well. Continue practicing self-care, maintain healthy habits, and reach out to loved ones for support. Consider mindfulness or relaxation exercises to maintain your wellbeing.";
    }
    if (severity === "moderate") {
      return "Your results suggest you may be experiencing some challenges. Consider speaking with a mental health professional. In the meantime, try stress-reduction techniques like deep breathing, regular exercise, and maintaining a consistent sleep schedule.";
    }
    return "Your results suggest significant distress. We strongly recommend speaking with a mental health professional as soon as possible. If you're in crisis, please contact a crisis helpline immediately (e.g., Pakistan Mental Health Helpline: 0311-7786264). You are not alone - help is available.";
  }

  async getScreeningHistory(userId: string) {
    return prisma.anxietyScreening.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ─── Anonymous Journaling ─────────────────────────────────────────────

  async createJournalEntry(userId: string | undefined, data: ICreateJournalEntryDTO) {
    const entry = await prisma.wellnessJournal.create({
      data: {
        userId: data.isAnonymous ? null : userId,
        title: data.title,
        content: data.content,
        isAnonymous: data.isAnonymous ?? false,
      },
    });
    return entry;
  }

  async getJournalEntries(userId: string) {
    return prisma.wellnessJournal.findMany({
      where: { userId, isAnonymous: false },
      orderBy: { createdAt: "desc" },
    });
  }

  async getJournalEntryById(entryId: string, userId: string) {
    return prisma.wellnessJournal.findFirst({
      where: { id: entryId, userId },
    });
  }

  async analyzeJournalEntry(entryId: string, userId: string): Promise<ISentimentAnalysis | null> {
    const entry = await prisma.wellnessJournal.findFirst({
      where: { id: entryId, userId },
    });
    if (!entry) return null;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze the following journal entry for emotional content. Return a JSON object with:
- overallSentiment: "positive" | "negative" | "neutral" | "mixed"
- score: number from -1 (very negative) to 1 (very positive)
- emotions: array of { emotion: string, intensity: number (0-1) }
- stressIndicators: array of strings describing stress-related content found
- anxietyIndicators: array of strings describing anxiety-related content found
- recommendations: array of 2-3 brief, supportive wellness recommendations based on the content`,
          },
          { role: "user", content: entry.content },
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}") as ISentimentAnalysis;

      await prisma.wellnessJournal.update({
        where: { id: entryId },
        data: { sentiment: result as any, analyzedAt: new Date() },
      });

      return result;
    } catch (error) {
      console.error("Journal analysis error:", error);
      return null;
    }
  }

  async deleteJournalEntry(entryId: string, userId: string) {
    await prisma.wellnessJournal.deleteMany({
      where: { id: entryId, userId },
    });
  }

  // ─── Meditation & Exercises ───────────────────────────────────────────

  async createMeditationSession(userId: string, data: ICreateMeditationSessionDTO) {
    return prisma.meditationSession.create({
      data: {
        userId,
        type: data.type,
        duration: data.duration,
        title: data.title,
        description: data.description,
        audioUrl: data.audioUrl,
        completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
      },
    });
  }

  async getMeditationHistory(userId: string) {
    return prisma.meditationSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getMeditationStats(userId: string) {
    const sessions = await prisma.meditationSession.findMany({ where: { userId } });
    const totalSessions = sessions.length;
    const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60);
    const typeBreakdown = sessions.reduce<Record<string, number>>((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});

    return { totalSessions, totalMinutes, typeBreakdown };
  }

  // ─── Wellness Resources ───────────────────────────────────────────────

  async createResource(data: ICreateWellnessResourceDTO) {
    return prisma.wellnessResource.create({
      data: {
        ...data,
        tags: data.tags || [],
      },
    });
  }

  async getResources(params: {
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { category, page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const [resources, total] = await Promise.all([
      prisma.wellnessResource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.wellnessResource.count({ where }),
    ]);

    return { resources, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getResourceBySlug(slug: string) {
    return prisma.wellnessResource.findUnique({ where: { slug } });
  }

  async deleteResource(resourceId: string) {
    await prisma.wellnessResource.delete({ where: { id: resourceId } });
  }

  // ─── Dashboard / Reports ──────────────────────────────────────────────

  async getWellnessSummary(userId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [recentMoods, recentStress, recentScreening, recentCommunityPosts, recentMeditation] =
      await Promise.all([
        prisma.moodEntry.count({ where: { userId, date: { gte: weekAgo } } }),
        prisma.stressAssessment.count({ where: { userId, date: { gte: weekAgo } } }),
        prisma.anxietyScreening.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.communityPost.count({ where: { userId, createdAt: { gte: monthAgo } } }),
        prisma.meditationSession.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      ]);

    return {
      moodEntriesThisWeek: recentMoods,
      stressAssessmentsThisWeek: recentStress,
      lastScreening: recentScreening,
      communityPostsThisMonth: recentCommunityPosts,
      meditationSessionsThisWeek: recentMeditation,
    };
  }
}

export default new StressWellnessService();
