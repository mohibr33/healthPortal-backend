import OpenAI from "openai";
import prisma from "../config/database";
import {
  IInteractionScanResult,
  IMedicineInput,
  IHealthProfileSnapshot,
  IDrugInteraction,
  IAllergyAlert,
  IConditionConflict,
  IRegulatoryFlag,
  ISafetyFlag,
  InteractionSeverity,
  SafetyRiskLevel,
  IAIInteractionAnalysis,
} from "../types/interaction.types";
import { IMedicine } from "../types/medicine.types";

// JSON Schema for structured OpenAI response
const interactionAnalysisSchema = {
  name: "interaction_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      drugInteractions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            drug1: { type: "string" },
            drug2: { type: "string" },
            severity: { type: "string", enum: ["minor", "moderate", "major", "contraindicated"] },
            description: { type: "string" },
            mechanism: { type: "string" },
            clinicalEffects: { type: "string" },
            management: { type: "string" },
          },
          required: ["drug1", "drug2", "severity", "description", "mechanism", "clinicalEffects", "management"],
          additionalProperties: false,
        },
      },
      allergyRisks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            medicine: { type: "string" },
            allergen: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
            explanation: { type: "string" },
          },
          required: ["medicine", "allergen", "severity", "explanation"],
          additionalProperties: false,
        },
      },
      conditionRisks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            medicine: { type: "string" },
            condition: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
            explanation: { type: "string" },
            recommendation: { type: "string" },
          },
          required: ["medicine", "condition", "severity", "explanation", "recommendation"],
          additionalProperties: false,
        },
      },
      regulatoryWarnings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            medicine: { type: "string" },
            category: { type: "string" },
            warning: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          },
          required: ["medicine", "category", "warning", "severity"],
          additionalProperties: false,
        },
      },
      safetyAlerts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            medicine: { type: "string" },
            alertType: { type: "string" },
            message: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          },
          required: ["medicine", "alertType", "message", "severity"],
          additionalProperties: false,
        },
      },
      overallAssessment: { type: "string" },
      recommendations: { type: "array", items: { type: "string" } },
      disclaimer: { type: "string" },
    },
    required: [
      "drugInteractions",
      "allergyRisks",
      "conditionRisks",
      "regulatoryWarnings",
      "safetyAlerts",
      "overallAssessment",
      "recommendations",
      "disclaimer",
    ],
    additionalProperties: false,
  },
};

class InteractionService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Get user's health profile
  async getUserHealthProfile(userId: string): Promise<IHealthProfileSnapshot | null> {
    const profile = await prisma.healthProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { gender: true },
        },
      },
    });

    if (!profile) return null;

    const specialConditions = (profile.specialConditions as string[]) || [];

    return {
      allergies: (profile.allergies as string[]) || [],
      medicalConditions: (profile.medicalConditions as string[]) || [],
      specialConditions,
      age: profile.age,
      isPregnant: specialConditions.some((c) =>
        c.toLowerCase().includes("pregnant")
      ),
      isBreastfeeding: specialConditions.some(
        (c) =>
          c.toLowerCase().includes("breastfeed") ||
          c.toLowerCase().includes("lactating")
      ),
    };
  }

  // Get medicine details from database
  async getMedicineDetails(medicines: IMedicineInput[]): Promise<IMedicine[]> {
    const results: IMedicine[] = [];

    for (const med of medicines) {
      let medicine: IMedicine | null = null;

      // Try finding by ID first
      if (med.id) {
        medicine = await prisma.medicine.findUnique({
          where: { id: med.id },
        });
      }

      // Try finding by slug
      if (!medicine && med.slug) {
        medicine = await prisma.medicine.findUnique({
          where: { slug: med.slug },
        });
      }

      // Try finding by title (search)
      if (!medicine && med.name) {
        medicine = await prisma.medicine.findFirst({
          where: {
            OR: [
              { title: { contains: med.name, mode: "insensitive" } },
              { generics: { contains: med.name, mode: "insensitive" } },
            ],
          },
        });
      }

      if (medicine) {
        results.push(medicine);
      }
    }

    return results;
  }

  // Check database drug interactions (from medicine's drugInteractions field)
  checkDatabaseInteractions(medicines: IMedicine[]): IDrugInteraction[] {
    const interactions: IDrugInteraction[] = [];

    for (let i = 0; i < medicines.length; i++) {
      const med1 = medicines[i];
      const med1Interactions = (med1.drugInteractions || "").toLowerCase();

      for (let j = i + 1; j < medicines.length; j++) {
        const med2 = medicines[j];
        const med2Name = (med2.title || "").toLowerCase();
        const med2Generic = (med2.generics || "").toLowerCase();

        // Check if med1's interactions mention med2
        if (
          med1Interactions.includes(med2Name) ||
          (med2Generic && med1Interactions.includes(med2Generic))
        ) {
          interactions.push({
            drug1: med1.title,
            drug2: med2.title,
            severity: this.inferSeverityFromText(med1Interactions),
            description: `Potential interaction found in ${med1.title}'s drug interaction information.`,
          });
        }

        // Check reverse
        const med2Interactions = (med2.drugInteractions || "").toLowerCase();
        const med1Name = (med1.title || "").toLowerCase();
        const med1Generic = (med1.generics || "").toLowerCase();

        if (
          med2Interactions.includes(med1Name) ||
          (med1Generic && med2Interactions.includes(med1Generic))
        ) {
          // Avoid duplicate
          const exists = interactions.some(
            (i) =>
              (i.drug1 === med1.title && i.drug2 === med2.title) ||
              (i.drug1 === med2.title && i.drug2 === med1.title)
          );

          if (!exists) {
            interactions.push({
              drug1: med2.title,
              drug2: med1.title,
              severity: this.inferSeverityFromText(med2Interactions),
              description: `Potential interaction found in ${med2.title}'s drug interaction information.`,
            });
          }
        }
      }
    }

    return interactions;
  }

  // Infer severity from interaction text
  private inferSeverityFromText(text: string): InteractionSeverity {
    const lower = text.toLowerCase();

    if (
      lower.includes("contraindicated") ||
      lower.includes("do not use") ||
      lower.includes("avoid") ||
      lower.includes("fatal") ||
      lower.includes("life-threatening")
    ) {
      return "contraindicated";
    }

    if (
      lower.includes("major") ||
      lower.includes("serious") ||
      lower.includes("severe") ||
      lower.includes("significant")
    ) {
      return "major";
    }

    if (
      lower.includes("moderate") ||
      lower.includes("caution") ||
      lower.includes("monitor")
    ) {
      return "moderate";
    }

    return "minor";
  }

  // Check allergy alerts from health profile
  checkAllergyAlerts(
    medicines: IMedicine[],
    healthProfile: IHealthProfileSnapshot | null
  ): IAllergyAlert[] {
    if (!healthProfile || !healthProfile.allergies.length) return [];

    const alerts: IAllergyAlert[] = [];

    for (const medicine of medicines) {
      const searchText = [
        medicine.title,
        medicine.generics,
        medicine.sideEffects,
        medicine.whenNotToUse,
        medicine.precautions,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      for (const allergy of healthProfile.allergies) {
        const allergyLower = allergy.toLowerCase().trim();
        if (allergyLower && searchText.includes(allergyLower)) {
          alerts.push({
            medicine: medicine.title,
            allergen: allergy,
            severity: "high",
            message: `${medicine.title} may contain or be related to ${allergy}, which you are allergic to.`,
          });
        }
      }
    }

    return alerts;
  }

  // Check condition conflicts
  checkConditionConflicts(
    medicines: IMedicine[],
    healthProfile: IHealthProfileSnapshot | null
  ): IConditionConflict[] {
    if (!healthProfile || !healthProfile.medicalConditions.length) return [];

    const conflicts: IConditionConflict[] = [];

    for (const medicine of medicines) {
      const searchText = [
        medicine.whenNotToUse,
        medicine.precautions,
        medicine.warning1,
        medicine.warning2,
        medicine.warning3,
        medicine.sideEffects,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      for (const condition of healthProfile.medicalConditions) {
        const conditionLower = condition.toLowerCase().trim();
        if (conditionLower && searchText.includes(conditionLower)) {
          conflicts.push({
            medicine: medicine.title,
            condition: condition,
            severity: "medium",
            message: `${medicine.title} may not be suitable for patients with ${condition}.`,
            recommendation: "Consult your doctor before use.",
          });
        }
      }
    }

    return conflicts;
  }

  // Check regulatory flags
  checkRegulatoryFlags(
    medicines: IMedicine[],
    healthProfile: IHealthProfileSnapshot | null
  ): IRegulatoryFlag[] {
    const flags: IRegulatoryFlag[] = [];

    for (const medicine of medicines) {
      // Check pregnancy category
      const pregnancyCat = (medicine.pregnancyCategory || "").toLowerCase();

      if (healthProfile?.isPregnant) {
        if (
          pregnancyCat.includes("category x") ||
          pregnancyCat.includes("contraindicated")
        ) {
          flags.push({
            medicine: medicine.title,
            flag: "Pregnancy Category X - Contraindicated",
            category: "pregnancy",
            severity: "critical",
            details:
              "This medication is contraindicated during pregnancy due to risk of fetal harm.",
          });
        } else if (pregnancyCat.includes("category d")) {
          flags.push({
            medicine: medicine.title,
            flag: "Pregnancy Category D - Positive Evidence of Risk",
            category: "pregnancy",
            severity: "high",
            details:
              "There is positive evidence of human fetal risk. Use only if benefit outweighs risk.",
          });
        } else if (pregnancyCat.includes("category c")) {
          flags.push({
            medicine: medicine.title,
            flag: "Pregnancy Category C - Risk Cannot Be Ruled Out",
            category: "pregnancy",
            severity: "medium",
            details:
              "Animal studies have shown adverse effects. Use with caution during pregnancy.",
          });
        }
      }

      if (healthProfile?.isBreastfeeding) {
        const precautions = (medicine.precautions || "").toLowerCase();
        const warnings = [
          medicine.warning1,
          medicine.warning2,
          medicine.warning3,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (
          precautions.includes("breastfeed") ||
          precautions.includes("lactating") ||
          warnings.includes("breastfeed") ||
          warnings.includes("lactating")
        ) {
          flags.push({
            medicine: medicine.title,
            flag: "Breastfeeding Warning",
            category: "breastfeeding",
            severity: "medium",
            details:
              "This medication may pass into breast milk. Consult your doctor before use.",
          });
        }
      }

      // Check if prescription required
      if (medicine.requiresPrescription) {
        flags.push({
          medicine: medicine.title,
          flag: "Prescription Required",
          category: "controlled",
          severity: "low",
          details:
            "This medication requires a valid prescription from a licensed healthcare provider.",
        });
      }
    }

    return flags;
  }

  // Check safety flags
  checkSafetyFlags(medicines: IMedicine[]): ISafetyFlag[] {
    const flags: ISafetyFlag[] = [];

    for (const medicine of medicines) {
      // Check for warnings
      const allWarnings = [
        medicine.warning1,
        medicine.warning2,
        medicine.warning3,
      ].filter(Boolean);

      for (const warning of allWarnings) {
        const warningLower = (warning || "").toLowerCase();

        if (
          warningLower.includes("black box") ||
          warningLower.includes("boxed warning")
        ) {
          flags.push({
            medicine: medicine.title,
            type: "black_box_warning",
            severity: "critical",
            message: "This medication has a Black Box Warning from the FDA.",
            details: warning || undefined,
          });
        }
      }

      // Check side effects for severe warnings
      const sideEffects = (medicine.sideEffects || "").toLowerCase();
      if (
        sideEffects.includes("severe") ||
        sideEffects.includes("life-threatening") ||
        sideEffects.includes("fatal")
      ) {
        flags.push({
          medicine: medicine.title,
          type: "interaction_warning",
          severity: "high",
          message: `${medicine.title} may cause severe side effects.`,
          details: "Monitor for adverse reactions and seek immediate medical attention if needed.",
        });
      }
    }

    return flags;
  }

  // Get AI analysis using OpenAI
  async getAIAnalysis(
    medicines: IMedicine[],
    healthProfile: IHealthProfileSnapshot | null,
    dbInteractions: IDrugInteraction[]
  ): Promise<IAIInteractionAnalysis | null> {
    if (!medicines.length) return null;

    const medicineInfo = medicines.map((m) => ({
      name: m.title,
      generic: m.generics,
      usedFor: m.usedFor,
      drugInteractions: m.drugInteractions,
      sideEffects: m.sideEffects,
      whenNotToUse: m.whenNotToUse,
      precautions: m.precautions,
      pregnancyCategory: m.pregnancyCategory,
      warnings: [m.warning1, m.warning2, m.warning3].filter(Boolean),
    }));

    const systemPrompt = `You are a clinical pharmacist expert specializing in drug interactions, contraindications, and medication safety. Analyze the provided medications for potential interactions and safety concerns.

Your analysis MUST be evidence-based and clinically relevant. Consider:
1. Drug-drug pharmacokinetic and pharmacodynamic interactions
2. Allergy cross-reactivity (if allergies are provided)
3. Contraindications with medical conditions (if conditions are provided)
4. Special population warnings (pregnancy, breastfeeding, etc.)
5. Black box warnings and FDA alerts
6. Severity classification based on clinical significance

Severity Guidelines:
- contraindicated: Should not be used together under any circumstances
- major: May cause serious clinical consequences, requires intervention
- moderate: May exacerbate condition or require therapy modification
- minor: Limited clinical significance, monitor if needed

Safety Risk Levels:
- critical: Immediate danger, do not use
- high: Significant risk, medical supervision required
- medium: Moderate concern, use with caution
- low: Minor concern, general awareness

IMPORTANT: Only report interactions and concerns that are clinically significant. Do not invent interactions that don't exist.`;

    const userPrompt = `Analyze these medications for interactions and safety concerns:

MEDICATIONS:
${JSON.stringify(medicineInfo, null, 2)}

${healthProfile ? `PATIENT HEALTH PROFILE:
- Allergies: ${healthProfile.allergies.join(", ") || "None reported"}
- Medical Conditions: ${healthProfile.medicalConditions.join(", ") || "None reported"}
- Special Conditions: ${healthProfile.specialConditions.join(", ") || "None reported"}
- Age: ${healthProfile.age || "Not specified"}
- Pregnant: ${healthProfile.isPregnant ? "Yes" : "No"}
- Breastfeeding: ${healthProfile.isBreastfeeding ? "Yes" : "No"}` : "No health profile available."}

${dbInteractions.length > 0 ? `DATABASE-IDENTIFIED INTERACTIONS (verify and expand):
${JSON.stringify(dbInteractions, null, 2)}` : ""}

Provide a comprehensive analysis including:
1. All drug-drug interactions with severity and management
2. Allergy risks based on the patient's allergies
3. Condition-related risks based on the patient's medical conditions
4. Regulatory warnings (pregnancy, breastfeeding, etc.)
5. Safety alerts and warnings
6. Overall assessment and recommendations`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: interactionAnalysisSchema,
        },
        temperature: 0.3,
        max_tokens: 4000,
      });

      const content = completion.choices[0].message.content;
      if (!content) return null;

      return JSON.parse(content) as IAIInteractionAnalysis;
    } catch (error: any) {
      console.error("OpenAI API Error:", error.message);
      return null;
    }
  }

  // Main method to check all interactions
  async checkInteractions(
    userId: string,
    medicineInputs: IMedicineInput[],
    includeAIAnalysis: boolean = true
  ): Promise<IInteractionScanResult> {
    // Get health profile
    const healthProfile = await this.getUserHealthProfile(userId);

    // Get medicine details from database
    const medicines = await this.getMedicineDetails(medicineInputs);

    // If no medicines found, return empty result with input names
    if (medicines.length === 0) {
      return {
        medicines: medicineInputs,
        drugInteractions: [],
        allergyAlerts: [],
        conditionConflicts: [],
        regulatoryFlags: [],
        safetyFlags: [],
        summary: {
          totalInteractions: 0,
          criticalCount: 0,
          majorCount: 0,
          moderateCount: 0,
          minorCount: 0,
          overallRisk: "low",
          hasHealthProfile: !!healthProfile,
          recommendation: medicines.length === 0 
            ? "No medicines found in our database. Please verify the medicine names."
            : "No interactions detected.",
        },
        scannedAt: new Date(),
      };
    }

    // Check database interactions
    const dbInteractions = this.checkDatabaseInteractions(medicines);

    // Check allergy alerts
    const allergyAlerts = this.checkAllergyAlerts(medicines, healthProfile);

    // Check condition conflicts
    const conditionConflicts = this.checkConditionConflicts(medicines, healthProfile);

    // Check regulatory flags
    const regulatoryFlags = this.checkRegulatoryFlags(medicines, healthProfile);

    // Check safety flags
    const safetyFlags = this.checkSafetyFlags(medicines);

    // Initialize result
    let drugInteractions = dbInteractions;
    let aiAnalysisText: string | undefined;

    // Get AI analysis if requested
    if (includeAIAnalysis && medicines.length > 0) {
      const aiAnalysis = await this.getAIAnalysis(
        medicines,
        healthProfile,
        dbInteractions
      );

      if (aiAnalysis) {
        // Merge AI drug interactions with database interactions
        for (const aiInt of aiAnalysis.drugInteractions) {
          const exists = drugInteractions.some(
            (i) =>
              (i.drug1.toLowerCase() === aiInt.drug1.toLowerCase() &&
                i.drug2.toLowerCase() === aiInt.drug2.toLowerCase()) ||
              (i.drug1.toLowerCase() === aiInt.drug2.toLowerCase() &&
                i.drug2.toLowerCase() === aiInt.drug1.toLowerCase())
          );

          if (!exists) {
            drugInteractions.push({
              drug1: aiInt.drug1,
              drug2: aiInt.drug2,
              severity: aiInt.severity as InteractionSeverity,
              description: aiInt.description,
              mechanism: aiInt.mechanism,
              clinicalEffects: aiInt.clinicalEffects,
              management: aiInt.management,
            });
          } else {
            // Update existing with more details from AI
            const idx = drugInteractions.findIndex(
              (i) =>
                (i.drug1.toLowerCase() === aiInt.drug1.toLowerCase() &&
                  i.drug2.toLowerCase() === aiInt.drug2.toLowerCase()) ||
                (i.drug1.toLowerCase() === aiInt.drug2.toLowerCase() &&
                  i.drug2.toLowerCase() === aiInt.drug1.toLowerCase())
            );
            if (idx !== -1) {
              drugInteractions[idx] = {
                ...drugInteractions[idx],
                severity: aiInt.severity as InteractionSeverity,
                description: aiInt.description,
                mechanism: aiInt.mechanism,
                clinicalEffects: aiInt.clinicalEffects,
                management: aiInt.management,
              };
            }
          }
        }

        // Add AI allergy risks
        for (const aiAllergy of aiAnalysis.allergyRisks) {
          const exists = allergyAlerts.some(
            (a) =>
              a.medicine.toLowerCase() === aiAllergy.medicine.toLowerCase() &&
              a.allergen.toLowerCase() === aiAllergy.allergen.toLowerCase()
          );
          if (!exists) {
            allergyAlerts.push({
              medicine: aiAllergy.medicine,
              allergen: aiAllergy.allergen,
              severity: aiAllergy.severity as SafetyRiskLevel,
              message: aiAllergy.explanation,
            });
          }
        }

        // Add AI condition risks
        for (const aiCondition of aiAnalysis.conditionRisks) {
          const exists = conditionConflicts.some(
            (c) =>
              c.medicine.toLowerCase() === aiCondition.medicine.toLowerCase() &&
              c.condition.toLowerCase() === aiCondition.condition.toLowerCase()
          );
          if (!exists) {
            conditionConflicts.push({
              medicine: aiCondition.medicine,
              condition: aiCondition.condition,
              severity: aiCondition.severity as SafetyRiskLevel,
              message: aiCondition.explanation,
              recommendation: aiCondition.recommendation,
            });
          }
        }

        // Store AI assessment
        aiAnalysisText = `${aiAnalysis.overallAssessment}\n\n**Recommendations:**\n${aiAnalysis.recommendations.map((r) => `• ${r}`).join("\n")}\n\n_${aiAnalysis.disclaimer}_`;
      }
    }

    // Calculate summary
    const criticalCount =
      drugInteractions.filter((i) => i.severity === "contraindicated").length +
      allergyAlerts.filter((a) => a.severity === "critical").length +
      regulatoryFlags.filter((f) => f.severity === "critical").length +
      safetyFlags.filter((f) => f.severity === "critical").length;

    const majorCount =
      drugInteractions.filter((i) => i.severity === "major").length +
      conditionConflicts.filter((c) => c.severity === "high").length +
      regulatoryFlags.filter((f) => f.severity === "high").length +
      safetyFlags.filter((f) => f.severity === "high").length;

    const moderateCount =
      drugInteractions.filter((i) => i.severity === "moderate").length +
      conditionConflicts.filter((c) => c.severity === "medium").length +
      allergyAlerts.filter((a) => a.severity === "medium").length;

    const minorCount =
      drugInteractions.filter((i) => i.severity === "minor").length +
      conditionConflicts.filter((c) => c.severity === "low").length;

    const totalInteractions =
      drugInteractions.length +
      allergyAlerts.length +
      conditionConflicts.length;

    // Determine overall risk
    let overallRisk: SafetyRiskLevel = "low";
    let recommendation = "No significant interactions detected. Use medications as directed.";

    if (criticalCount > 0) {
      overallRisk = "critical";
      recommendation =
        "CRITICAL: Serious interactions detected. Do NOT use these medications together without consulting a doctor immediately.";
    } else if (majorCount > 0) {
      overallRisk = "high";
      recommendation =
        "HIGH RISK: Major interactions detected. Consult your healthcare provider before taking these medications together.";
    } else if (moderateCount > 0) {
      overallRisk = "medium";
      recommendation =
        "MODERATE CONCERN: Some interactions found. Use with caution and monitor for side effects.";
    } else if (minorCount > 0) {
      overallRisk = "low";
      recommendation =
        "LOW RISK: Minor interactions possible. Generally safe but be aware of potential effects.";
    }

    return {
      medicines: medicines.map((m) => ({
        id: m.id,
        name: m.title,
        genericName: m.generics || undefined,
        slug: m.slug,
      })),
      drugInteractions,
      allergyAlerts,
      conditionConflicts,
      regulatoryFlags,
      safetyFlags,
      summary: {
        totalInteractions,
        criticalCount,
        majorCount,
        moderateCount,
        minorCount,
        overallRisk,
        hasHealthProfile: !!healthProfile,
        recommendation,
      },
      aiAnalysis: aiAnalysisText,
      scannedAt: new Date(),
    };
  }

  // Quick check without AI (faster)
  async quickCheck(
    userId: string,
    medicineInputs: IMedicineInput[]
  ): Promise<IInteractionScanResult> {
    return this.checkInteractions(userId, medicineInputs, false);
  }

  // Save interaction scan to database
  async saveScan(
    userId: string,
    result: IInteractionScanResult
  ): Promise<{ id: string; createdAt: Date }> {
    const saved = await prisma.interactionScan.create({
      data: {
        userId,
        medicines: result.medicines as any,
        drugInteractions: result.drugInteractions as any,
        allergyAlerts: result.allergyAlerts as any,
        conditionConflicts: result.conditionConflicts as any,
        regulatoryFlags: result.regulatoryFlags as any,
        safetyFlags: result.safetyFlags as any,
        summary: result.summary as any,
        aiAnalysis: result.aiAnalysis || null,
        overallRisk: result.summary.overallRisk,
        healthProfileUsed: result.summary.hasHealthProfile,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return saved;
  }

  // Get user's scan history
  async getScanHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    scans: Array<{
      id: string;
      medicines: IMedicineInput[];
      summary: IInteractionScanResult["summary"];
      overallRisk: string;
      healthProfileUsed: boolean;
      createdAt: Date;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      prisma.interactionScan.findMany({
        where: { userId },
        select: {
          id: true,
          medicines: true,
          summary: true,
          overallRisk: true,
          healthProfileUsed: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.interactionScan.count({ where: { userId } }),
    ]);

    return {
      scans: scans.map((s) => ({
        id: s.id,
        medicines: s.medicines as unknown as IMedicineInput[],
        summary: s.summary as unknown as IInteractionScanResult["summary"],
        overallRisk: s.overallRisk,
        healthProfileUsed: s.healthProfileUsed,
        createdAt: s.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get a specific scan by ID
  async getScanById(
    userId: string,
    scanId: string
  ): Promise<IInteractionScanResult | null> {
    const scan = await prisma.interactionScan.findFirst({
      where: { id: scanId, userId },
    });

    if (!scan) return null;

    return {
      medicines: scan.medicines as unknown as IMedicineInput[],
      drugInteractions: scan.drugInteractions as unknown as IInteractionScanResult["drugInteractions"],
      allergyAlerts: scan.allergyAlerts as unknown as IInteractionScanResult["allergyAlerts"],
      conditionConflicts: scan.conditionConflicts as unknown as IInteractionScanResult["conditionConflicts"],
      regulatoryFlags: scan.regulatoryFlags as unknown as IInteractionScanResult["regulatoryFlags"],
      safetyFlags: scan.safetyFlags as unknown as IInteractionScanResult["safetyFlags"],
      summary: scan.summary as unknown as IInteractionScanResult["summary"],
      aiAnalysis: scan.aiAnalysis || undefined,
      scannedAt: scan.createdAt,
    };
  }

  // Delete a scan
  async deleteScan(userId: string, scanId: string): Promise<boolean> {
    const deleted = await prisma.interactionScan.deleteMany({
      where: { id: scanId, userId },
    });

    return deleted.count > 0;
  }

  // Get latest scan for user
  async getLatestScan(userId: string): Promise<IInteractionScanResult | null> {
    const scan = await prisma.interactionScan.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!scan) return null;

    return {
      medicines: scan.medicines as unknown as IMedicineInput[],
      drugInteractions: scan.drugInteractions as unknown as IInteractionScanResult["drugInteractions"],
      allergyAlerts: scan.allergyAlerts as unknown as IInteractionScanResult["allergyAlerts"],
      conditionConflicts: scan.conditionConflicts as unknown as IInteractionScanResult["conditionConflicts"],
      regulatoryFlags: scan.regulatoryFlags as unknown as IInteractionScanResult["regulatoryFlags"],
      safetyFlags: scan.safetyFlags as unknown as IInteractionScanResult["safetyFlags"],
      summary: scan.summary as unknown as IInteractionScanResult["summary"],
      aiAnalysis: scan.aiAnalysis || undefined,
      scannedAt: scan.createdAt,
    };
  }
}

export default new InteractionService();
