import { Request, Response } from "express";
import userService from "../services/user.service";
import * as jwt from "jsonwebtoken";
import { IAuthRequest } from "../types/user.types";
import prisma from "../config/database";
import emailService from "../utils/email.util";
import bcrypt from "bcryptjs";

class UserController {
  // Register a new user - stores in PendingRegistration until verified
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { firstName, lastName, email, password, gender, phone } = req.body;

      // Check if verified user already exists
      const existingUser = await userService.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Delete any existing pending registration for this email
      await prisma.pendingRegistration.deleteMany({
        where: { email },
      });

      // Generate OTP
      const otp = userService.generateOTP();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // 10 minutes expiry

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create pending registration
      await prisma.pendingRegistration.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          gender,
          phone,
          otp,
          otpExpiry,
        },
      });

      // Send OTP via email
      const emailSent = await emailService.sendOTPEmail(email, otp);

      if (!emailSent) {
        console.warn(`Failed to send OTP email to ${email}. OTP: ${otp}`);
      }

      return res.status(201).json({
        success: true,
        message: "Registration initiated. Please verify your email with the OTP sent.",
        data: { email },
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

  // Verify OTP - creates actual user after verification
  async verifyOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { email, otp } = req.body;

      // Find pending registration
      const pending = await prisma.pendingRegistration.findUnique({
        where: { email },
      });

      if (!pending) {
        return res.status(404).json({
          success: false,
          message: "No pending registration found. Please register again.",
        });
      }

      // Verify OTP
      if (pending.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      // Check if OTP expired
      if (new Date() > pending.otpExpiry) {
        return res.status(400).json({
          success: false,
          message: "OTP has expired. Please request a new one.",
        });
      }

      // Create actual user (already verified)
      const user = await prisma.user.create({
        data: {
          firstName: pending.firstName,
          lastName: pending.lastName,
          email: pending.email,
          password: pending.password,
          gender: pending.gender,
          phone: pending.phone,
          isVerified: true,
        },
      });

      // Delete pending registration
      await prisma.pendingRegistration.delete({
        where: { email },
      });

      // Send welcome email
      await emailService.sendWelcomeEmail(email, user.firstName);

      return res.status(200).json({
        success: true,
        message: "Email verified successfully. You can now login.",
      });
    } catch (error: any) {
      console.error("OTP verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Error verifying OTP",
        error: error.message,
      });
    }
  }

  // Resend OTP for pending registration
  async resendOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // Find pending registration
      const pending = await prisma.pendingRegistration.findUnique({
        where: { email },
      });

      if (!pending) {
        return res.status(404).json({
          success: false,
          message: "No pending registration found. Please register again.",
        });
      }

      // Generate new OTP
      const otp = userService.generateOTP();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

      // Update pending registration with new OTP
      await prisma.pendingRegistration.update({
        where: { email },
        data: {
          otp,
          otpExpiry,
        },
      });

      // Send OTP via email
      const emailSent = await emailService.sendOTPEmail(email, otp);

      if (!emailSent) {
        console.warn(`Failed to send OTP email to ${email}. OTP: ${otp}`);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email. Please try again.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully. Please check your email.",
      });
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      return res.status(500).json({
        success: false,
        message: "Error resending OTP",
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
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

      // Save OTP and expiry in DB
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp,
          otpExpiry,
        },
      });

      // Send OTP via email
      await emailService.sendOTPEmail(email, otp);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully. Please check your email.",
      });
    } catch (error: any) {
      console.error("Request password reset error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email, otp, newPassword } = req.body;

      const user = await userService.findUserByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (!user.otp || user.otp !== otp) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      if (user.otpExpiry && new Date() > user.otpExpiry) {
        return res.status(400).json({ success: false, message: "OTP has expired" });
      }

      // Update password (hash it before saving)
      await userService.updateUser(user.id, { password: newPassword });

      // Clear OTP fields
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp: null,
          otpExpiry: null,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      return res.status(500).json({
        success: false,
        message: "Error resetting password",
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
