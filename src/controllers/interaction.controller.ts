import { Request, Response, NextFunction } from "express";
import interactionService from "../services/interaction.service";
import { IAuthRequest } from "../types/user.types";
import { ICheckInteractionsDTO } from "../types/interaction.types";

// Check drug interactions with full AI analysis
export const checkInteractions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { medicines, includeAIAnalysis = true }: ICheckInteractionsDTO = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      res.status(400).json({
        success: false,
        message: "Please provide at least one medicine to check",
      });
      return;
    }

    if (medicines.length > 10) {
      res.status(400).json({
        success: false,
        message: "Maximum 10 medicines can be checked at once",
      });
      return;
    }

    const result = await interactionService.checkInteractions(
      userId,
      medicines,
      includeAIAnalysis
    );

    // Save the scan to database
    const saved = await interactionService.saveScan(userId, result);

    res.status(200).json({
      success: true,
      message: "Interaction scan completed",
      data: {
        ...result,
        id: saved.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Quick check without AI (faster response)
export const quickCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { medicines }: ICheckInteractionsDTO = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      res.status(400).json({
        success: false,
        message: "Please provide at least one medicine to check",
      });
      return;
    }

    if (medicines.length > 10) {
      res.status(400).json({
        success: false,
        message: "Maximum 10 medicines can be checked at once",
      });
      return;
    }

    const result = await interactionService.quickCheck(userId, medicines);

    res.status(200).json({
      success: true,
      message: "Quick interaction scan completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Search medicines for interaction checker (autocomplete)
export const searchMedicines = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
      return;
    }

    // Import prisma directly for quick search
    const prisma = (await import("../config/database")).default;

    const medicines = await prisma.medicine.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { generics: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        generics: true,
        slug: true,
        brand: true,
        productImage: true,
      },
      take: 10,
      orderBy: [
        { dataCompletenessScore: "desc" },
        { title: "asc" },
      ],
    });

    res.status(200).json({
      success: true,
      data: medicines.map((m) => ({
        id: m.id,
        name: m.title,
        genericName: m.generics,
        slug: m.slug,
        brand: m.brand,
        image: m.productImage,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get user's health profile summary for display
export const getHealthProfileSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const healthProfile = await interactionService.getUserHealthProfile(userId);

    if (!healthProfile) {
      res.status(200).json({
        success: true,
        data: null,
        message: "No health profile found. Create one for personalized interaction checks.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: healthProfile,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's scan history
export const getScanHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await interactionService.getScanHistory(userId, page, limit);

    res.status(200).json({
      success: true,
      data: result.scans,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific scan by ID
export const getScanById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const scanId = req.params.id;

    if (!scanId) {
      res.status(400).json({
        success: false,
        message: "Scan ID is required",
      });
      return;
    }

    const scan = await interactionService.getScanById(userId, scanId);

    if (!scan) {
      res.status(404).json({
        success: false,
        message: "Scan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: scan,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a scan
export const deleteScan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const scanId = req.params.id;

    if (!scanId) {
      res.status(400).json({
        success: false,
        message: "Scan ID is required",
      });
      return;
    }

    const deleted = await interactionService.deleteScan(userId, scanId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Scan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Scan deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get latest scan
export const getLatestScan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const scan = await interactionService.getLatestScan(userId);

    res.status(200).json({
      success: true,
      data: scan,
    });
  } catch (error) {
    next(error);
  }
};
