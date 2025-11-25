import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ArticleData {
  _id?: string;
  Title?: string;
  title?: string;
  ImageURL?: string;
  imageUrl?: string;
  Category?: string;
  category?: string;
  ShortDescription?: string;
  shortDescription?: string;
  Content?: string;
  content?: string;
  SourceLink?: string;
  sourceLink?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function seedArticles() {
  try {
    console.log("🚀 Starting article data import...");

    // Read the JSON file
    const jsonFilePath = path.join(__dirname, "..", "articles.json");
    const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
    const articlesData: ArticleData[] = JSON.parse(fileContent);

    console.log(`📦 Found ${articlesData.length} articles to import`);

    // Get or create an admin user to be the creator
    let adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (!adminUser) {
      console.log("👤 No admin user found, creating one...");
      adminUser = await prisma.user.create({
        data: {
          firstName: "Admin",
          lastName: "User",
          email: "admin@digitalhealth.com",
          password:
            "$2b$10$rKzX8H9vZ3Q2YwJ5L6M8XuZ.K7P9N3Q2YwJ5L6M8XuZ.K7P9N3Q2Yw", // hashed "Admin@123"
          role: "admin",
          isVerified: true,
        },
      });
      console.log("✅ Admin user created");
    }

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Import each article
    for (let i = 0; i < articlesData.length; i++) {
      const article = articlesData[i];
      const articleNum = i + 1;

      try {
        // Get title (handle both Title and title fields)
        const title = article.title || article.Title;
        if (!title) {
          console.log(`⚠️  Article ${articleNum}: No title found, skipping`);
          skippedCount++;
          continue;
        }

        // Generate slug
        const slug = generateSlug(title);

        // Check if article with same slug already exists
        const existingArticle = await prisma.article.findUnique({
          where: { slug },
        });

        if (existingArticle) {
          console.log(`⚠️  Article ${articleNum}: "${title}" already exists, skipping`);
          skippedCount++;
          continue;
        }

        // Get other fields (handle both lowercase and capitalized versions)
        const imageUrl = article.imageUrl || article.ImageURL || "";
        const category = article.category || article.Category || "General";
        const shortDescription =
          article.shortDescription || article.ShortDescription || "";
        const content = article.content || article.Content || "";
        const sourceLink = article.sourceLink || article.SourceLink || "";

        // Create the article
        await prisma.article.create({
          data: {
            title,
            slug,
            imageUrl,
            category,
            shortDescription,
            content,
            sourceLink,
            createdBy: adminUser.id,
          },
        });

        importedCount++;
        console.log(`✅ Article ${articleNum}/${articlesData.length}: "${title}" imported successfully`);
      } catch (error: any) {
        errorCount++;
        console.error(
          `❌ Article ${articleNum}: Error importing - ${error.message}`
        );
      }
    }

    console.log("\n📊 Import Summary:");
    console.log(`✅ Successfully imported: ${importedCount} articles`);
    console.log(`⚠️  Skipped (already exists): ${skippedCount} articles`);
    console.log(`❌ Errors: ${errorCount} articles`);
    console.log(`📦 Total processed: ${articlesData.length} articles`);
  } catch (error) {
    console.error("❌ Fatal error during article import:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedArticles()
  .then(() => {
    console.log("\n🎉 Article import completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Article import failed:", error);
    process.exit(1);
  });
