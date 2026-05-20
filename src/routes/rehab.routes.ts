import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import * as rehabController from "../controllers/rehab.controller";

const router: Router = Router();

router.use(authenticateToken);

router.get("/progress", rehabController.getProgress);
router.post("/progress", rehabController.updateProgress);
router.get("/checklist/:date", rehabController.getChecklist);
router.post("/checklist", rehabController.saveChecklist);

export default router;
