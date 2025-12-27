import prisma from "../config/database";
import {
  ICreateMedicineDTO,
  IUpdateMedicineDTO,
  IMedicine,
} from "../types/medicine.types";
import { generateSlug } from "../utils/slug.util";

class MedicineService {
  // Create medicine
  async createMedicine(
    medicineData: ICreateMedicineDTO,
    userId: string
  ): Promise<IMedicine> {
    const slug = await this.generateUniqueSlug(medicineData.title);

    const medicine = await prisma.medicine.create({
      data: {
        ...medicineData,
        slug,
        createdBy: userId,
      },
    });

    return medicine;
  }

  // Generate unique slug
  async generateUniqueSlug(title: string): Promise<string> {
    let slug = generateSlug(title);
    let counter = 1;

    while (await this.checkSlugExists(slug)) {
      slug = `${generateSlug(title)}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Check if slug exists
  async checkSlugExists(slug: string): Promise<boolean> {
    const medicine = await prisma.medicine.findUnique({
      where: { slug },
    });
    return medicine !== null;
  }

  // Find medicine by ID
  async findMedicineById(id: string): Promise<IMedicine | null> {
    return await prisma.medicine.findUnique({
      where: { id },
    });
  }

  // Find medicine by slug
  async findMedicineBySlug(slug: string): Promise<IMedicine | null> {
    return await prisma.medicine.findUnique({
      where: { slug },
    });
  }

  // Find medicine by product ID
  async findMedicineByProductId(productId: string): Promise<IMedicine | null> {
    return await prisma.medicine.findUnique({
      where: { productId },
    });
  }

  // Update medicine
  async updateMedicine(
    id: string,
    medicineData: IUpdateMedicineDTO
  ): Promise<IMedicine> {
    let updateData: any = { ...medicineData };

    // If title is being updated, regenerate slug
    if (medicineData.title) {
      const slug = await this.generateUniqueSlug(medicineData.title);
      updateData.slug = slug;
    }

    const medicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
    });

    return medicine;
  }

  // Delete medicine
  async deleteMedicine(id: string): Promise<IMedicine> {
    return await prisma.medicine.delete({
      where: { id },
    });
  }

  // Get all medicines with pagination
  async getAllMedicines(
    skip: number = 0,
    take: number = 10
  ): Promise<{ medicines: IMedicine[]; total: number }> {
    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        skip,
        take,
        orderBy: [
          { dataCompletenessScore: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.medicine.count(),
    ]);

    return { medicines, total };
  }

  // Search medicines by name, generic, or usedFor
  async searchMedicines(
    query: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ medicines: IMedicine[]; total: number }> {
    const where = {
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { generics: { contains: query, mode: "insensitive" as const } },
        { usedFor: { contains: query, mode: "insensitive" as const } },
      ],
    };

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take,
        orderBy: [
          { dataCompletenessScore: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.medicine.count({ where }),
    ]);

    return { medicines, total };
  }

  // Get medicines by category
  async getMedicinesByCategory(
    category: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ medicines: IMedicine[]; total: number }> {
    const where = { childCategory: category };

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take,
        orderBy: [
          { dataCompletenessScore: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.medicine.count({ where }),
    ]);

    return { medicines, total };
  }

  // Get medicines by brand
  async getMedicinesByBrand(
    brand: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ medicines: IMedicine[]; total: number }> {
    const where = { brand };

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take,
        orderBy: [
          { dataCompletenessScore: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.medicine.count({ where }),
    ]);

    return { medicines, total };
  }

  // Get all unique brands
  async getAllBrands(): Promise<string[]> {
    const brands = await prisma.medicine.findMany({
      where: {
        brand: {
          not: null,
        },
      },
      select: {
        brand: true,
      },
      distinct: ["brand"],
      orderBy: {
        brand: "asc",
      },
    });

    return brands
      .map((item: { brand: string | null }) => item.brand)
      .filter((brand: string | null): brand is string => brand !== null);
  }
}

export default new MedicineService();
