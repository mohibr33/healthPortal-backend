import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface MedicineData {
  ProductID: string;
  Slug: string;
  Title: string;
  ProductImage?: string;
  Brand?: string;
  Usedfor?: string;
  ChildCategory?: string;
  productDetails: {
    HowItWorks?: string;
    Description?: string;
    Generics?: string;
    UsedFor?: string;
    RequiresPrescriptionYesNo?: string;
    Indication?: string;
    SideEffects?: string;
    WhenNotToUse?: string;
    Dosage?: string;
    StorageYesOrNo?: string;
    Precautions?: string;
    Warning1?: string;
    Warning2?: string;
    Warning3?: string;
    PregnancyCategory?: string;
    DrugInteractions?: string;
  };
}

async function seedMedicines() {
  try {
    console.log("🚀 Starting medicine data import...");

    // Read the JSON file
    const jsonFilePath = path.join(__dirname, "..", "medicineData.json");
    const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
    const medicinesData: MedicineData[] = JSON.parse(fileContent);

    console.log(`📦 Found ${medicinesData.length} medicines to import`);

    // Get or create an admin user to be the creator
    let adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (!adminUser) {
      console.log("⚠️  No admin user found. Creating a default admin user...");
      adminUser = await prisma.user.create({
        data: {
          firstName: "System",
          lastName: "Admin",
          email: "admin@digitalhealthassistant.com",
          password: "system-generated", // This should be changed
          role: "admin",
          isVerified: true,
        },
      });
      console.log("✅ Default admin user created");
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const medicineData of medicinesData) {
      try {
        // Check if medicine already exists
        const existingMedicine = await prisma.medicine.findUnique({
          where: { productId: medicineData.ProductID },
        });

        if (existingMedicine) {
          console.log(`⏭️  Skipping ${medicineData.Title} - already exists`);
          skipCount++;
          continue;
        }

        // Create medicine
        await prisma.medicine.create({
          data: {
            productId: medicineData.ProductID,
            slug: medicineData.Slug,
            title: medicineData.Title,
            productImage: medicineData.ProductImage || null,
            brand: medicineData.Brand || null,
            usedFor:
              medicineData.Usedfor ||
              medicineData.productDetails.UsedFor ||
              null,
            childCategory: medicineData.ChildCategory || null,
            howItWorks: medicineData.productDetails.HowItWorks || null,
            description: medicineData.productDetails.Description || null,
            generics: medicineData.productDetails.Generics || null,
            indication: medicineData.productDetails.Indication || null,
            sideEffects: medicineData.productDetails.SideEffects || null,
            whenNotToUse: medicineData.productDetails.WhenNotToUse || null,
            dosage: medicineData.productDetails.Dosage || null,
            storage: medicineData.productDetails.StorageYesOrNo || null,
            precautions: medicineData.productDetails.Precautions || null,
            warning1: medicineData.productDetails.Warning1 || null,
            warning2: medicineData.productDetails.Warning2 || null,
            warning3: medicineData.productDetails.Warning3 || null,
            pregnancyCategory:
              medicineData.productDetails.PregnancyCategory || null,
            drugInteractions:
              medicineData.productDetails.DrugInteractions || null,
            requiresPrescription:
              medicineData.productDetails.RequiresPrescriptionYesNo?.toLowerCase() ===
              "yes",
            createdBy: adminUser.id,
          },
        });

        successCount++;
        console.log(`✅ Imported: ${medicineData.Title}`);
      } catch (error: any) {
        errorCount++;
        console.error(
          `❌ Error importing ${medicineData.Title}:`,
          error.message
        );
      }
    }

    console.log("\n📊 Import Summary:");
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📦 Total processed: ${medicinesData.length}`);
  } catch (error) {
    console.error("❌ Fatal error during import:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedMedicines()
  .then(() => {
    console.log("\n🎉 Medicine data import completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Medicine data import failed:", error);
    process.exit(1);
  });
