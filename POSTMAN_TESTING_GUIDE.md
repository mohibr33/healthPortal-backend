# AI Meal Planner - Postman Testing Guide

## Base URL

```
http://localhost:5050
```

---

## 1. User Registration (First - to get authentication token)

**Method:** `POST`  
**URL:** `http://localhost:5050/api/users/register`

**Body (JSON):**

```json
{
  "name": "Ahmed Khan",
  "email": "ahmed.khan@example.com",
  "password": "Password123!",
  "phone": "+923001234567"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with OTP.",
  "data": {
    "userId": "user-id-here",
    "email": "ahmed.khan@example.com"
  }
}
```

---

## 2. Verify OTP

**Method:** `POST`  
**URL:** `http://localhost:5050/api/users/verify-otp`

**Body (JSON):**

```json
{
  "email": "ahmed.khan@example.com",
  "otp": "123456"
}
```

**Note:** Check your email for the actual OTP code.

---

## 3. Login (Get JWT Token)

**Method:** `POST`  
**URL:** `http://localhost:5050/api/users/login`

**Body (JSON):**

```json
{
  "email": "ahmed.khan@example.com",
  "password": "Password123!"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "name": "Ahmed Khan",
      "email": "ahmed.khan@example.com"
    }
  }
}
```

**IMPORTANT:** Copy the `token` value - you'll need it for all subsequent requests!

---

## 4. Create/Update Health Profile

**Method:** `POST`  
**URL:** `http://localhost:5050/api/meal-planner/health-profile`

**Note:** ⚠️ This endpoint uses **UPSERT** - it will CREATE a new profile if none exists, or UPDATE your existing profile.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON) - Example 1: Weight Loss with Diabetes**

```json
{
  "age": 35,
  "height": 172,
  "weight": 85,
  "targetWeight": 75,
  "medicalConditions": ["Diabetes Type 2"],
  "medications": "Metformin 500mg twice daily",
  "specialConditions": [],
  "allergies": ["Peanuts", "Shellfish"],
  "dietaryPreference": "Halal only",
  "dislikedFoods": ["Bitter gourd", "Okra"],
  "activityLevel": "Lightly Active",
  "occupation": "Software Engineer",
  "sleepHours": 6,
  "sleepQuality": "Fair",
  "waterIntake": 6,
  "primaryGoal": "Weight Loss",
  "timeline": "3 months",
  "mealsPerDay": 4,
  "regionalPreference": "Punjabi cuisine",
  "fastingRequirements": false,
  "monthlyBudget": 25000,
  "cookingSkill": "Intermediate",
  "maxPrepTime": 45,
  "eatingOutFrequency": "2-3 times per week",
  "city": "Lahore",
  "currentHabits": {
    "breakfast": "Paratha with chai",
    "lunch": "Rice and curry",
    "dinner": "Roti with vegetables",
    "snacks": "Samosas, pakoras occasionally"
  }
}
```

**Body (JSON) - Example 2: Pregnancy Nutrition**

```json
{
  "age": 28,
  "height": 160,
  "weight": 65,
  "targetWeight": 70,
  "medicalConditions": [],
  "medications": "Prenatal vitamins",
  "specialConditions": ["Pregnancy - Second Trimester"],
  "allergies": [],
  "dietaryPreference": "Non-Vegetarian",
  "dislikedFoods": ["Fish"],
  "activityLevel": "Lightly Active",
  "occupation": "Teacher",
  "sleepHours": 8,
  "sleepQuality": "Good",
  "waterIntake": 8,
  "primaryGoal": "Overall Health",
  "timeline": "6 months",
  "mealsPerDay": 5,
  "regionalPreference": "Sindhi cuisine",
  "fastingRequirements": false,
  "monthlyBudget": 30000,
  "cookingSkill": "Advanced",
  "maxPrepTime": 60,
  "eatingOutFrequency": "Once a week",
  "city": "Karachi",
  "currentHabits": {
    "breakfast": "Eggs and toast",
    "lunch": "Dal chawal",
    "dinner": "Chicken curry with roti"
  }
}
```

**Body (JSON) - Example 3: Muscle Building**

```json
{
  "age": 25,
  "height": 178,
  "weight": 70,
  "targetWeight": 80,
  "medicalConditions": [],
  "medications": "None",
  "specialConditions": [],
  "allergies": [],
  "dietaryPreference": "Non-Vegetarian",
  "dislikedFoods": [],
  "activityLevel": "Very Active",
  "occupation": "Gym Trainer",
  "sleepHours": 8,
  "sleepQuality": "Excellent",
  "waterIntake": 12,
  "primaryGoal": "Muscle Building",
  "timeline": "6 months",
  "mealsPerDay": 6,
  "regionalPreference": "Mixed Pakistani",
  "fastingRequirements": false,
  "monthlyBudget": 35000,
  "cookingSkill": "Beginner",
  "maxPrepTime": 30,
  "eatingOutFrequency": "Daily (protein shakes)",
  "city": "Islamabad",
  "currentHabits": {
    "breakfast": "Eggs and oatmeal",
    "lunch": "Chicken breast with rice",
    "dinner": "Grilled meat with vegetables"
  }
}
```

---

## 5. Get Health Profile

**Method:** `GET`  
**URL:** `http://localhost:5050/api/meal-planner/health-profile`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**No Body Required**

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "profile-id-999",
    "age": 35,
    "weight": 85,
    "height": 172,
    "targetWeight": 75,
    "primaryGoal": "Weight Loss",
    "medicalConditions": ["Diabetes Type 2"],
    "city": "Lahore"
  }
}
```

---

## 5a. Update Existing Health Profile

**Method:** `POST` (same endpoint as create)  
**URL:** `http://localhost:5050/api/meal-planner/health-profile`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Use Case Examples:**

**Example 1: Update Weight After Progress**

```json
{
  "age": 35,
  "height": 172,
  "weight": 82,
  "targetWeight": 75,
  "medicalConditions": ["Diabetes Type 2"],
  "allergies": ["Peanuts", "Shellfish"],
  "dietaryPreference": "Halal only",
  "activityLevel": "Moderately Active",
  "primaryGoal": "Weight Loss",
  "monthlyBudget": 25000,
  "city": "Lahore"
}
```

**Example 2: Change Goal to Maintenance**

```json
{
  "age": 35,
  "height": 172,
  "weight": 75,
  "targetWeight": 75,
  "medicalConditions": ["Diabetes Type 2"],
  "allergies": ["Peanuts"],
  "dietaryPreference": "Halal only",
  "activityLevel": "Moderately Active",
  "primaryGoal": "Maintenance",
  "monthlyBudget": 25000,
  "city": "Lahore"
}
```

**Example 3: Add New Medical Condition**

```json
{
  "age": 35,
  "height": 172,
  "weight": 80,
  "medicalConditions": ["Diabetes Type 2", "Hypertension"],
  "medications": "Metformin 500mg, Amlodipine 5mg",
  "allergies": ["Peanuts", "Shellfish"],
  "dietaryPreference": "Halal only",
  "activityLevel": "Lightly Active",
  "primaryGoal": "Disease Management",
  "monthlyBudget": 25000,
  "city": "Lahore"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Health profile saved successfully",
  "data": {
    "id": "same-profile-id-999",
    "weight": 82,
    "updatedAt": "2025-11-25T10:00:00.000Z"
  }
}
```

**⚠️ Important:** All fields will be updated with new values. Include all required fields even if unchanged.

---

## 6. Generate 7-Day Meal Plan

**Method:** `POST`  
**URL:** `http://localhost:5050/api/meal-planner/generate`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "duration": "7"
}
```

**Expected Response (Sample):**

```json
{
  "success": true,
  "message": "Meal plan generated successfully",
  "data": {
    "id": "meal-plan-id",
    "duration": "7 days",
    "status": "active",
    "mealPlanData": {
      "mealPlan": {
        "overview": "7-day diabetes-friendly weight loss plan...",
        "days": [
          {
            "day": 1,
            "date": "Day 1",
            "meals": [
              {
                "mealTime": "Breakfast (8:00 AM)",
                "dishName": "Oats Porridge with Almonds",
                "ingredients": [
                  "1/2 cup oats",
                  "1 cup skimmed milk",
                  "5 almonds"
                ],
                "recipe": "Detailed cooking instructions...",
                "calories": 280,
                "protein": 12,
                "carbs": 45,
                "fats": 6,
                "estimatedCost": 60
              }
            ]
          }
        ],
        "summary": {
          "totalCaloriesPerDay": 1800,
          "estimatedCost": "8500 PKR/week"
        }
      }
    },
    "totalCalories": 1800,
    "estimatedCost": 8500,
    "createdAt": "2025-11-23T..."
  }
}
```

**Note:** This will take 10-30 seconds as it calls OpenAI API. Make sure `OPENAI_API_KEY` is set in `.env`

---

## 7. Generate 30-Day Meal Plan

**Method:** `POST`  
**URL:** `http://localhost:5050/api/meal-planner/generate`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "duration": "30"
}
```

**Note:** This will take 30-60 seconds as it generates a full month plan.

---

## 8. Get All My Meal Plans (with Pagination)

**Method:** `GET`  
**URL:** `http://localhost:5050/api/meal-planner/my-plans?page=1&limit=10`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**No Body Required**

---

## 9. Get Active Meal Plan

**Method:** `GET`  
**URL:** `http://localhost:5050/api/meal-planner/active`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**No Body Required**

---

## 10. Get Specific Meal Plan by ID

**Method:** `GET`  
**URL:** `http://localhost:5050/api/meal-planner/{meal-plan-id}`

**Example:**

```
http://localhost:5050/api/meal-planner/cm3vwx123abc456def789
```

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**No Body Required**

---

## 11. Update Meal Plan Status

**Method:** `PATCH`  
**URL:** `http://localhost:5050/api/meal-planner/{meal-plan-id}/status`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "status": "completed"
}
```

**Valid Status Values:**

- `active`
- `completed`
- `archived`

---

## 12. Delete Meal Plan

**Method:** `DELETE`  
**URL:** `http://localhost:5050/api/meal-planner/{meal-plan-id}`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**No Body Required**

---

## 13. Delete Health Profile

**Method:** `DELETE`  
**URL:** `http://localhost:5050/api/meal-planner/health-profile`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**No Body Required**

---

## Complete Testing Flow (Step-by-Step)

### Step 1: Register & Login

1. Register a new user → Copy user ID
2. Verify OTP from email
3. Login → **Copy JWT token**

### Step 2: Set Authorization Header

In Postman, for ALL subsequent requests:

- Go to "Authorization" tab
- Type: `Bearer Token`
- Token: Paste your JWT token

### Step 3: Create Health Profile

1. Use POST `/health-profile` with one of the example bodies above
2. Verify success response

### Step 4: Generate Meal Plan

1. Use POST `/generate` with `{"duration": "7"}`
2. Wait for AI response (10-30 seconds)
3. Copy the `id` from response

### Step 5: View Plans

1. GET `/active` to see active plan
2. GET `/my-plans` to list all plans
3. GET `/my-plans/:id` with the copied ID

### Step 6: Manage Plans

1. PATCH `/my-plans/:id/status` to mark as completed
2. Generate a new plan
3. DELETE old plans

---

## Common Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**Fix:** Add Authorization header with valid JWT token

### 400 Bad Request

```json
{
  "success": false,
  "message": "Health profile not found. Please create your health profile first."
}
```

**Fix:** Create health profile before generating meal plan

### 404 Not Found

```json
{
  "success": false,
  "message": "Meal plan not found"
}
```

**Fix:** Use correct meal plan ID that belongs to your user

---

## Tips for Testing

1. **Save JWT Token:** In Postman, save it as an environment variable `{{jwt_token}}`
2. **Test in Order:** Follow the complete testing flow above
3. **Check Console:** Server logs show detailed AI prompt and response
4. **OpenAI Key:** Ensure your `.env` has valid `OPENAI_API_KEY`
5. **Response Time:** AI generation takes 10-60 seconds depending on duration
6. **Try Different Profiles:** Test with diabetes, pregnancy, weight loss, muscle building scenarios

---

## Environment Variables Required

Make sure these are set in `/home/it/mohib2/.env`:

```env
DATABASE_URL="your-postgres-url"
JWT_SECRET="your-jwt-secret"
OPENAI_API_KEY="sk-proj-your-key-here"  # ← REQUIRED for meal plan generation
EMAIL_USER="your-email"
EMAIL_PASS="your-password"
```

---

## Sample Postman Collection Structure

```
Digital Health Assistant
├── 1. Authentication
│   ├── Register User
│   ├── Verify OTP
│   └── Login
├── 2. Health Profile
│   ├── Create/Update Profile
│   ├── Get Profile
│   └── Delete Profile
└── 3. Meal Planner
    ├── Generate 7-Day Plan
    ├── Generate 30-Day Plan
    ├── Get My Plans
    ├── Get Active Plan
    ├── Get Plan by ID
    ├── Update Plan Status
    └── Delete Plan
```

---

## Expected AI Response Structure

The AI will return culturally appropriate Pakistani meals like:

- **Breakfast:** Oats porridge, Egg white omelet, Dahi (yogurt) with fruits
- **Mid-Morning Snack:** Almonds, Apple, Roasted chickpeas
- **Lunch:** Daal makhani with brown rice, Chicken karahi with wheat roti
- **Evening Snack:** Green tea with biscuits, Fruit chaat
- **Dinner:** Grilled fish with salad, Palak paneer with roti

Each meal includes:

- Ingredients with quantities
- Step-by-step recipe in Urdu/English
- Nutritional breakdown (calories, protein, carbs, fats)
- Estimated cost in PKR
- Health benefits specific to user's condition

Happy Testing! 🚀
