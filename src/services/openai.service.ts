import OpenAI from "openai";

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateMealPlan(userProfile: any, duration: string): Promise<any> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(userProfile, duration);

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response || "{}");
    } catch (error: any) {
      console.error("OpenAI API Error:", error.message);
      throw new Error(`Failed to generate meal plan: ${error.message}`);
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert Pakistani nutritionist and dietitian with 15+ years of experience. You specialize in creating culturally relevant, medically sound meal plans for Pakistani individuals.

Your expertise includes:
- Pakistani cuisine and traditional cooking methods
- Local food availability and seasonal produce in Pakistan
- Disease-specific dietary requirements (diabetes, hypertension, PCOS, etc.)
- Halal dietary guidelines
- Budget-conscious meal planning using local ingredients
- Family-style cooking adapted for individual health needs
- Understanding of Pakistani eating habits and meal timing

Your meal plans MUST:
1. Use locally available ingredients from Pakistani markets
2. Include traditional dishes adapted for health goals
3. Respect cultural and religious dietary practices
4. Be practical and affordable within the specified budget
5. Consider the cooking skill level and time constraints
6. Provide measurements in Pakistani units (kg, grams, cups, tablespoons)
7. Include both Urdu and English recipe names where applicable
8. Account for Pakistani climate and seasonal food availability

CRITICAL: Always return valid JSON format with the following structure:
{
  "mealPlan": {
    "summary": {...},
    "dailyMeals": [...],
    "shoppingList": {...},
    "weeklyTips": [...],
    "healthWarnings": [...],
    "progressTracking": {...},
    "substitutionGuide": {...}
  },
  "disclaimer": "..."
}`;
  }

  private getUserPrompt(userProfile: any, duration: string): string {
    const daysCount = duration === "7" ? 7 : 30;
    const bmi = this.calculateBMI(userProfile.weight, userProfile.height);
    const targetCalories = this.calculateTargetCalories(userProfile);

    return `Create a personalized ${daysCount}-day meal plan for the following individual:

PERSONAL INFORMATION:
- Age: ${userProfile.age} years
- Gender: ${userProfile.user?.gender || "Not specified"}
- Height: ${userProfile.height} cm
- Current Weight: ${userProfile.weight} kg
- Target Weight: ${userProfile.targetWeight || "Not specified"} kg
- BMI: ${bmi.toFixed(1)}
- Goal: ${userProfile.primaryGoal}

HEALTH PROFILE:
- Medical Conditions: ${JSON.stringify(userProfile.medicalConditions || [])}
- Current Medications: ${userProfile.medications || "None"}
- Special Conditions: ${JSON.stringify(userProfile.specialConditions || [])}

ALLERGIES & RESTRICTIONS:
- Food Allergies: ${JSON.stringify(userProfile.allergies || [])}
- Dietary Type: ${userProfile.dietaryPreference}
- Foods to Avoid: ${JSON.stringify(userProfile.dislikedFoods || [])}

LIFESTYLE:
- Activity Level: ${userProfile.activityLevel}
- Occupation: ${userProfile.occupation || "Not specified"}
- Sleep: ${userProfile.sleepHours || 7} hours/night, Quality: ${
      userProfile.sleepQuality || "Fair"
    }
- Water Intake: ${userProfile.waterIntake || 6} glasses/day

GOALS & PREFERENCES:
- Primary Goal: ${userProfile.primaryGoal}
- Timeline: ${userProfile.timeline || "Not specified"}
- Meals Per Day: ${userProfile.mealsPerDay}
- Regional Preference: ${userProfile.regionalPreference || "All Pakistani"}
- Fasting Requirements: ${
      userProfile.fastingRequirements ? "Yes (Ramadan planning)" : "No"
    }

PRACTICAL CONSTRAINTS:
- Monthly Food Budget: ${userProfile.monthlyBudget || 15000} PKR per person
- Cooking Skill: ${userProfile.cookingSkill || "Intermediate"}
- Meal Prep Time: Maximum ${userProfile.maxPrepTime || 45} minutes
- Eating Out: ${userProfile.eatingOutFrequency || "Rarely"}
- Location: ${userProfile.city || "Pakistan"}

CURRENT EATING HABITS:
${JSON.stringify(userProfile.currentHabits || {}, null, 2)}

CRITICAL REQUIREMENTS:
${this.generateCriticalRequirements(userProfile)}

Please create a comprehensive meal plan following these guidelines:

1. MEAL STRUCTURE:
   - Provide ${daysCount} days of meals
   - Each day should include: ${this.getMealTimes(userProfile.mealsPerDay)}
   - Total daily calories: ${targetCalories} kcal (±100)
   - Macro distribution: Carbs: 45%, Protein: 30%, Fats: 25%

2. FOOD SELECTION RULES:
   - Use ONLY Pakistani ingredients available in ${
     userProfile.city || "major Pakistani cities"
   }
   - Prioritize seasonal vegetables and fruits
   - Include traditional dishes: roti, daal, sabzi, rice, etc.
   - Adapt recipes for health conditions
   - Stay within ${userProfile.monthlyBudget || 15000} PKR budget
   - Include variety to prevent boredom

3. RECIPE REQUIREMENTS:
   - Cooking time should not exceed ${userProfile.maxPrepTime || 45} minutes
   - Match cooking complexity to ${
     userProfile.cookingSkill || "intermediate"
   } skill level
   - Provide step-by-step instructions in simple language
   - Include both traditional and healthy cooking methods

4. CULTURAL SENSITIVITY:
   - Respect ${userProfile.dietaryPreference} requirements
   - Include ${
     userProfile.regionalPreference || "Pakistani"
   } cuisine preferences
   - Consider Pakistani meal timing (breakfast 8am, lunch 1-2pm, dinner 8-9pm)
   - Account for tea culture (morning/evening chai)

5. OUTPUT REQUIREMENTS:
   - Return response in valid JSON format
   - Include nutritional breakdown per meal and daily totals
   - Provide variety across the week (no repetitive meals)
   - Include both English and Urdu names for dishes
   - Add helpful tips and warnings specific to health conditions
   - Include shopping list with estimated costs in PKR
   - Provide meal prep strategies and substitution options`;
  }

  private calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  private calculateTargetCalories(userProfile: any): number {
    const { weight, height, age, activityLevel, primaryGoal } = userProfile;
    const gender = userProfile.user?.gender || "Male";

    // Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === "Male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
      Athlete: 1.9,
    };

    let tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

    // Adjust for goals
    if (primaryGoal === "Weight Loss") tdee -= 500;
    if (primaryGoal === "Weight Gain") tdee += 500;
    if (primaryGoal === "Muscle Building") tdee += 300;

    return Math.round(tdee);
  }

  private generateCriticalRequirements(userProfile: any): string {
    const requirements: string[] = [];
    const conditions = userProfile.medicalConditions || [];

    if (
      conditions.includes("Diabetes") ||
      conditions.includes("Diabetes Type 2")
    ) {
      requirements.push(
        "- STRICT: Low glycemic index foods only, no refined sugar, monitor carb portions"
      );
      requirements.push(
        "- Include fiber-rich foods with every meal to manage blood sugar"
      );
    }

    if (
      conditions.includes("Hypertension") ||
      conditions.includes("High Blood Pressure")
    ) {
      requirements.push(
        "- STRICT: Low sodium (max 1500mg/day), avoid processed foods and pickles"
      );
      requirements.push(
        "- Increase potassium-rich foods (banana, yogurt, spinach)"
      );
    }

    if (conditions.includes("High Cholesterol")) {
      requirements.push(
        "- STRICT: Limit saturated fats, avoid ghee/butter, use mustard/olive oil"
      );
      requirements.push("- Include omega-3 sources (fish, walnuts, flaxseeds)");
    }

    if (conditions.includes("PCOS") || conditions.includes("PCOD")) {
      requirements.push(
        "- Focus on low-GI foods and anti-inflammatory ingredients"
      );
      requirements.push(
        "- Include spearmint tea, cinnamon, and omega-3 rich foods"
      );
    }

    if (
      userProfile.specialConditions?.includes("Pregnant") ||
      userProfile.specialConditions?.includes("Breastfeeding")
    ) {
      requirements.push(
        "- STRICT: Ensure adequate folate, iron, calcium, and protein"
      );
      requirements.push("- Avoid raw/undercooked foods, unpasteurized dairy");
    }

    if (userProfile.primaryGoal === "Weight Loss") {
      requirements.push(
        "- Create caloric deficit of 500 kcal/day for sustainable weight loss"
      );
      requirements.push(
        "- High protein, moderate carbs, healthy fats distribution"
      );
    }

    return requirements.length > 0
      ? requirements.join("\n")
      : "- No specific restrictions";
  }

  private getMealTimes(mealsPerDay: number): string {
    const mealConfig: { [key: number]: string } = {
      2: "Breakfast (8-9am), Dinner (8-9pm)",
      3: "Breakfast (8-9am), Lunch (1-2pm), Dinner (8-9pm)",
      4: "Breakfast, Mid-Morning Snack, Lunch, Dinner",
      5: "Breakfast, Mid-Morning Snack, Lunch, Evening Snack (chai time), Dinner",
      6: "Early Morning, Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner",
    };

    return mealConfig[mealsPerDay] || mealConfig[3];
  }
}

export default new OpenAIService();
