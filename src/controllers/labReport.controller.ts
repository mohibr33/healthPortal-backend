import { Request, Response } from "express";
import { IAuthRequest } from "../types/user.types";
import labReportService from "../services/labReport.service";

class LabReportController {
  async uploadLabReport(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as IAuthRequest).userId!;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { title, testDate, labName } = req.body;

      const result = await labReportService.uploadLabReport(userId, req.file, {
        title,
        testDate,
        labName,
      });

      if ((result as any).error) {
        return res.status(400).json({
          success: false,
          message: (result as any).error,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Lab report uploaded and analyzed successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error uploading lab report:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading lab report",
        error: error.message,
      });
    }
  }

  async getLabReports(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as IAuthRequest).userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const result = await labReportService.getLabReports(userId, skip, limit);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error fetching lab reports:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching lab reports",
        error: error.message,
      });
    }
  }

  async getLabReportById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as IAuthRequest).userId!;
      const { id } = req.params;

      const report = await labReportService.getLabReportById(userId, id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Lab report not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: { report },
      });
    } catch (error: any) {
      console.error("Error fetching lab report:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching lab report",
        error: error.message,
      });
    }
  }

  async shareLabReport(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as IAuthRequest).userId!;
      const { id } = req.params;
      const { doctorEmail } = req.body;

      if (!doctorEmail) {
        return res.status(400).json({
          success: false,
          message: "Doctor email is required",
        });
      }

      const report = await labReportService.shareLabReportWithDoctor(
        userId,
        id,
        doctorEmail
      );

      return res.status(200).json({
        success: true,
        message: "Lab report shared successfully",
        data: { report },
      });
    } catch (error: any) {
      console.error("Error sharing lab report:", error);
      return res.status(500).json({
        success: false,
        message: "Error sharing lab report",
        error: error.message,
      });
    }
  }

  async deleteLabReport(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as IAuthRequest).userId!;
      const { id } = req.params;

      await labReportService.deleteLabReport(userId, id);

      return res.status(200).json({
        success: true,
        message: "Lab report deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting lab report:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting lab report",
        error: error.message,
      });
    }
  }

  async getTrendData(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as IAuthRequest).userId!;
      const { biomarker } = req.query;

      if (!biomarker) {
        return res.status(400).json({
          success: false,
          message: "Biomarker name is required",
        });
      }

      const trendData = await labReportService.getTrendData(
        userId,
        biomarker as string
      );

      return res.status(200).json({
        success: true,
        data: { trendData },
      });
    } catch (error: any) {
      console.error("Error fetching trend data:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching trend data",
        error: error.message,
      });
    }
  }
}

export default new LabReportController();
