import { Router } from "express";
import userController from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  registerValidation,
  loginValidation,
  verifyOTPValidation,
  updateProfileValidation,
  resetPasswordValidation,
} from "../middlewares/validation.middleware";
import { handleValidationErrors } from "../middlewares/errorHandler.middleware";

const router = Router();

// Public routes
router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  userController.register.bind(userController)
);
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  userController.login.bind(userController)
);
router.post(
  "/verify-otp",
  verifyOTPValidation,
  handleValidationErrors,
  userController.verifyOTP.bind(userController)
);
router.post(
  "/request-password-reset",
  userController.requestPasswordReset.bind(userController)
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  handleValidationErrors,
  userController.resetPassword.bind(userController)
);

// Protected routes
router.get(
  "/profile",
  authenticateToken,
  userController.getProfile.bind(userController)
);
router.put(
  "/profile",
  authenticateToken,
  updateProfileValidation,
  handleValidationErrors,
  userController.updateProfile.bind(userController)
);

export default router;
