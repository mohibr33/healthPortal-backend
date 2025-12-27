import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define weights for each field (higher weight = more important)
const FIELD_WEIGHTS: Record<string, number> = {
  // High priority fields (weight: 10)
  productImage: 10,
  description: 10,
  usedFor: 10,
  
  // Medium-high priority fields (weight: 8)
  generics: 8,
  indication: 8,
  dosage: 8,
  sideEffects: 8,
  
  // Medium priority fields (weight: 6)
  brand: 6,
  howItWorks: 6,
  childCategory: 6,
  precautions: 6,
  whenNotToUse: 6,
  
  // Lower priority fields (weight: 4)
  storage: 4,
  drugInteractions: 4,
  pregnancyCategory: 4,
  
  // Lowest priority fields (weight: 2)
  warning1: 2,
  warning2: 2,
  warning3: 2,
};

// Calculate maximum possible score
const MAX_SCORE = Object.values(FIELD_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

interface MedicineRecord {
  id: string;
  title: string;
  productImage: string | null;
  description: string | null;
  usedFor: string | null;
  generics: string | null;
  indication: string | null;
  dosage: string | null;
  sideEffects: string | null;
  brand: string | null;
  howItWorks: string | null;
  childCategory: string | null;
  precautions: string | null;
  whenNotToUse: string | null;
  storage: string | null;
  drugInteractions: string | null;
  pregnancyCategory: string | null;
  warning1: string | null;
  warning2: string | null;
  warning3: string | null;
}

function calculateCompletenessScore(medicine: MedicineRecord): number {
  let score = 0;

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const value = medicine[field as keyof MedicineRecord];
    
    // Check if field has meaningful data (not null, not empty, not just whitespace)
    if (value && typeof value === "string" && value.trim().length > 0) {
      // Give bonus for longer, more detailed content
      const contentLength = value.trim().length;
      
      if (contentLength >= 100) {
        // Full weight for substantial content
        score += weight;
      } else if (contentLength >= 20) {
        // 80% weight for moderate content
        score += weight * 0.8;
      } else {
        // 50% weight for minimal content
        score += weight * 0.5;
      }
    }
  }

  // Convert to percentage (0-100)
  const percentage = Math.round((score / MAX_SCORE) * 100);
  return Math.min(100, percentage);
}

async function organizeMedicines() {
  try {
    console.log("🚀 Starting medicine data organization...\n");
    console.log(`📊 Maximum possible score: ${MAX_SCORE} points`);
    console.log("📋 Field weights:", FIELD_WEIGHTS);
    console.log("\n");

    // Get all medicines
    const medicines = await prisma.medicine.findMany({
      select: {
        id: true,
        title: true,
        productImage: true,
        description: true,
        usedFor: true,
        generics: true,
        indication: true,
        dosage: true,
        sideEffects: true,
        brand: true,
        howItWorks: true,
        childCategory: true,
        precautions: true,
        whenNotToUse: true,
        storage: true,
        drugInteractions: true,
        pregnancyCategory: true,
        warning1: true,
        warning2: true,
        warning3: true,
      },
    });

    console.log(`📦 Found ${medicines.length} medicines to process\n`);

    // Calculate scores for all medicines
    const medicineScores: Array<{ id: string; title: string; score: number }> = [];

    for (const medicine of medicines) {
      const score = calculateCompletenessScore(medicine);
      medicineScores.push({
        id: medicine.id,
        title: medicine.title,
        score,
      });
    }

    // Sort by score descending for reporting
    medicineScores.sort((a, b) => b.score - a.score);

    // Update all medicines with their scores using raw SQL for performance
    console.log("🔄 Updating medicines with completeness scores...\n");

    const BATCH_SIZE = 500;
    let updatedCount = 0;

    for (let i = 0; i < medicineScores.length; i += BATCH_SIZE) {
      const batch = medicineScores.slice(i, i + BATCH_SIZE);
      
      // Build a single UPDATE query with CASE statements
      const caseStatements = batch
        .map(({ id, score }) => `WHEN '${id}' THEN ${score}`)
        .join(" ");
      
      const ids = batch.map(({ id }) => `'${id}'`).join(", ");
      
      await prisma.$executeRawUnsafe(`
        UPDATE "Medicine" 
        SET "dataCompletenessScore" = CASE "id" ${caseStatements} END
        WHERE "id" IN (${ids})
      `);

      updatedCount += batch.length;
      console.log(`   Updated ${updatedCount}/${medicines.length} medicines...`);
    }

    console.log(`\n✅ Successfully updated ${updatedCount} medicines\n`);

    // Generate statistics
    const scoreDistribution = {
      excellent: medicineScores.filter((m) => m.score >= 80).length,
      good: medicineScores.filter((m) => m.score >= 60 && m.score < 80).length,
      fair: medicineScores.filter((m) => m.score >= 40 && m.score < 60).length,
      poor: medicineScores.filter((m) => m.score >= 20 && m.score < 40).length,
      veryPoor: medicineScores.filter((m) => m.score < 20).length,
    };

    const avgScore =
      medicineScores.reduce((sum, m) => sum + m.score, 0) / medicineScores.length;

    console.log("📊 Score Distribution:");
    console.log(`   🟢 Excellent (80-100): ${scoreDistribution.excellent} medicines`);
    console.log(`   🔵 Good (60-79): ${scoreDistribution.good} medicines`);
    console.log(`   🟡 Fair (40-59): ${scoreDistribution.fair} medicines`);
    console.log(`   🟠 Poor (20-39): ${scoreDistribution.poor} medicines`);
    console.log(`   🔴 Very Poor (0-19): ${scoreDistribution.veryPoor} medicines`);
    console.log(`\n   📈 Average Score: ${avgScore.toFixed(1)}%`);

    // Show top 10 most complete medicines
    console.log("\n🏆 Top 10 Most Complete Medicines:");
    for (let i = 0; i < Math.min(10, medicineScores.length); i++) {
      const m = medicineScores[i];
      console.log(`   ${i + 1}. ${m.title.substring(0, 50)}... (Score: ${m.score}%)`);
    }

    // Show bottom 10 least complete medicines
    console.log("\n⚠️  Bottom 10 Least Complete Medicines:");
    const bottom10 = medicineScores.slice(-10).reverse();
    for (let i = 0; i < bottom10.length; i++) {
      const m = bottom10[i];
      console.log(`   ${i + 1}. ${m.title.substring(0, 50)}... (Score: ${m.score}%)`);
    }

    // Check for medicines missing critical fields
    const missingImage = medicines.filter(
      (m) => !m.productImage || m.productImage.trim() === ""
    ).length;
    const missingDescription = medicines.filter(
      (m) => !m.description || m.description.trim() === ""
    ).length;
    const missingUsedFor = medicines.filter(
      (m) => !m.usedFor || m.usedFor.trim() === ""
    ).length;

    console.log("\n⚠️  Missing Critical Fields:");
    console.log(`   🖼️  Missing Image: ${missingImage} medicines`);
    console.log(`   📝 Missing Description: ${missingDescription} medicines`);
    console.log(`   💊 Missing UsedFor: ${missingUsedFor} medicines`);

  } catch (error) {
    console.error("❌ Error organizing medicines:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
organizeMedicines()
  .then(() => {
    console.log("\n🎉 Medicine organization completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Medicine organization failed:", error);
    process.exit(1);
  });
