import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { IAuthRequest, IJWTPayload } from "../types/user.types";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "default-secret";
    const decoded = jwt.verify(token, jwtSecret) as IJWTPayload;
    (req as IAuthRequest).userId = decoded.userId;
    (req as IAuthRequest).email = decoded.email;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
