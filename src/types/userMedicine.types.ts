import { DoseStatus } from "@prisma/client";

export interface CreateUserMedicineInput {
  userId: string;
  name: string;
  doctorName?: string;
  duration: number;
  isLifetime?: boolean;
  intakeTimes: string[];
  notes?: string;
}

export interface UpdateUserMedicineInput {
  name?: string;
  doctorName?: string;
  duration?: number;
  isLifetime?: boolean;
  intakeTimes?: string[];
  notes?: string;
  isActive?: boolean;
}

export interface UserMedicineResponse {
  id: string;
  userId: string;
  name: string;
  doctorName: string | null;
  duration: number;
  isLifetime: boolean;
  intakeTimes: string[];
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoseScheduleResponse {
  id: string;
  userMedicineId: string;
  scheduledDate: Date;
  scheduledTime: string;
  status: DoseStatus;
  takenAt: Date | null;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
  medicine?: UserMedicineResponse;
}

export interface DoseScheduleWithMedicine extends DoseScheduleResponse {
  userMedicine: UserMedicineResponse & { user: { firstName: string; lastName: string } };
}

export interface ReminderResponse {
  id: string;
  medicineName: string;
  scheduledTime: string;
  scheduledDate: Date;
  status: DoseStatus;
  takenAt: Date | null;
}

export interface GuidelineResponse {
  id: string;
  medicineId: string | null;
  title: string;
  category: string;
  content: string;
  severity: string | null;
  isGlobal: boolean;
}

export interface SummaryReport {
  totalMedicines: number;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  pendingDoses: number;
  adherenceRate: number;
  dailyBreakdown: {
    date: string;
    total: number;
    taken: number;
    missed: number;
    pending: number;
  }[];
  medicineBreakdown: {
    medicineId: string;
    medicineName: string;
    total: number;
    taken: number;
    missed: number;
    adherenceRate: number;
  }[];
}

export interface DosageCalculatorInput {
  medicineName: string;
  frequency: number; // times per day
  duration: number; // days
  timesPerDay: number;
  startDate?: string;
}

export interface DosageCalculatorResult {
  medicineName: string;
  frequency: number;
  duration: number;
  timesPerDay: number;
  totalDoses: number;
  schedule: {
    date: string;
    time: string;
  }[];
}
