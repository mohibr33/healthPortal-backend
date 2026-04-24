import { Request, Response } from "express";
import {
  createUserMedicine,
  getUserMedicines,
  getUserMedicineById,
  updateUserMedicine,
  deleteUserMedicine,
  getReminders,
  markDoseAsTaken,
  getDoseHistory,
  getGuidelines,
  getSummaryReport,
  calculateDosage,
} from "../services/userMedicine.service";

export const addMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - User ID required",
      });
      return;
    }

    const { name, doctorName, duration, isLifetime, intakeTimes, notes } =
      req.body;

    if (!name || !intakeTimes || intakeTimes.length === 0) {
      res.status(400).json({
        success: false,
        message: "Medicine name and at least one intake time are required",
      });
      return;
    }

    if (!duration && !isLifetime) {
      res.status(400).json({
        success: false,
        message: "Duration or isLifetime must be specified",
      });
      return;
    }

    const medicine = await createUserMedicine({
      userId,
      name,
      doctorName,
      duration: isLifetime ? -1 : duration,
      isLifetime,
      intakeTimes,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Medicine added successfully",
      data: medicine,
    });
  } catch (error: any) {
    console.error("Error adding medicine:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add medicine",
    });
  }
};

export const getMedicines = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - User ID required",
      });
      return;
    }

    const includeInactive = req.query.includeInactive === "true";

    const medicines = await getUserMedicines(userId, includeInactive);

    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error: any) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch medicines",
    });
  }
};

export const getMedicineById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const medicine = await getUserMedicineById(id);

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error: any) {
    console.error("Error fetching medicine:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch medicine",
    });
  }
};

export const updateMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const medicine = await updateUserMedicine(id, req.body);

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: medicine,
    });
  } catch (error: any) {
    console.error("Error updating medicine:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update medicine",
    });
  }
};

export const deleteMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteUserMedicine(id);

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete medicine",
    });
  }
};

export const getUserReminders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - User ID required",
      });
      return;
    }

    const date = req.query.date ? new Date(req.query.date as string) : undefined;

    const reminders = await getReminders(userId, date);

    res.status(200).json({
      success: true,
      data: reminders,
    });
  } catch (error: any) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch reminders",
    });
  }
};

export const markDoseTaken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doseId } = req.params;

    const dose = await markDoseAsTaken(doseId);

    res.status(200).json({
      success: true,
      message: "Dose marked as taken",
      data: dose,
    });
  } catch (error: any) {
    console.error("Error marking dose as taken:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mark dose as taken",
    });
  }
};

export const getHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - User ID required",
      });
      return;
    }

    const medicineId = req.query.medicineId as string;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await getDoseHistory(userId, medicineId, limit);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error("Error fetching dose history:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch dose history",
    });
  }
};

export const getUserGuidelines = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { medicineId } = req.query;
    const guidelines = await getGuidelines(medicineId as string);

    res.status(200).json({
      success: true,
      data: guidelines,
    });
  } catch (error: any) {
    console.error("Error fetching guidelines:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch guidelines",
    });
  }
};

export const getUserSummaryReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 15;
    const summary = await getSummaryReport(userId, days);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("Error fetching summary report:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch summary report",
    });
  }
};

export const calculateDosageHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { medicineName, frequency, duration, timesPerDay, intakeTimes } = req.body;

    if (!medicineName || !frequency || !duration || !timesPerDay) {
      res.status(400).json({
        success: false,
        message: "Medicine name, frequency, duration, and times per day are required",
      });
      return;
    }

    const result = calculateDosage({
      medicineName,
      frequency,
      duration,
      timesPerDay,
      intakeTimes,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error calculating dosage:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate dosage",
    });
  }
};
