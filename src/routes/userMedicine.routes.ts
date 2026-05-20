import { Router } from "express";
import {
  addMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getUserReminders,
  markDoseTaken,
  getHistory,
  getUserGuidelines,
  getUserSummaryReport,
  calculateDosageHandler,
} from "../controllers/userMedicine.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.post("/", addMedicine);
router.get("/", getMedicines);
router.get("/reminders", getUserReminders);
router.get("/history", getHistory);
router.get("/guidelines", getUserGuidelines);
router.get("/summary", getUserSummaryReport);
router.post("/calculate-dosage", calculateDosageHandler);
router.get("/:id", getMedicineById);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);
router.patch("/:doseId/take", markDoseTaken);

export default router;
