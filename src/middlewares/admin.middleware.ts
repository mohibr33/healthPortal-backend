import { Request, Response, NextFunction } from "express";
import { IAuthRequest } from "../types/user.types";
import userService from "../services/user.service";

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = (req as IAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await userService.findUserByIdInternal(userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying admin privileges",
    });
  }
};
