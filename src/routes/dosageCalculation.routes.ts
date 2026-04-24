import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middlewares/auth.middleware";

const prisma = new PrismaClient();

const router = express.Router();

router.post("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { drugName, calculationMethod, inputs, result, unit, steps } = req.body;

    if (!drugName || !calculationMethod || !result || !unit) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const calculation = await prisma.dosageCalculation.create({
      data: {
        userId,
        drugName,
        calculationMethod,
        inputs: inputs || {},
        result,
        unit,
        steps: steps || "",
      },
    });

    res.json({ success: true, data: calculation });
  } catch (error: any) {
    console.error("Dosage calculation error:", error);
    res.status(500).json({ success: false, message: "Failed to save calculation" });
  }
});

router.get("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const calculations = await prisma.dosageCalculation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ success: true, data: calculations });
  } catch (error: any) {
    console.error("Fetch calculations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch calculations" });
  }
});

export default router;
