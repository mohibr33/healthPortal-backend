import { Request, Response, NextFunction } from "express";
import medicineService from "../services/medicine.service";
import healthProfileService from "../services/healthProfile.service";
import { IAuthRequest } from "../types/user.types";
import { 
  IMedicine, 
  IMedicineResponse, 
  IRiskEvaluation, 
  IRiskFactor, 
  RiskLevel,
  IHealthProfileForRisk 
} from "../types/medicine.types";

// Helper function to check allergy warnings for a medicine
const checkAllergyWarnings = (medicine: IMedicine, allergies: string[]): string[] => {
  if (!allergies || allergies.length === 0) return [];
  
  const warnings: string[] = [];
  const fieldsToCheck = [
    medicine.generics,
    medicine.whenNotToUse,
    medicine.sideEffects,
    medicine.drugInteractions,
    medicine.precautions,
    medicine.title,
  ];

  for (const allergy of allergies) {
    const allergyLower = allergy.toLowerCase().trim();
    if (!allergyLower) continue;
    
    for (const field of fieldsToCheck) {
      if (field && field.toLowerCase().includes(allergyLower)) {
        if (!warnings.includes(allergy)) {
          warnings.push(allergy);
        }
        break;
      }
    }
  }

  return warnings;
};

// Helper function to evaluate risk based on health profile
const evaluateRisk = (
  medicine: IMedicine, 
  healthProfile: IHealthProfileForRisk | null
): IRiskEvaluation => {
  // No profile - return default safe with no profile flag
  if (!healthProfile) {
    return {
      level: "safe",
      message: "No health profile found. Create a profile for personalized risk assessment.",
      factors: [],
      hasProfile: false,
    };
  }

  const factors: IRiskFactor[] = [];
  
  // Fields to search in medicine for risk matching
  const searchFields = {
    whenNotToUse: medicine.whenNotToUse || "",
    sideEffects: medicine.sideEffects || "",
    precautions: medicine.precautions || "",
    drugInteractions: medicine.drugInteractions || "",
    warning1: medicine.warning1 || "",
    warning2: medicine.warning2 || "",
    warning3: medicine.warning3 || "",
    generics: medicine.generics || "",
    pregnancyCategory: medicine.pregnancyCategory || "",
  };
  
  const allSearchText = Object.values(searchFields).join(" ").toLowerCase();

  // 1. Check allergies (HIGH RISK)
  const allergies = healthProfile.allergies || [];
  for (const allergy of allergies) {
    const allergyLower = allergy.toLowerCase().trim();
    if (!allergyLower) continue;
    
    if (allSearchText.includes(allergyLower)) {
      factors.push({
        type: "allergy",
        severity: "high_risk",
        match: allergy,
        message: `Not suitable due to your ${allergy} allergy`,
      });
    }
  }

  // 2. Check medical conditions (CAUTION or HIGH RISK)
  const conditions = healthProfile.medicalConditions || [];
  const highRiskConditions: Record<string, string[]> = {
    "diabetes": ["diabetes", "diabetic", "blood sugar", "glucose", "insulin"],
    "hypertension": ["hypertension", "blood pressure", "bp", "antihypertensive"],
    "heart disease": ["heart", "cardiac", "cardiovascular", "coronary"],
    "kidney disease": ["kidney", "renal", "nephro"],
    "liver disease": ["liver", "hepatic", "hepato"],
    "asthma": ["asthma", "bronchial", "respiratory"],
    "thyroid": ["thyroid", "hypothyroid", "hyperthyroid"],
  };

  for (const condition of conditions) {
    const conditionLower = condition.toLowerCase().trim();
    if (!conditionLower) continue;
    
    // Check for direct match
    if (allSearchText.includes(conditionLower)) {
      factors.push({
        type: "condition",
        severity: "caution",
        match: condition,
        message: `May affect your ${condition}. Consult doctor before use.`,
      });
    }
    
    // Check for related terms
    for (const [key, terms] of Object.entries(highRiskConditions)) {
      if (conditionLower.includes(key) || key.includes(conditionLower)) {
        for (const term of terms) {
          if (allSearchText.includes(term)) {
            // Check if already added
            const alreadyAdded = factors.some(f => 
              f.type === "condition" && f.match.toLowerCase() === condition.toLowerCase()
            );
            if (!alreadyAdded) {
              factors.push({
                type: "condition",
                severity: "caution",
                match: condition,
                message: `May affect your ${condition}. Consult doctor before use.`,
              });
            }
            break;
          }
        }
      }
    }
  }

  // 3. Check current medications for drug interactions (CAUTION or HIGH RISK)
  const medications = healthProfile.medications || "";
  if (medications.trim()) {
    const medicationList = medications.split(/[,;\n]/).map(m => m.trim().toLowerCase()).filter(m => m);
    const drugInteractionsLower = (medicine.drugInteractions || "").toLowerCase();
    
    for (const med of medicationList) {
      if (med && drugInteractionsLower.includes(med)) {
        factors.push({
          type: "medication",
          severity: "caution",
          match: med,
          message: `May interact with ${med}. Check drug interactions.`,
        });
      }
    }
  }

  // 4. Check special conditions (pregnancy, breastfeeding) - HIGH RISK for certain categories
  const specialConditions = healthProfile.specialConditions || [];
  const pregnancyTerms = ["pregnant", "pregnancy", "breastfeeding", "lactating", "nursing"];
  
  for (const special of specialConditions) {
    const specialLower = special.toLowerCase().trim();
    if (!specialLower) continue;
    
    // Check if it's pregnancy related
    const isPregnancyRelated = pregnancyTerms.some(term => specialLower.includes(term));
    
    if (isPregnancyRelated) {
      const pregnancyCat = (medicine.pregnancyCategory || "").toLowerCase();
      
      // Check for high-risk pregnancy categories (C, D, X)
      if (pregnancyCat.includes("category x") || pregnancyCat.includes("contraindicated")) {
        factors.push({
          type: "pregnancy",
          severity: "high_risk",
          match: special,
          message: `Contraindicated during ${special.toLowerCase()}`,
        });
      } else if (pregnancyCat.includes("category d") || pregnancyCat.includes("category c")) {
        factors.push({
          type: "pregnancy",
          severity: "caution",
          match: special,
          message: `Use with caution during ${special.toLowerCase()}. Consult doctor.`,
        });
      } else if (allSearchText.includes("pregnant") || allSearchText.includes("pregnancy") || 
                 allSearchText.includes("breastfeed") || allSearchText.includes("lactating")) {
        factors.push({
          type: "pregnancy",
          severity: "caution",
          match: special,
          message: `Precautions for ${special.toLowerCase()}. Consult doctor.`,
        });
      }
    } else {
      // Other special conditions
      if (allSearchText.includes(specialLower)) {
        factors.push({
          type: "condition",
          severity: "caution",
          match: special,
          message: `May not be suitable for ${special}`,
        });
      }
    }
  }

  // Determine overall risk level
  let level: RiskLevel = "safe";
  let message = "No known risks based on your health profile.";

  const hasHighRisk = factors.some(f => f.severity === "high_risk");
  const hasCaution = factors.some(f => f.severity === "caution");

  if (hasHighRisk) {
    level = "high_risk";
    const highRiskFactors = factors.filter(f => f.severity === "high_risk");
    message = highRiskFactors[0].message;
  } else if (hasCaution) {
    level = "caution";
    const cautionFactors = factors.filter(f => f.severity === "caution");
    message = cautionFactors.length > 1 
      ? `${cautionFactors.length} potential concerns found. Review details.`
      : cautionFactors[0].message;
  }

  return {
    level,
    message,
    factors,
    hasProfile: true,
  };
};

// Helper function to format medicine response
const formatMedicineResponse = (
  medicine: IMedicine, 
  allergies: string[] = [],
  riskEvaluation?: IRiskEvaluation
): IMedicineResponse => {
  const response: IMedicineResponse = {
    id: medicine.id,
    productId: medicine.productId,
    slug: medicine.slug,
    title: medicine.title,
    productImage: medicine.productImage,
    brand: medicine.brand,
    usedFor: medicine.usedFor,
    childCategory: medicine.childCategory,
    productDetails: {
      howItWorks: medicine.howItWorks,
      description: medicine.description,
      generics: medicine.generics,
      usedFor: medicine.usedFor,
      requiresPrescriptionYesNo: medicine.requiresPrescription ? "Yes" : "No",
      indication: medicine.indication,
      sideEffects: medicine.sideEffects,
      whenNotToUse: medicine.whenNotToUse,
      dosage: medicine.dosage,
      storageYesOrNo: medicine.storage,
      precautions: medicine.precautions,
      warning1: medicine.warning1,
      warning2: medicine.warning2,
      warning3: medicine.warning3,
      pregnancyCategory: medicine.pregnancyCategory,
      drugInteractions: medicine.drugInteractions,
    },
    createdAt: medicine.createdAt,
    updatedAt: medicine.updatedAt,
  };

  // Add allergy warnings if allergies are provided
  if (allergies.length > 0) {
    response.allergyWarnings = checkAllergyWarnings(medicine, allergies);
  }

  // Add risk evaluation if provided
  if (riskEvaluation) {
    response.riskEvaluation = riskEvaluation;
  }

  return response;
};

// Create medicine (Admin)
export const createMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let medicineData = req.body;
    const userId = (req as IAuthRequest).userId!;

    // Flatten productDetails if it exists
    if (
      medicineData.productDetails &&
      typeof medicineData.productDetails === "object"
    ) {
      const { productDetails, ...rest } = medicineData;
      medicineData = {
        ...rest,
        ...productDetails,
      };
    }

    // Map requiresPrescriptionYesNo to requiresPrescription
    if (medicineData.requiresPrescriptionYesNo !== undefined) {
      medicineData.requiresPrescription =
        medicineData.requiresPrescriptionYesNo === "Yes";
      delete medicineData.requiresPrescriptionYesNo;
    }

    // Check if product ID already exists
    const existingMedicine = await medicineService.findMedicineByProductId(
      medicineData.productId
    );
    if (existingMedicine) {
      res.status(400).json({
        success: false,
        message: "Medicine with this Product ID already exists",
      });
      return;
    }

    const medicine = await medicineService.createMedicine(medicineData, userId);

    res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: formatMedicineResponse(medicine),
    });
  } catch (error) {
    next(error);
  }
};

// Get all medicines (Public)
export const getAllMedicines = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Parse allergies from query string
    const allergiesParam = req.query.allergies as string;
    const allergies = allergiesParam 
      ? allergiesParam.split(",").map(a => a.trim()).filter(a => a.length > 0)
      : [];

    const { medicines, total } = await medicineService.getAllMedicines(
      skip,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        medicines: medicines.map(m => formatMedicineResponse(m, allergies)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get medicine by ID (Public)
export const getMedicineById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const medicine = await medicineService.findMedicineById(id);

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatMedicineResponse(medicine),
    });
  } catch (error) {
    next(error);
  }
};

// Get medicine by slug (Public)
export const getMedicineBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const medicine = await medicineService.findMedicineBySlug(slug);

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatMedicineResponse(medicine),
    });
  } catch (error) {
    next(error);
  }
};

// Search medicines (Public)
export const searchMedicines = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Parse allergies from query string
    const allergiesParam = req.query.allergies as string;
    const allergies = allergiesParam 
      ? allergiesParam.split(",").map(a => a.trim()).filter(a => a.length > 0)
      : [];

    if (!query) {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    const { medicines, total } = await medicineService.searchMedicines(
      query,
      skip,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        medicines: medicines.map(m => formatMedicineResponse(m, allergies)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get medicines by category (Public)
export const getMedicinesByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { medicines, total } = await medicineService.getMedicinesByCategory(
      category,
      skip,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        medicines: medicines.map(m => formatMedicineResponse(m)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get medicines by brand (Public)
export const getMedicinesByBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { brand } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { medicines, total } = await medicineService.getMedicinesByBrand(
      brand,
      skip,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        medicines: medicines.map(m => formatMedicineResponse(m)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update medicine (Admin)
export const updateMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    let medicineData = req.body;

    // Flatten productDetails if it exists
    if (
      medicineData.productDetails &&
      typeof medicineData.productDetails === "object"
    ) {
      const { productDetails, ...rest } = medicineData;
      medicineData = {
        ...rest,
        ...productDetails,
      };
    }

    // Map requiresPrescriptionYesNo to requiresPrescription
    if (medicineData.requiresPrescriptionYesNo !== undefined) {
      medicineData.requiresPrescription =
        medicineData.requiresPrescriptionYesNo === "Yes";
      delete medicineData.requiresPrescriptionYesNo;
    }

    // Check if medicine exists
    const medicine = await medicineService.findMedicineById(id);
    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    // If updating product ID, check if it's already taken
    if (
      medicineData.productId &&
      medicineData.productId !== medicine.productId
    ) {
      const existingMedicine = await medicineService.findMedicineByProductId(
        medicineData.productId
      );
      if (existingMedicine) {
        res.status(400).json({
          success: false,
          message: "Medicine with this Product ID already exists",
        });
        return;
      }
    }

    const updatedMedicine = await medicineService.updateMedicine(
      id,
      medicineData
    );

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: formatMedicineResponse(updatedMedicine),
    });
  } catch (error) {
    next(error);
  }
};

// Delete medicine (Admin)
export const deleteMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if medicine exists
    const medicine = await medicineService.findMedicineById(id);
    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    await medicineService.deleteMedicine(id);

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get all brands (Public)
export const getAllBrands = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const brands = await medicineService.getAllBrands();

    res.status(200).json({
      success: true,
      data: {
        brands,
        total: brands.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all medicines with risk evaluation (Authenticated)
export const getAllMedicinesWithRisk = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get user's health profile
    const healthProfile = await healthProfileService.getUserHealthProfile(userId);
    const profileForRisk: IHealthProfileForRisk | null = healthProfile ? {
      allergies: healthProfile.allergies || [],
      medicalConditions: healthProfile.medicalConditions || [],
      medications: healthProfile.medications || "",
      specialConditions: healthProfile.specialConditions || [],
    } : null;

    const { medicines, total } = await medicineService.getAllMedicines(skip, limit);

    // Evaluate risk for each medicine
    const medicinesWithRisk = medicines.map(m => {
      const risk = evaluateRisk(m, profileForRisk);
      const allergies = profileForRisk?.allergies || [];
      return formatMedicineResponse(m, allergies, risk);
    });

    res.status(200).json({
      success: true,
      data: {
        medicines: medicinesWithRisk,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        hasHealthProfile: !!healthProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search medicines with risk evaluation (Authenticated)
export const searchMedicinesWithRisk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!query) {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    // Get user's health profile
    const healthProfile = await healthProfileService.getUserHealthProfile(userId);
    const profileForRisk: IHealthProfileForRisk | null = healthProfile ? {
      allergies: healthProfile.allergies || [],
      medicalConditions: healthProfile.medicalConditions || [],
      medications: healthProfile.medications || "",
      specialConditions: healthProfile.specialConditions || [],
    } : null;

    const { medicines, total } = await medicineService.searchMedicines(query, skip, limit);

    // Evaluate risk for each medicine
    const medicinesWithRisk = medicines.map(m => {
      const risk = evaluateRisk(m, profileForRisk);
      const allergies = profileForRisk?.allergies || [];
      return formatMedicineResponse(m, allergies, risk);
    });

    res.status(200).json({
      success: true,
      data: {
        medicines: medicinesWithRisk,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        hasHealthProfile: !!healthProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single medicine by slug with risk evaluation (Authenticated)
export const getMedicineBySlugWithRisk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const { slug } = req.params;

    const medicine = await medicineService.findMedicineBySlug(slug);

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    // Get user's health profile
    const healthProfile = await healthProfileService.getUserHealthProfile(userId);
    const profileForRisk: IHealthProfileForRisk | null = healthProfile ? {
      allergies: healthProfile.allergies || [],
      medicalConditions: healthProfile.medicalConditions || [],
      medications: healthProfile.medications || "",
      specialConditions: healthProfile.specialConditions || [],
    } : null;

    // Evaluate risk
    const risk = evaluateRisk(medicine, profileForRisk);
    const allergies = profileForRisk?.allergies || [];

    res.status(200).json({
      success: true,
      data: formatMedicineResponse(medicine, allergies, risk),
      hasHealthProfile: !!healthProfile,
    });
  } catch (error) {
    next(error);
  }
};
