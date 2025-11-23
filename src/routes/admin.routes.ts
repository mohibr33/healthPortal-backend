import { Router } from "express";
import adminController from "../controllers/admin.controller";
import articleController from "../controllers/article.controller";
import * as ticketController from "../controllers/ticket.controller";
import * as medicineController from "../controllers/medicine.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import {
  createArticleValidation,
  updateArticleValidation,
} from "../middlewares/article.validation";
import { resolveTicketValidation } from "../middlewares/ticket.validation";
import {
  createMedicineValidation,
  updateMedicineValidation,
} from "../middlewares/medicine.validation";
import { handleValidationErrors } from "../middlewares/errorHandler.middleware";
import { validateRequest } from "../middlewares/validation.middleware";

const router: Router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(isAdmin);

// User management routes
router.get("/users", adminController.getAllUsers.bind(adminController));
router.get("/users/search", adminController.searchUsers.bind(adminController));
router.get("/users/:id", adminController.getUserById.bind(adminController));
router.put("/users/:id", adminController.updateUser.bind(adminController));
router.delete("/users/:id", adminController.deleteUser.bind(adminController));

// Article management routes
router.post(
  "/articles",
  createArticleValidation,
  handleValidationErrors,
  articleController.createArticle.bind(articleController)
);
router.get(
  "/articles/:id",
  articleController.getArticleById.bind(articleController)
);
router.put(
  "/articles/:id",
  updateArticleValidation,
  handleValidationErrors,
  articleController.updateArticle.bind(articleController)
);
router.delete(
  "/articles/:id",
  articleController.deleteArticle.bind(articleController)
);

// Support ticket management routes
router.get("/tickets/stats", ticketController.getTicketStats);
router.get("/tickets", ticketController.getAllTickets);
router.get("/tickets/:id", ticketController.getTicketByIdAdmin);
router.put(
  "/tickets/:id/resolve",
  resolveTicketValidation,
  validateRequest,
  ticketController.resolveTicket
);
router.delete("/tickets/:id", ticketController.deleteTicket);

// Medicine management routes
router.post(
  "/medicines",
  createMedicineValidation,
  validateRequest,
  medicineController.createMedicine
);
router.put(
  "/medicines/:id",
  updateMedicineValidation,
  validateRequest,
  medicineController.updateMedicine
);
router.delete("/medicines/:id", medicineController.deleteMedicine);

export default router;
