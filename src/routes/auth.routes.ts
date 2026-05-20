import { Router, Request, Response } from "express";
import passport from "../config/passport";
import jwt from "jsonwebtoken";

const router: Router = Router();

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get("/google/callback", (req: Request, res: Response, next) => {
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  passport.authenticate(
    "google",
    {
      session: false,
    },
    (err: any, user: any, info: any) => {
      // Handle authentication errors
      if (err) {
        console.error("Google OAuth error:", err);
        return res.redirect(
          `${frontendUrl}/login?error=authentication_failed&message=${encodeURIComponent(err.message || "Authentication error")}`
        );
      }

      // Handle missing user (authentication failed)
      if (!user) {
        console.error("Google OAuth: No user returned", info);
        const errorMessage =
          info?.message || "Authentication failed - no user returned";
        return res.redirect(
          `${frontendUrl}/login?error=authentication_failed&message=${encodeURIComponent(errorMessage)}`
        );
      }

      try {
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
        const jwtExpire = process.env.JWT_EXPIRE || "7d";
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
          },
          jwtSecret as jwt.Secret,
          { expiresIn: jwtExpire } as jwt.SignOptions
        );

        // Prepare user data
        const userData = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        };

        // Properly encode the user object
        const userString = encodeURIComponent(JSON.stringify(userData));

        // Redirect to frontend with token
        const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${userString}`;

        return res.redirect(redirectUrl);
      } catch (error: any) {
        console.error("Google OAuth callback error:", error);
        return res.redirect(
          `${frontendUrl}/login?error=server_error&message=${encodeURIComponent(error.message || "Server error")}`
        );
      }
    }
  )(req, res, next);
});

// @route   GET /api/auth/google/success
// @desc    Alternative success endpoint (returns JSON instead of redirect)
// @access  Public
router.get("/google/success", (req: Request, res: Response) => {
  const user = req.user as any;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }

  const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
  const jwtExpire = process.env.JWT_EXPIRE || "7d";
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret as jwt.Secret,
    { expiresIn: jwtExpire } as jwt.SignOptions
  );

  return res.status(200).json({
    success: true,
    message: "Google authentication successful",
    data: {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    },
  });
});

// @route   GET /api/auth/logout
// @desc    Logout user
// @access  Public
router.get("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });
});

export default router;
