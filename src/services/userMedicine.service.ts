import { PrismaClient, DoseStatus } from "@prisma/client";
import {
  CreateUserMedicineInput,
  UpdateUserMedicineInput,
  UserMedicineResponse,
  DoseScheduleResponse,
  DoseScheduleWithMedicine,
  ReminderResponse,
} from "../types/userMedicine.types";

const prisma = new PrismaClient();

export const createUserMedicine = async (
  input: CreateUserMedicineInput
): Promise<UserMedicineResponse> => {
  const { userId, name, doctorName, duration, isLifetime, intakeTimes, notes } =
    input;

  const medicine = await prisma.userMedicine.create({
    data: {
      userId,
      name,
      doctorName,
      duration,
      isLifetime: isLifetime || false,
      intakeTimes,
      notes,
    },
  });

  await generateDoseSchedules(medicine.id, duration, isLifetime || false, intakeTimes);

  return medicine;
};

export const getUserMedicines = async (
  userId: string,
  includeInactive = false
): Promise<UserMedicineResponse[]> => {
  const where: any = { userId };
  if (!includeInactive) {
    where.isActive = true;
  }

  return prisma.userMedicine.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
};

export const getUserMedicineById = async (
  id: string
): Promise<UserMedicineResponse | null> => {
  return prisma.userMedicine.findUnique({
    where: { id },
  });
};

export const updateUserMedicine = async (
  id: string,
  input: UpdateUserMedicineInput
): Promise<UserMedicineResponse> => {
  const existing = await prisma.userMedicine.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Medicine not found");
  }

  const wasActive = existing.isActive;
  const willBeActive = input.isActive !== undefined ? input.isActive : wasActive;
  const newDuration = input.duration !== undefined ? input.duration : existing.duration;
  const newIsLifetime = input.isLifetime !== undefined ? input.isLifetime : existing.isLifetime;
  const newIntakeTimes = input.intakeTimes || existing.intakeTimes;

  const medicine = await prisma.userMedicine.update({
    where: { id },
    data: input,
  });

  if (willBeActive && !wasActive) {
    await generateDoseSchedules(medicine.id, newDuration, newIsLifetime, newIntakeTimes);
  }

  return medicine;
};

export const deleteUserMedicine = async (id: string): Promise<void> => {
  await prisma.userMedicine.update({
    where: { id },
    data: { isActive: false },
  });
};

export const getReminders = async (
  userId: string,
  date?: Date
): Promise<ReminderResponse[]> => {
  const targetDate = date || new Date();
  targetDate.setHours(0, 0, 0, 0);

  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);

  const doses = await prisma.doseSchedule.findMany({
    where: {
      userMedicine: { userId, isActive: true },
      scheduledDate: {
        gte: targetDate,
        lte: endDate,
      },
    },
    include: {
      userMedicine: true,
    },
    orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
  });

  return doses.map((dose) => ({
    id: dose.id,
    medicineName: dose.userMedicine.name,
    scheduledTime: dose.scheduledTime,
    scheduledDate: dose.scheduledDate,
    status: dose.status,
    takenAt: dose.takenAt,
  }));
};

export const markDoseAsTaken = async (
  doseId: string
): Promise<DoseScheduleResponse> => {
  const dose = await prisma.doseSchedule.findUnique({
    where: { id: doseId },
  });

  if (!dose) {
    throw new Error("Dose schedule not found");
  }

  if (dose.status === DoseStatus.taken) {
    throw new Error("Dose already marked as taken");
  }

  return prisma.doseSchedule.update({
    where: { id: doseId },
    data: {
      status: DoseStatus.taken,
      takenAt: new Date(),
    },
    include: {
      userMedicine: true,
    },
  });
};

export const markDoseAsMissed = async (doseId: string): Promise<DoseScheduleResponse> => {
  return prisma.doseSchedule.update({
    where: { id: doseId },
    data: { status: DoseStatus.missed },
    include: {
      userMedicine: true,
    },
  });
};

export const getPendingReminders = async (): Promise<DoseScheduleWithMedicine[]> => {
  return prisma.doseSchedule.findMany({
    where: {
      status: DoseStatus.pending,
      scheduledDate: {
        lte: new Date(),
      },
      reminderSent: false,
    },
    include: {
      userMedicine: {
        include: { user: true },
      },
    },
  });
};

export const markReminderSent = async (doseId: string): Promise<void> => {
  await prisma.doseSchedule.update({
    where: { id: doseId },
    data: { reminderSent: true },
  });
};

export const getMissedDoses = async (missedAfter: Date): Promise<DoseScheduleWithMedicine[]> => {
  return prisma.doseSchedule.findMany({
    where: {
      status: DoseStatus.pending,
      scheduledDate: {
        lt: missedAfter,
      },
    },
    include: {
      userMedicine: {
        include: { user: true },
      },
    },
  });
};

const generateDoseSchedules = async (
  medicineId: string,
  duration: number,
  isLifetime: boolean,
  intakeTimes: string[]
): Promise<void> => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const totalDays = isLifetime ? 30 : duration;

  const schedules = [];
  for (let day = 0; day < totalDays; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);

    for (const time of intakeTimes) {
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledDateTime = new Date(date);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      if (scheduledDateTime >= startDate) {
        schedules.push({
          userMedicineId: medicineId,
          scheduledDate: scheduledDateTime,
          scheduledTime: time,
          status: DoseStatus.pending,
          reminderSent: false,
        });
      }
    }
  }

  if (schedules.length > 0) {
    await prisma.doseSchedule.createMany({ data: schedules });
  }
};

export const getDoseHistory = async (
  userId: string,
  medicineId?: string,
  limit = 50
): Promise<DoseScheduleResponse[]> => {
  const where: any = {
    userMedicine: { userId },
  };

  if (medicineId) {
    where.userMedicineId = medicineId;
  }

  return prisma.doseSchedule.findMany({
    where,
    include: { userMedicine: true },
    orderBy: { scheduledDate: "desc" },
    take: limit,
  });
};

export const getGuidelines = async (medicineId?: string) => {
  const where: any = {
    OR: [
      { medicineId: medicineId || undefined, isGlobal: false },
      { isGlobal: true },
    ],
  };

  return prisma.medicineGuideline.findMany({
    where,
    orderBy: [{ severity: "desc" }, { category: "asc" }],
  });
};

export const getGlobalGuidelines = async () => {
  return prisma.medicineGuideline.findMany({
    where: { isGlobal: true },
    orderBy: [{ severity: "desc" }, { category: "asc" }],
  });
};

export const getSummaryReport = async (
  userId: string,
  days: number = 15
): Promise<{
  totalMedicines: number;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  pendingDoses: number;
  adherenceRate: number;
  dailyBreakdown: any[];
  medicineBreakdown: any[];
}> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const userMedicines = await prisma.userMedicine.findMany({
    where: { userId, isActive: true },
  });

  const doses = await prisma.doseSchedule.findMany({
    where: {
      userMedicine: { userId, isActive: true },
      scheduledDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: { userMedicine: true },
    orderBy: { scheduledDate: "asc" },
  });

  const totalDoses = doses.length;
  const takenDoses = doses.filter((d) => d.status === DoseStatus.taken).length;
  const missedDoses = doses.filter((d) => d.status === DoseStatus.missed).length;
  const pendingDoses = doses.filter((d) => d.status === DoseStatus.pending).length;
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const dailyMap = new Map<string, { total: number; taken: number; missed: number; pending: number }>();
  const medicineMap = new Map<string, { name: string; total: number; taken: number; missed: number; pending: number }>();

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    dailyMap.set(dateStr, { total: 0, taken: 0, missed: 0, pending: 0 });
  }

  for (const dose of doses) {
    const dateStr = new Date(dose.scheduledDate).toISOString().split("T")[0];
    const dayData = dailyMap.get(dateStr);
    if (dayData) {
      dayData.total++;
      if (dose.status === DoseStatus.taken) dayData.taken++;
      else if (dose.status === DoseStatus.missed) dayData.missed++;
      else dayData.pending++;
    }

    const medData = medicineMap.get(dose.userMedicineId);
    if (medData) {
      medData.total++;
      if (dose.status === DoseStatus.taken) medData.taken++;
      else if (dose.status === DoseStatus.missed) medData.missed++;
      else medData.pending++;
    } else {
      medicineMap.set(dose.userMedicineId, {
        name: dose.userMedicine.name,
        total: 1,
        taken: dose.status === DoseStatus.taken ? 1 : 0,
        missed: dose.status === DoseStatus.missed ? 1 : 0,
        pending: dose.status === DoseStatus.pending ? 1 : 0,
      });
    }
  }

  const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));

  const medicineBreakdown = Array.from(medicineMap.entries()).map(([id, data]) => ({
    medicineId: id,
    medicineName: data.name,
    total: data.total,
    taken: data.taken,
    missed: data.missed,
    pending: data.pending,
    adherenceRate: data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0,
  }));

  return {
    totalMedicines: userMedicines.length,
    totalDoses,
    takenDoses,
    missedDoses,
    pendingDoses,
    adherenceRate,
    dailyBreakdown,
    medicineBreakdown,
  };
};

export const calculateDosage = (input: {
  medicineName: string;
  frequency: number;
  duration: number;
  timesPerDay: number;
  intakeTimes?: string[];
}) => {
  const { medicineName, frequency, duration, timesPerDay, intakeTimes } = input;
  const totalDoses = frequency * duration;
  
  const schedule: { date: string; time: string }[] = [];
  const startDate = new Date();

  for (let day = 0; day < duration; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split("T")[0];

    if (intakeTimes && intakeTimes.length > 0) {
      for (const time of intakeTimes) {
        schedule.push({ date: dateStr, time });
      }
    } else {
      for (let t = 0; t < timesPerDay; t++) {
        const hour = Math.floor((24 / timesPerDay) * t);
        const time = `${hour.toString().padStart(2, "0")}:00`;
        schedule.push({ date: dateStr, time });
      }
    }
  }

  return {
    medicineName,
    frequency,
    duration,
    timesPerDay,
    totalDoses,
    schedule,
  };
};
