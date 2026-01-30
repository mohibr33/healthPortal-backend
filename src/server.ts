import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import passport from "./config/passport";
import { connectDatabase } from "./config/database";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import articleRoutes from "./routes/article.routes";
import ticketRoutes from "./routes/ticket.routes";
import medicineRoutes from "./routes/medicine.routes";
import mealPlanRoutes from "./routes/mealPlan.routes";
import reviewRoutes from "./routes/review.routes";
import medicalChatRoutes from "./routes/medicalChat.routes";
import interactionRoutes from "./routes/interaction.routes";
import emailService from "./utils/email.util";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = 5050;

// Middleware
//add cors to allow all traffic
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for uploaded chat files)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/meal-planner", mealPlanRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/medical-chat", medicalChatRoutes);
app.use("/api/interactions", interactionRoutes);

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Digital Health Assistant API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler with Prisma-specific handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  // Log detailed error info
  console.error("Error:", {
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Handle Prisma-specific errors
  if (err.code) {
    switch (err.code) {
      case "P1001":
        res.status(503).json({
          success: false,
          message: "Database connection failed - server unreachable",
          error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
        return;
      case "P1002":
        res.status(503).json({
          success: false,
          message: "Database connection timed out",
          error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
        return;
      case "P2002":
        res.status(409).json({
          success: false,
          message: "A record with this value already exists",
        });
        return;
      case "P2025":
        res.status(404).json({
          success: false,
          message: "Record not found",
        });
        return;
    }
  }

  // Handle database connection errors
  if (err.message?.includes("connect") || err.message?.includes("ECONNREFUSED")) {
    res.status(503).json({
      success: false,
      message: "Database connection error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  
  // Check required environment variables
  if (!process.env.DATABASE_URL) {
    console.error("❌ FATAL: DATABASE_URL environment variable is not set!");
    console.error("   → Create a .env file with DATABASE_URL=postgresql://...");
    process.exit(1);
  }
  
  // Verify database connection
  const dbConnected = await connectDatabase();
  if (!dbConnected) {
    console.error("⚠️  Server running but database is NOT connected!");
    console.error("   → API endpoints requiring database will return 500 errors");
  }
  
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👤 User API: http://localhost:${PORT}/api/users`);
  console.log(`👑 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`📰 Articles API: http://localhost:${PORT}/api/articles`);
  console.log(`🎫 Tickets API: http://localhost:${PORT}/api/tickets`);
  console.log(`💊 Medicines API: http://localhost:${PORT}/api/medicines`);
  console.log(
    `🍽️  Meal Planner API: http://localhost:${PORT}/api/meal-planner`
  );
  console.log(`⭐ Reviews API: http://localhost:${PORT}/api/reviews`);
  console.log(`💬 Medical Chat API: http://localhost:${PORT}/api/medical-chat`);
  console.log(`🔬 Interactions API: http://localhost:${PORT}/api/interactions`);
  console.log(`🔗 Google OAuth: http://localhost:${PORT}/api/auth/google`);

  // Verify email service connection
  await emailService.verifyConnection();
});

export default app;
