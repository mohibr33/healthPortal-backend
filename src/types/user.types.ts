import { Request } from "express";

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string | null;
  role: string;
  gender?: string | null;
  phone?: string | null;
  isVerified: boolean;
  otp?: string | null;
  otpExpiry?: Date | null;
  googleId?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithoutPassword extends Omit<IUser, "password"> {}

export interface ICreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  password?: string | null;
  gender?: string;
  phone?: string;
  googleId?: string;
  isVerified?: boolean;
}

export interface IUpdateUserDTO {
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  password?: string;
  googleId?: string;
  isVerified?: boolean;
}

export interface ILoginDTO {
  email: string;
  password: string;
}

export interface IVerifyOTPDTO {
  email: string;
  otp: string;
}

export interface IResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface IJWTPayload {
  userId: string;
  email: string;
}

export interface IAuthRequest extends Request {
  userId?: string;
  email?: string;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: {
    users: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
