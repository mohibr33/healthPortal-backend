import prisma from "../config/database";
import {
  IHealthProfile,
  ICreateHealthProfileDTO,
} from "../types/mealPlan.types";

class HealthProfileService {
  // Create or update health profile
  async upsertHealthProfile(
    userId: string,
    profileData: ICreateHealthProfileDTO
  ): Promise<IHealthProfile> {
    const profile = await prisma.healthProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...profileData,
        medicalConditions: profileData.medicalConditions || [],
        specialConditions: profileData.specialConditions || [],
        allergies: profileData.allergies || [],
        dislikedFoods: profileData.dislikedFoods || [],
        currentHabits: profileData.currentHabits || {},
      },
      update: {
        ...profileData,
        medicalConditions: profileData.medicalConditions || [],
        specialConditions: profileData.specialConditions || [],
        allergies: profileData.allergies || [],
        dislikedFoods: profileData.dislikedFoods || [],
        currentHabits: profileData.currentHabits || {},
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            gender: true,
          },
        },
      },
    });

    return profile as any;
  }

  // Get user's health profile
  async getUserHealthProfile(userId: string): Promise<IHealthProfile | null> {
    return (await prisma.healthProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            gender: true,
          },
        },
      },
    })) as any;
  }

  // Delete health profile
  async deleteHealthProfile(userId: string): Promise<void> {
    await prisma.healthProfile.delete({
      where: { userId },
    });
  }
}

export default new HealthProfileService();
