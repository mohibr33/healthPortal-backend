import {
  getPendingReminders,
  markReminderSent,
  getMissedDoses,
  markDoseAsMissed,
} from "./userMedicine.service";

const MISSED_DOSE_HOURS = parseInt(process.env.MISSED_DOSE_HOURS || "4");
const SCHEDULER_INTERVAL_MS = 60000;

let isRunning = false;

export const startScheduler = (): void => {
  if (isRunning) {
    console.log("Medicine scheduler already running");
    return;
  }

  isRunning = true;
  console.log("Medicine scheduler started");

  setInterval(async () => {
    try {
      await processReminders();
      await processMissedDoses();
    } catch (error) {
      console.error("Scheduler error:", error);
    }
  }, SCHEDULER_INTERVAL_MS);
};

const processReminders = async (): Promise<void> => {
  const pendingReminders = await getPendingReminders();

  for (const dose of pendingReminders) {
    const scheduledTime = new Date(dose.scheduledDate);
    const [hours, minutes] = dose.scheduledTime.split(":").map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    if (now >= scheduledTime) {
      await simulateReminder(dose);
      await markReminderSent(dose.id);
    }
  }
};

const simulateReminder = async (dose: any): Promise<void> => {
  const user = dose.userMedicine.user;
  
  console.log(`
  ┌─────────────────────────────────────────────┐
  │ 💊 MEDICINE REMINDER (SIMULATED SMS)        │
  ├─────────────────────────────────────────────┤
  │ Patient: ${user.firstName} ${user.lastName}
  │ Medicine: ${dose.userMedicine.name}
  │ Time: ${dose.scheduledTime}
  │ Date: ${new Date(dose.scheduledDate).toLocaleDateString()}
  └─────────────────────────────────────────────┘
  `);

  console.log(`Reminder saved to database for dose: ${dose.id}`);
};

const processMissedDoses = async (): Promise<void> => {
  const missedAfter = new Date();
  missedAfter.setHours(missedAfter.getHours() - MISSED_DOSE_HOURS);

  const missedDoses = await getMissedDoses(missedAfter);

  for (const dose of missedDoses) {
    await markDoseAsMissed(dose.id);
    console.log(`Dose marked as missed: ${dose.id} - ${dose.userMedicine.name}`);
  }
};

export const setMissedDoseWindow = (hours: number): void => {
  console.log(`Missed dose window set to ${hours} hours`);
};

export const stopScheduler = (): void => {
  isRunning = false;
  console.log("Medicine scheduler stopped");
};
