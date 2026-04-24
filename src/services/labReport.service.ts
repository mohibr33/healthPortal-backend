import prisma from "../config/database";
import {
  IBiomarker,
  IReportSummary,
  ICriticalAlert,
  ILabReportResponse,
} from "../types/labReport.types";
import openaiService from "./openai.service";
import { readFile, unlink } from "fs/promises";
import * as path from "path";

class LabReportService {
  async uploadLabReport(
    userId: string,
    file: Express.Multer.File,
    metadata: {
      title?: string;
      testDate?: string;
      labName?: string;
    }
  ): Promise<ILabReportResponse> {
    try {
      const healthProfile = await prisma.healthProfile.findUnique({
        where: { userId },
      });

      const analysisResult = await this.analyzeLabReport(file.path, healthProfile);

      await unlink(file.path);

      const labReport = await prisma.labReport.create({
        data: {
          userId,
          title: metadata.title || "Lab Report",
          fileName: file.originalname,
          fileUrl: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          biomarkers: analysisResult.biomarkers as any,
          summary: analysisResult.summary as any,
          analysis: analysisResult.analysis,
          overallStatus: analysisResult.summary.overallStatus,
          criticalAlerts: analysisResult.criticalAlerts as any,
          testDate: metadata.testDate ? new Date(metadata.testDate) : null,
          labName: metadata.labName,
          healthProfileData: healthProfile as any,
          flaggedConditions: analysisResult.flaggedConditions as any,
          flaggedMedications: analysisResult.flaggedMedications as any,
          personalizedRecommendations: analysisResult.personalizedRecommendations,
          analyzedAt: new Date(),
        },
      });

      return this.formatLabReportResponse(labReport);
    } catch (error: any) {
      console.error("Error uploading lab report:", error);
      throw new Error(error.message);
    }
  }

  async analyzeLabReport(
    filePath: string,
    healthProfile?: any
  ): Promise<{
    biomarkers: IBiomarker[];
    summary: IReportSummary;
    analysis: string;
    criticalAlerts: ICriticalAlert[];
    flaggedConditions?: string[];
    flaggedMedications?: string[];
    personalizedRecommendations?: string;
  }> {
    try {
      const mimeType = this.getMimeType(filePath);
      const isPdf = mimeType === "application/pdf";

      let healthContext = "";
      if (healthProfile) {
        const conditions = healthProfile.medicalConditions as string[] || [];
        const medications = healthProfile.medications || "";
        const allergies = healthProfile.allergies as string[] || [];
        
        healthContext = `
HEALTH PROFILE CONTEXT:
- Age: ${healthProfile.age} years
- Medical Conditions: ${conditions.join(", ") || "None reported"}
- Current Medications: ${medications || "None reported"}
- Allergies: ${allergies.join(", ") || "None reported"}
- Special Conditions: ${JSON.stringify(healthProfile.specialConditions || [])}
- Primary Goal: ${healthProfile.primaryGoal || "Not specified"}
`;
      }

      const prompt = `You are an expert medical pathologist and clinical laboratory analyst with extensive knowledge of:
- Clinical hematology, chemistry, and immunology
- Biochemical markers and their clinical significance
- Disease pathophysiology and laboratory correlations
- Age and sex-specific reference ranges
- Drug-nutrient interactions and medication effects on lab values

TASK: Perform a comprehensive analysis of the laboratory report. Extract and analyze ALL test results with complete clinical detail.

${healthContext}

${isPdf ? "The report text is provided below. Extract all test results from it carefully." : "Analyze the attached lab report image carefully."}

EXTRACTION REQUIREMENTS - For EACH biomarker/test found, provide:
1. name: Exact test/biomarker name as shown in report
2. value: The numerical value reported (as exact as possible)
3. unit: Unit of measurement (must be accurate - e.g., mg/dL, mmol/L, g/dL, ng/mL, IU/L, etc.)
4. referenceRange: The reference/normal range provided in the report (both low and high values)
5. status: Classification based on value vs reference range:
   - "normal": Within reference range
   - "abnormal": Outside reference range but not immediately dangerous
   - "critical": Values indicating acute danger or immediate medical intervention needed
6. normalRange: Standard reference range for healthy adults (include age/sex specifics if applicable)
7. explanation: Detailed explanation of what this test measures and its clinical significance (2-3 sentences)
8. clinicalSignificance: Why this test matters in clinical practice
9. causes: 
   - For HIGH values: detailed list of conditions/factors causing elevation
   - For LOW values: detailed list of conditions/factors causing decrease
   - Include dietary, medication, lifestyle, and pathological causes
10. relatedConditions: Specific medical conditions strongly associated with abnormal values (minimum 3-5 conditions per test)
11. interpretationTips: Key clinical pearls about interpreting this test result
12. possibleDrugInteractions: Medications that could affect this value

ANALYSIS SECTION - Provide comprehensive assessment:

OVERALL ASSESSMENT:
- Complete overview of patient's laboratory profile
- Patterns noticed across multiple tests
- Organ system assessment (hepatic, renal, hematologic, metabolic, endocrine, cardiac, etc.)
- Severity assessment: Minor variation | Moderate abnormality | Significant pathology | Critical/Acute

CRITICAL FINDINGS (if any exist):
- Values requiring urgent medical attention
- Potential acute life-threatening conditions indicated
- Recommended immediate actions needed

CORRELATION WITH HEALTH PROFILE:
- How findings relate to reported medical conditions
- How findings relate to current medications
- Potential adverse drug effects evident in results
- Medication efficacy assessment where applicable
- Contraindicated medications based on lab results

DIFFERENTIAL DIAGNOSIS:
- Most likely conditions based on the pattern of abnormalities
- Less common but important diagnostic possibilities
- Conditions that must be ruled out

COMPREHENSIVE RECOMMENDATIONS:
1. Immediate actions (if any critical values)
2. Follow-up testing needed (specific tests and timeline)
3. Lifestyle modifications (diet, exercise, hydration, etc.)
4. Medication review recommendations
5. Specialist referrals if indicated
6. Monitoring parameters and frequency
7. When to seek urgent medical attention

SPECIAL CONSIDERATIONS:
- Seasonal, diurnal, or temporal variations to consider
- Fasting vs non-fasting impact on interpretation
- Any pre-analytical factors that might affect results
- Age-related variations in reference ranges
- Sex-related variations in interpretation

Return the response in EXACTLY this JSON format:
{
  "biomarkers": [
    {
      "name": "string - exact test name",
      "value": "string - exact value with decimals if present",
      "unit": "string - unit of measurement",
      "referenceRange": "string - low-high range from report",
      "status": "normal | abnormal | critical",
      "normalRange": "string - standard reference range with age/sex if applicable",
      "explanation": "string - 2-3 sentences on clinical significance",
      "clinicalSignificance": "string - why this test matters",
      "causes": ["string - detailed cause 1", "string - detailed cause 2", "..."],
      "relatedConditions": ["string - condition 1", "string - condition 2", "..."],
      "interpretationTips": "string - clinical pearls for interpretation",
      "possibleDrugInteractions": "string - medications affecting this value or null if none"
    }
  ],
  "summary": {
    "totalBiomarkers": number,
    "normalCount": number,
    "abnormalCount": number,
    "criticalCount": number,
    "overallStatus": "normal | abnormal | critical",
    "keyFindings": ["string - key finding 1", "string - key finding 2", "..."],
    "severityAssessment": "string - overall severity assessment"
  },
  "overallAssessment": "string - comprehensive overview of patient's laboratory status",
  "organSystemAssessment": {
    "hepatic": "string - assessment or null if no relevant tests",
    "renal": "string - assessment or null if no relevant tests",
    "cardiac": "string - assessment or null if no relevant tests",
    "hematologic": "string - assessment or null if no relevant tests",
    "metabolic": "string - assessment or null if no relevant tests",
    "endocrine": "string - assessment or null if no relevant tests"
  },
  "analysis": "string - detailed comprehensive analysis covering all findings, patterns, and correlations",
  "criticalAlerts": [
    {
      "biomarker": "string - test name",
      "value": "string - the actual value",
      "normalRange": "string - expected range",
      "severity": "critical | high",
      "message": "string - detailed explanation of why this is critical",
      "immediateRiskFactors": "string - what problems this could cause immediately",
      "recommendation": "string - specific urgent action needed",
      "timelineForAction": "string - urgency (within minutes/hours/24hrs)"
    }
  ],
  "correlationWithHealthProfile": {
    "conditionCorrelations": "string - how findings relate to known conditions",
    "medicationCorrelations": "string - relationship with current medications",
    "adverseDrugEffects": "string - potential medication side effects evident or null",
    "contraindications": ["string - medication or treatment to avoid"]
  },
  "differentialDiagnosis": [
    {
      "condition": "string - condition name",
      "likelihood": "high | moderate | low",
      "supportingFindings": ["string - lab findings supporting this", "..."],
      "nextStepsToConfirm": "string - tests needed to confirm"
    }
  ],
  "flaggedConditions": ["string - condition 1", "string - condition 2", "..."],
  "flaggedMedications": ["string - medication concern 1", "..."],
  "comprehensiveRecommendations": {
    "immediateActions": "string - urgent actions needed or null if none",
    "followUpTesting": ["string - test 1 (timeline)", "string - test 2 (timeline)", "..."],
    "lifestyleModifications": ["string - modification 1", "string - modification 2", "..."],
    "medicationReview": "string - medication adjustments or monitoring needed",
    "specialistReferrals": ["string - specialist type and reason", "..."],
    "monitoringParameters": ["string - what to monitor and frequency", "..."],
    "redFlagSymptoms": ["string - symptom requiring immediate attention", "..."]
  },
  "personalizedRecommendations": "string - comprehensive, detailed recommendations tailored to this patient's specific profile and results"
}`;

      let response: string;

      if (isPdf) {
        response = await this.extractPdfWithTesseract(filePath, prompt);
      } else {
        const imageBuffer = await readFile(filePath);
        const base64Image = imageBuffer.toString("base64");

        response = await openaiService.generateChatCompletion([
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ], true);
      }

      const cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      let result;
      try {
        const parsed = JSON.parse(cleanedResponse);
        result = parsed;
      } catch (parseError: any) {
        // Try to extract JSON from the response if it's wrapped in text
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          // Return a minimal valid structure instead of throwing
          console.error("Failed to parse response, using fallback");
          return {
            biomarkers: [],
            summary: { overallStatus: "critical", totalBiomarkers: 0, normalCount: 0, abnormalCount: 0, criticalCount: 0, keyFindings: [] },
            analysis: "Could not analyze the uploaded image. Please ensure it's a clear image of a lab report.",
            criticalAlerts: [],
            flaggedConditions: [],
            flaggedMedications: [],
            personalizedRecommendations: "Unable to generate recommendations due to analysis failure.",
          };
        }
      }

      return result;
    } catch (error: any) {
      console.error("Error analyzing lab report:", error);
      throw new Error("Failed to analyze lab report: " + error.message);
    }
  }

  async extractPdfWithTesseract(filePath: string, prompt: string): Promise<string> {
    const Tesseract = require("tesseract.js");
    const pdfToImg = require("pdf-to-img");
    const path = require("path");
    
    const pdfBuffer = await readFile(filePath);
    const outputPath = path.join(__dirname, "../temp-pdf-pages");
    
    const fs = require("fs");
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    console.log("Converting PDF to images...");
    const images = await pdfToImg(pdfBuffer, {
      width: 2000,
      height: 2000,
    });
    
    let fullText = "";
    
    for (const img of images) {
      console.log(`Processing page ${images.indexOf(img) + 1}...`);
      
      try {
        const worker = await Tesseract.createWorker("eng", 1, {
          logger: (m: any) => console.log(m),
        });
        
        const { data: { text } } = await worker.recognize(img.buffer);
        await worker.terminate();
        
        fullText += `\n\n--- Page ${images.indexOf(img) + 1} ---\n\n${text}`;
      } catch (pageError: any) {
        console.error(`Failed to process page ${images.indexOf(img) + 1}:`, pageError);
      }
    }
    
    fs.readdirSync(outputPath).forEach((file: any) => {
      fs.unlinkSync(path.join(outputPath, file));
    });
    
    const response = await openaiService.generateTextCompletion([
      {
        role: "user",
        content: prompt + "\n\n" + fullText,
      },
    ]);
    
    return response;
  }

  getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
      ".tiff": "image/tiff",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
    };
    return mimeTypes[ext] || "image/jpeg";
  }

  async getLabReports(
    userId: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ reports: ILabReportResponse[]; total: number }> {
    const [reports, total] = await Promise.all([
      prisma.labReport.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { uploadedAt: "desc" },
      }),
      prisma.labReport.count({ where: { userId } }),
    ]);

    return {
      reports: reports.map((r) => this.formatLabReportResponse(r)),
      total,
    };
  }

  async getLabReportById(
    userId: string,
    reportId: string
  ): Promise<ILabReportResponse | null> {
    const report = await prisma.labReport.findFirst({
      where: {
        id: reportId,
        userId,
      },
    });

    if (!report) return null;

    return this.formatLabReportResponse(report);
  }

  async shareLabReportWithDoctor(
    userId: string,
    reportId: string,
    doctorEmail: string
  ): Promise<ILabReportResponse> {
    const report = await prisma.labReport.updateMany({
      where: {
        id: reportId,
        userId,
      },
      data: {
        isSharedWithDoctor: true,
        sharedAt: new Date(),
        doctorEmail,
      },
    });

    if (report.count === 0) {
      throw new Error("Lab report not found");
    }

    const updatedReport = await prisma.labReport.findUnique({
      where: { id: reportId },
    });

    return this.formatLabReportResponse(updatedReport!);
  }

  async deleteLabReport(userId: string, reportId: string): Promise<void> {
    await prisma.labReport.deleteMany({
      where: {
        id: reportId,
        userId,
      },
    });
  }

  async getTrendData(userId: string, biomarkerName: string): Promise<any[]> {
    const reports = await prisma.labReport.findMany({
      where: { userId },
      orderBy: { uploadedAt: "asc" },
    });

    const trendData: any[] = [];

    reports.forEach((report) => {
      const biomarkers = report.biomarkers as unknown as IBiomarker[];
      const biomarker = biomarkers.find((b) =>
        b.name.toLowerCase().includes(biomarkerName.toLowerCase())
      );

      if (biomarker) {
        trendData.push({
          date: report.uploadedAt,
          value: biomarker.value,
          unit: biomarker.unit,
          status: biomarker.status,
          normalRange: biomarker.normalRange,
        });
      }
    });

    return trendData;
  }

  private formatLabReportResponse(
    report: any
  ): ILabReportResponse {
    return {
      id: report.id,
      userId: report.userId,
      title: report.title,
      fileName: report.fileName,
      fileUrl: report.fileUrl,
      biomarkers: report.biomarkers as unknown as IBiomarker[],
      summary: report.summary as unknown as IReportSummary,
      analysis: report.analysis,
      overallStatus: report.overallStatus,
      criticalAlerts: report.criticalAlerts as unknown as ICriticalAlert[],
      flaggedConditions: report.flaggedConditions as string[] | undefined,
      flaggedMedications: report.flaggedMedications as string[] | undefined,
      personalizedRecommendations: report.personalizedRecommendations,
      testDate: report.testDate ? report.testDate.toISOString() : undefined,
      labName: report.labName,
      uploadedAt: report.uploadedAt.toISOString(),
      analyzedAt: report.analyzedAt ? report.analyzedAt.toISOString() : undefined,
      isSharedWithDoctor: report.isSharedWithDoctor,
      doctorEmail: report.doctorEmail,
    };
  }
}

export default new LabReportService();
