import { Request, Response, NextFunction } from "express";
import medicineService from "../services/medicine.service";
import { IAuthRequest } from "../types/user.types";
import { IMedicine, IMedicineResponse } from "../types/medicine.types";

// Helper function to format medicine response
const formatMedicineResponse = (medicine: IMedicine): IMedicineResponse => {
  return {
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
};

// Create medicine (Admin)
export const createMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const medicineData = req.body;
    const userId = (req as IAuthRequest).userId!;

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

    const { medicines, total } = await medicineService.getAllMedicines(
      skip,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        medicines: medicines.map(formatMedicineResponse),
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
        medicines: medicines.map(formatMedicineResponse),
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
        medicines: medicines.map(formatMedicineResponse),
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
        medicines: medicines.map(formatMedicineResponse),
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
    const medicineData = req.body;

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
