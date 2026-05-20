// Severity levels for drug interactions
export type InteractionSeverity = "minor" | "moderate" | "major" | "contraindicated";

// Risk level for safety flags
export type SafetyRiskLevel = "low" | "medium" | "high" | "critical";

// Drug interaction result
export interface IDrugInteraction {
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  description: string;
  mechanism?: string;
  clinicalEffects?: string;
  management?: string;
}

// Allergy alert
export interface IAllergyAlert {
  medicine: string;
  allergen: string;
  severity: SafetyRiskLevel;
  message: string;
}

// Condition conflict
export interface IConditionConflict {
  medicine: string;
  condition: string;
  severity: SafetyRiskLevel;
  message: string;
  recommendation?: string;
}

// Regulatory risk flag
export interface IRegulatoryFlag {
  medicine: string;
  flag: string;
  category: "pregnancy" | "breastfeeding" | "pediatric" | "geriatric" | "controlled";
  severity: SafetyRiskLevel;
  details: string;
}

// Safety flag
export interface ISafetyFlag {
  medicine: string;
  type: "black_box_warning" | "fda_alert" | "recall" | "interaction_warning" | "dosage_warning";
  severity: SafetyRiskLevel;
  message: string;
  details?: string;
}

// Health profile snapshot for interaction check
export interface IHealthProfileSnapshot {
  allergies: string[];
  medicalConditions: string[];
  specialConditions: string[];
  age?: number;
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
}

// Medicine input for interaction check
export interface IMedicineInput {
  id?: string;
  name: string;
  genericName?: string;
  slug?: string;
}

// Complete interaction scan result
export interface IInteractionScanResult {
  // Medicines analyzed
  medicines: IMedicineInput[];
  
  // Drug-drug interactions
  drugInteractions: IDrugInteraction[];
  
  // Allergy alerts from health profile
  allergyAlerts: IAllergyAlert[];
  
  // Condition conflicts from health profile
  conditionConflicts: IConditionConflict[];
  
  // Regulatory risk flags
  regulatoryFlags: IRegulatoryFlag[];
  
  // Safety flags
  safetyFlags: ISafetyFlag[];
  
  // Overall summary
  summary: {
    totalInteractions: number;
    criticalCount: number;
    majorCount: number;
    moderateCount: number;
    minorCount: number;
    overallRisk: SafetyRiskLevel;
    hasHealthProfile: boolean;
    recommendation: string;
  };
  
  // AI-generated detailed analysis
  aiAnalysis?: string;
  
  // Timestamp
  scannedAt: Date;
}

// Request DTO for checking interactions
export interface ICheckInteractionsDTO {
  medicines: IMedicineInput[];
  includeAIAnalysis?: boolean;
}

// OpenAI response structure for interaction analysis
export interface IAIInteractionAnalysis {
  drugInteractions: {
    drug1: string;
    drug2: string;
    severity: InteractionSeverity;
    description: string;
    mechanism: string;
    clinicalEffects: string;
    management: string;
  }[];
  allergyRisks: {
    medicine: string;
    allergen: string;
    severity: SafetyRiskLevel;
    explanation: string;
  }[];
  conditionRisks: {
    medicine: string;
    condition: string;
    severity: SafetyRiskLevel;
    explanation: string;
    recommendation: string;
  }[];
  regulatoryWarnings: {
    medicine: string;
    category: string;
    warning: string;
    severity: SafetyRiskLevel;
  }[];
  safetyAlerts: {
    medicine: string;
    alertType: string;
    message: string;
    severity: SafetyRiskLevel;
  }[];
  overallAssessment: string;
  recommendations: string[];
  disclaimer: string;
}
