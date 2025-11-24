import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import articleRoutes from "./routes/article.routes";
import ticketRoutes from "./routes/ticket.routes";
import medicineRoutes from "./routes/medicine.routes";
import mealPlanRoutes from "./routes/mealPlan.routes";
import emailService from "./utils/email.util";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
//add cors to allow all traffic
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/meal-planner", mealPlanRoutes);

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

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`👤 User API: http://localhost:${PORT}/api/users`);
  console.log(`👑 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`📰 Articles API: http://localhost:${PORT}/api/articles`);
  console.log(`🎫 Tickets API: http://localhost:${PORT}/api/tickets`);
  console.log(`💊 Medicines API: http://localhost:${PORT}/api/medicines`);
  console.log(
    `🍽️  Meal Planner API: http://localhost:${PORT}/api/meal-planner`
  );

  // Verify email service connection
  await emailService.verifyConnection();
});

export default app;
