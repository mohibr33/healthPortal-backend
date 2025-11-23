import { Request, Response } from "express";
import userService from "../services/user.service";
import prisma from "../config/database";

class AdminController {
  // Get all users with pagination
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

  // Get user by ID
  async getUserById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const user = await userService.findUserById(id);

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
      console.error("Get user by ID error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching user",
        error: error.message,
      });
    }
  }

  // Update user by ID
  async updateUser(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { firstName, lastName, gender, phone, role, isVerified } = req.body;

      // Check if user exists
      console.log("Updating user with ID:", id);
      const existingUser = await userService.findUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Build update data
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (gender !== undefined) updateData.gender = gender;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role;
      if (isVerified !== undefined) updateData.isVerified = isVerified;

      const user = await userService.updateUser(id, updateData);

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: { user },
      });
    } catch (error: any) {
      console.error("Update user error:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  }

  // Delete user by ID
  async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await userService.findUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await userService.deleteUser(id);

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete user error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting user",
        error: error.message,
      });
    }
  }

  // Search users by name or email
  async searchUsers(req: Request, res: Response): Promise<Response> {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const searchTerm = query.trim();

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { firstName: { contains: searchTerm, mode: "insensitive" } },
              { lastName: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            gender: true,
            phone: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            password: false,
            otp: false,
            otpExpiry: false,
            googleId: false,
            resetToken: false,
            resetTokenExpiry: false,
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({
          where: {
            OR: [
              { firstName: { contains: searchTerm, mode: "insensitive" } },
              { lastName: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Search users error:", error);
      return res.status(500).json({
        success: false,
        message: "Error searching users",
        error: error.message,
      });
    }
  }
}

export default new AdminController();
