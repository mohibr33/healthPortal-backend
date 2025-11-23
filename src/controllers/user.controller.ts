import { Request, Response } from "express";
import userService from "../services/user.service";
import * as jwt from "jsonwebtoken";
import { IAuthRequest, IJWTPayload } from "../types/user.types";
import prisma from "../config/database";
import emailService from "../utils/email.util";

class UserController {
  // Register a new user
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { firstName, lastName, email, password, gender, phone } = req.body;

      // Check if user already exists
      const existingUser = await userService.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Create new user
      const user = await userService.createUser({
        firstName,
        lastName,
        email,
        password,
        gender,
        phone,
      });

      // Generate OTP
      const otp = userService.generateOTP();
      await userService.saveOTP(email, otp);

      // Send OTP via email
      const emailSent = await emailService.sendOTPEmail(email, otp);

      if (!emailSent) {
        console.warn(`Failed to send OTP email to ${email}. OTP: ${otp}`);
      }

      return res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please verify your email with the OTP sent.",
        data: { user },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      return res.status(500).json({
        success: false,
        message: "Error registering user",
        error: error.message,
      });
    }
  }

  // Verify OTP
  async verifyOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { email, otp } = req.body;

      const result = await userService.verifyOTP(email, otp);

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Send welcome email
      const user = await userService.findUserByEmail(email);
      if (user) {
        await emailService.sendWelcomeEmail(email, user.firstName);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Error verifying OTP",
        error: error.message,
      });
    }
  }

  // Login
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await userService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Verify password
      if (!user.password) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const isValidPassword = await userService.verifyPassword(
        password,
        user.password
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email first",
        });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || "default-secret";
      const jwtExpire = process.env.JWT_EXPIRE || "7d";

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        jwtSecret,
        { expiresIn: jwtExpire } as jwt.SignOptions
      );

      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: { user: userWithoutPassword, token },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Error logging in",
        error: error.message,
      });
    }
  }

  // Get user profile
  async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as IAuthRequest).userId!;

      const user = await userService.findUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      console.error("Get profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching profile",
        error: error.message,
      });
    }
  }

  // Update user profile
  async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as IAuthRequest).userId!;
      const { firstName, lastName, gender, phone } = req.body;

      const user = await userService.updateUser(userId, {
        firstName,
        lastName,
        gender,
        phone,
      });

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user },
      });
    } catch (error: any) {
      console.error("Update profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating profile",
        error: error.message,
      });
    }
  }

  // Request password reset
  async requestPasswordReset(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      const user = await userService.findUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return res.status(200).json({
          success: true,
          message: "If the email exists, a reset link will be sent",
        });
      }

      // Generate reset token
      const jwtSecret = process.env.JWT_SECRET || "default-secret";

      const resetToken = jwt.sign({ userId: user.id }, jwtSecret, {
        expiresIn: "1h",
      } as jwt.SignOptions);

      await userService.saveResetToken(email, resetToken);

      // Send reset token via email
      const emailSent = await emailService.sendPasswordResetEmail(
        email,
        resetToken
      );

      if (!emailSent) {
        console.warn(`Failed to send password reset email to ${email}`);
      }

      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link will be sent",
      });
    } catch (error: any) {
      console.error("Password reset request error:", error);
      return res.status(500).json({
        success: false,
        message: "Error requesting password reset",
        error: error.message,
      });
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token, newPassword } = req.body;

      // Verify token
      const jwtSecret = process.env.JWT_SECRET || "default-secret";
      const decoded = jwt.verify(token, jwtSecret) as IJWTPayload;

      const user = await userService.findUserByIdInternal(decoded.userId);
      if (!user || user.resetToken !== token) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
        return res.status(400).json({
          success: false,
          message: "Reset token has expired",
        });
      }

      // Update password and clear reset token
      await userService.updateUser(decoded.userId, {
        password: newPassword,
      });

      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      return res.status(500).json({
        success: false,
        message: "Error resetting password",
        error: error.message,
      });
    }
  }

  // Get all users (admin)
  async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const result = await userService.getAllUsers(skip, limit);

      return res.status(200).json({
        success: true,
        data: {
          users: result.users,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Get all users error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  }
}

export default new UserController();
