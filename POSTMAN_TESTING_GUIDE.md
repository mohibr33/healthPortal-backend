# AI Meal Planner - Postman Testing Guide

## Base URL

```
http://localhost:5050
```

---

## 1. User Registration (First - to get authentication token)

**Method:** `POST`  
**URL:** `http://localhost:5050/api/users/register`

**Description:** Registers user in a `PendingRegistration` table. User must verify OTP before they can login.

**Body (JSON):**

```json
{
  "firstName": "Ahmed",
  "lastName": "Khan",
  "email": "ahmed.khan@example.com",
  "password": "Password123!",
  "phone": "+923001234567",
  "gender": "male"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with OTP.",
  "data": {
    "email": "ahmed.khan@example.com"
  }
}
```

**Note:** If you register but don't verify, you can re-register with the same email. The old pending registration will be replaced.

---

## 2. Verify OTP

**Method:** `POST`  
**URL:** `http://localhost:5050/api/users/verify-otp`

**Description:** Verifies the OTP and creates the actual user account. OTP is valid for 10 minutes.

**Body (JSON):**

```json
{
  "email": "ahmed.khan@example.com",
  "otp": "123456"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Email verified successfully. You can now login."
}
```

**Note:** Check your email for the actual OTP code. OTP expires after 10 minutes.

---

## 2a. Resend OTP (If OTP expired)

**Method:** `POST`  
**URL:** `http://localhost:5050/api/users/resend-otp`

**Description:** Resends a new OTP if the previous one expired. Generates fresh 10-minute expiry.

**Body (JSON):**

```json
{
  "email": "ahmed.khan@example.com"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "OTP resent successfully. Please check your email."
}
```

**Error Response (if no pending registration):**

```json
{
  "success": false,
  "message": "No pending registration found for this email"
}
```

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

---

## 14. Add Medicine (Medicine Adherence)

**Method:** `POST`  
**URL:** `http://localhost:5050/api/user-medicines`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON) - Example 1: Regular medicine with duration**

```json
{
  "name": "Metformin",
  "doctorName": "Dr. Ahmed Khan",
  "duration": 30,
  "isLifetime": false,
  "intakeTimes": ["08:00", "20:00"],
  "notes": "Take with food"
}
```

**Body (JSON) - Example 2: Lifetime medicine**

```json
{
  "name": "Aspirin",
  "doctorName": "Dr. Sarah Ali",
  "duration": 365,
  "isLifetime": true,
  "intakeTimes": ["09:00"],
  "notes": "Morning dose only"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Medicine added successfully",
  "data": {
    "id": "medicine-uuid",
    "userId": "user-uuid",
    "name": "Metformin",
    "doctorName": "Dr. Ahmed Khan",
    "duration": 30,
    "isLifetime": false,
    "intakeTimes": ["08:00", "20:00"],
    "notes": "Take with food",
    "isActive": true,
    "createdAt": "2026-03-30T10:00:00.000Z",
    "updatedAt": "2026-03-30T10:00:00.000Z"
  }
}
```

**Note:** When `isLifetime` is true, the system generates schedules for 30 days but marks it as lifetime.

---

## 15. Get All Medicines

**Method:** `GET`  
**URL:** `http://localhost:5050/api/user-medicines`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Query Parameters (optional):**

- `includeInactive`: `true` or `false` (default: false)

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "medicine-uuid",
      "userId": "user-uuid",
      "name": "Metformin",
      "doctorName": "Dr. Ahmed Khan",
      "duration": 30,
      "isLifetime": false,
      "intakeTimes": ["08:00", "20:00"],
      "notes": "Take with food",
      "isActive": true,
      "createdAt": "2026-03-30T10:00:00.000Z",
      "updatedAt": "2026-03-30T10:00:00.000Z"
    }
  ]
}
```

---

## 16. Get Medicine by ID

**Method:** `GET`  
**URL:** `http://localhost:5050/api/user-medicines/{medicine-id}

**Example:**

```
http://localhost:5050/api/user-medicines/abc123-def456
```

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 17. Update Medicine

**Method:** `PUT`  
**URL:** `http://localhost:5050/api/user-medicines/{medicine-id}`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "name": "Metformin Extended",
  "intakeTimes": ["07:00", "19:00", "23:00"]
}
```

---

## 18. Delete Medicine

**Method:** `DELETE`  
**URL:** `http://localhost:5050/api/user-medicines/{medicine-id}`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Note:** This soft-deletes the medicine (sets `isActive` to false).

---

## 19. Get Reminders (Today's Doses)

**Method:** `GET`  
**URL:** `http://localhost:5050/api/user-medicines/reminders`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Query Parameters (optional):**

- `date`: ISO date string (e.g., `2026-03-30`)

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "dose-uuid",
      "medicineName": "Metformin",
      "scheduledTime": "08:00",
      "scheduledDate": "2026-03-30T00:00:00.000Z",
      "status": "pending",
      "takenAt": null
    },
    {
      "id": "dose-uuid-2",
      "medicineName": "Metformin",
      "scheduledTime": "20:00",
      "scheduledDate": "2026-03-30T00:00:00.000Z",
      "status": "taken",
      "takenAt": "2026-03-30T20:15:00.000Z"
    }
  ]
}
```

**Dose Status Values:**

- `pending` - Not yet taken
- `taken` - User marked as taken
- `missed` - Not taken within 4 hours of scheduled time

---

## 20. Mark Dose as Taken

**Method:** `PATCH`  
**URL:** `http://localhost:5050/api/user-medicines/{dose-id}/take`

**Example:**

```
http://localhost:5050/api/user-medicines/abc123/take
```

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**No Body Required**

**Expected Response:**

```json
{
  "success": true,
  "message": "Dose marked as taken",
  "data": {
    "id": "dose-uuid",
    "userMedicineId": "medicine-uuid",
    "scheduledDate": "2026-03-30T00:00:00.000Z",
    "scheduledTime": "08:00",
    "status": "taken",
    "takenAt": "2026-03-30T08:15:00.000Z",
    "reminderSent": true,
    "createdAt": "2026-03-30T00:00:00.000Z",
    "updatedAt": "2026-03-30T08:15:00.000Z"
  }
}
```

---

## 21. Get Dose History

**Method:** `GET`  
**URL:** `http://localhost:5050/api/user-medicines/history`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Query Parameters (optional):**

- `medicineId`: Filter by specific medicine
- `limit`: Number of records (default: 50)

**Example:**

```
http://localhost:5050/api/user-medicines/history?medicineId=abc123&limit=10
```

---

## Complete Medicine Adherence Testing Flow

### Step 1: Login & Get Token

1. Login to get JWT token
2. Copy the token for authorization header

### Step 2: Add Medicines

1. POST `/user-medicines` with first medicine
2. POST `/user-medicines` with second medicine
3. GET `/user-medicines` to verify

### Step 3: View Reminders

1. GET `/user-medicines/reminders` to see today's doses
2. Note the `dose-id` from the response

### Step 4: Test Dose Tracking

1. PATCH `/user-medicines/{dose-id}/take` to mark as taken
2. GET `/user-medicines/reminders` to see status changed to "taken"

### Step 5: Test Missed Dose Logic

1. Wait 4 hours (or set `MISSED_DOSE_HOURS=1` in .env for faster testing)
2. Check reminders - doses should auto-mark as "missed"
3. Server console will log missed dose notifications

---

## Testing the Scheduler

The scheduler runs every 60 seconds and:

1. **Checks for pending reminders** - If scheduled time has passed and reminder not sent, logs reminder (simulated SMS)
2. **Marks missed doses** - If dose not taken within X hours (default 4), marks as "missed"

**To test faster:**

Add to backend `.env`:
```env
MISSED_DOSE_HOURS=1
```

Then restart the backend server.

---

## Sample Postman Collection (Updated)

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
├── 3. Meal Planner
│   ├── Generate 7-Day Plan
│   ├── Generate 30-Day Plan
│   ├── Get My Plans
│   ├── Get Active Plan
│   ├── Get Plan by ID
│   ├── Update Plan Status
│   └── Delete Plan
└── 4. Medicine Adherence
    ├── Add Medicine
    ├── Get All Medicines
    ├── Get Medicine by ID
    ├── Update Medicine
    ├── Delete Medicine
    ├── Get Reminders
    ├── Mark Dose as Taken
    └── Get Dose History
```

Happy Testing! 🚀
