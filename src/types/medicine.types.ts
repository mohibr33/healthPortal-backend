export interface IMedicine {
  id: string;
  productId: string;
  slug: string;
  title: string;
  productImage?: string | null;
  brand?: string | null;
  usedFor?: string | null;
  childCategory?: string | null;
  howItWorks?: string | null;
  description?: string | null;
  generics?: string | null;
  indication?: string | null;
  sideEffects?: string | null;
  whenNotToUse?: string | null;
  dosage?: string | null;
  storage?: string | null;
  precautions?: string | null;
  warning1?: string | null;
  warning2?: string | null;
  warning3?: string | null;
  pregnancyCategory?: string | null;
  drugInteractions?: string | null;
  requiresPrescription: boolean;
  dataCompletenessScore: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateMedicineDTO {
  productId: string;
  title: string;
  productImage?: string;
  brand?: string;
  usedFor?: string;
  childCategory?: string;
  howItWorks?: string;
  description?: string;
  generics?: string;
  indication?: string;
  sideEffects?: string;
  whenNotToUse?: string;
  dosage?: string;
  storage?: string;
  precautions?: string;
  warning1?: string;
  warning2?: string;
  warning3?: string;
  pregnancyCategory?: string;
  drugInteractions?: string;
  requiresPrescription?: boolean;
}

export interface IUpdateMedicineDTO {
  productId?: string;
  title?: string;
  productImage?: string;
  brand?: string;
  usedFor?: string;
  childCategory?: string;
  howItWorks?: string;
  description?: string;
  generics?: string;
  indication?: string;
  sideEffects?: string;
  whenNotToUse?: string;
  dosage?: string;
  storage?: string;
  precautions?: string;
  warning1?: string;
  warning2?: string;
  warning3?: string;
  pregnancyCategory?: string;
  drugInteractions?: string;
  requiresPrescription?: boolean;
}

export interface IMedicineResponse {
  id: string;
  productId: string;
  slug: string;
  title: string;
  productImage?: string | null;
  brand?: string | null;
  usedFor?: string | null;
  childCategory?: string | null;
  productDetails: {
    howItWorks?: string | null;
    description?: string | null;
    generics?: string | null;
    usedFor?: string | null;
    requiresPrescriptionYesNo: string;
    indication?: string | null;
    sideEffects?: string | null;
    whenNotToUse?: string | null;
    dosage?: string | null;
    storageYesOrNo?: string | null;
    precautions?: string | null;
    warning1?: string | null;
    warning2?: string | null;
    warning3?: string | null;
    pregnancyCategory?: string | null;
    drugInteractions?: string | null;
  };
  allergyWarnings?: string[];
  createdAt: Date;
  updatedAt: Date;
}
