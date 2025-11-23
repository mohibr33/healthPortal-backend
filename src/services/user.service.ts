import prisma from "../config/database";
import bcrypt from "bcryptjs";
import {
  ICreateUserDTO,
  IUpdateUserDTO,
  IUserWithoutPassword,
} from "../types/user.types";
import { User } from "@prisma/client";

class UserService {
  // Create a new user
  async createUser(userData: ICreateUserDTO): Promise<IUserWithoutPassword> {
    const { password, ...otherData } = userData;

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const user = await prisma.user.create({
      data: {
        ...otherData,
        password: hashedPassword,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  // Find user by ID
  async findUserById(id: string): Promise<IUserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  // Find user by ID (with all fields for internal operations)
  async findUserByIdInternal(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  // Find user by Google ID
  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { googleId },
    });
  }

  // Update user
  async updateUser(
    id: string,
    updateData: IUpdateUserDTO
  ): Promise<IUserWithoutPassword> {
    const { password, ...otherData } = updateData;

    const dataToUpdate: any = { ...otherData };

    // Hash password if it's being updated
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Delete user
  async deleteUser(id: string): Promise<User> {
    return await prisma.user.delete({
      where: { id },
    });
  }

  // Verify password
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Generate OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Save OTP for user
  async saveOTP(email: string, otp: string): Promise<User> {
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    return await prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpiry,
      },
    });
  }

  // Verify OTP
  async verifyOTP(
    email: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.findUserByEmail(email);

    if (!user || user.otp !== otp) {
      return { success: false, message: "Invalid OTP" };
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return { success: false, message: "OTP has expired" };
    }

    // Clear OTP and mark as verified
    await prisma.user.update({
      where: { email },
      data: {
        otp: null,
        otpExpiry: null,
        isVerified: true,
      },
    });

    return { success: true, message: "OTP verified successfully" };
  }

  // Save reset token
  async saveResetToken(email: string, resetToken: string): Promise<User> {
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

    return await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
  }

  // Get all users (admin function)
  async getAllUsers(
    skip: number = 0,
    take: number = 10
  ): Promise<{ users: IUserWithoutPassword[]; total: number }> {
    const users = await prisma.user.findMany({
      skip,
      take,
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
        googleId: true,
        resetToken: false,
        resetTokenExpiry: false,
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count();

    return { users, total };
  }
}

export default new UserService();
