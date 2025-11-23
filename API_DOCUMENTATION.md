# Digital Health Assistant - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [Article Management](#article-management)
5. [Support Tickets](#support-tickets)
6. [Medicines](#medicines)
7. [AI Meal Planner](#ai-meal-planner)
8. [Admin Panel](#admin-panel)
9. [Error Handling](#error-handling)
10. [Rate Limiting & Security](#rate-limiting--security)

---

## Overview

**Base URL:** `http://localhost:5050`

**API Version:** 1.0.0

**Content-Type:** `application/json`

**Authentication:** JWT Bearer Token (except public endpoints)

### Technology Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **AI:** OpenAI GPT-4o-mini
- **Email:** Nodemailer (GMX SMTP)

---

## Authentication

### JWT Token Structure

All authenticated requests require a Bearer token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiry:** 7 days (configurable via `JWT_EXPIRE` in `.env`)

---

## User Management

Base Path: `/api/users`

### 1. Register New User

**Endpoint:** `POST /api/users/register`

**Access:** Public

**Description:** Register a new user account. Sends OTP to email for verification.

**Request Body:**

```json
{
  "name": "Ahmed Khan",
  "email": "ahmed.khan@example.com",
  "password": "Password123!",
  "phone": "+923001234567"
}
```

**Validation Rules:**

- `name`: Required, min 2 characters
- `email`: Required, valid email format
- `password`: Required, min 8 characters, must contain uppercase, lowercase, and number
- `phone`: Optional, Pakistani format (+92xxx)

**Success Response (201):**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with OTP.",
  "data": {
    "userId": "cm3vwx123abc456def789",
    "email": "ahmed.khan@example.com",
    "name": "Ahmed Khan"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### 2. Verify OTP

**Endpoint:** `POST /api/users/verify-otp`

**Access:** Public

**Description:** Verify email using OTP sent during registration.

**Request Body:**

```json
{
  "email": "ahmed.khan@example.com",
  "otp": "123456"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

### 3. Login

**Endpoint:** `POST /api/users/login`

**Access:** Public

**Description:** Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "ahmed.khan@example.com",
  "password": "Password123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cm3vwx123abc456def789",
      "name": "Ahmed Khan",
      "email": "ahmed.khan@example.com",
      "role": "user",
      "isVerified": true,
      "createdAt": "2025-11-23T10:30:00.000Z"
    }
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 4. Get User Profile

**Endpoint:** `GET /api/users/profile`

**Access:** Protected (Requires JWT)

**Description:** Get logged-in user's profile information.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cm3vwx123abc456def789",
    "name": "Ahmed Khan",
    "email": "ahmed.khan@example.com",
    "phone": "+923001234567",
    "role": "user",
    "isVerified": true,
    "createdAt": "2025-11-23T10:30:00.000Z",
    "updatedAt": "2025-11-23T10:30:00.000Z"
  }
}
```

---

### 5. Update User Profile

**Endpoint:** `PUT /api/users/profile`

**Access:** Protected (Requires JWT)

**Description:** Update user profile information.

**Request Body:**

```json
{
  "name": "Ahmed Ali Khan",
  "phone": "+923009876543"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "cm3vwx123abc456def789",
    "name": "Ahmed Ali Khan",
    "email": "ahmed.khan@example.com",
    "phone": "+923009876543"
  }
}
```

---

### 6. Request Password Reset

**Endpoint:** `POST /api/users/request-password-reset`

**Access:** Public

**Description:** Request password reset OTP via email.

**Request Body:**

```json
{
  "email": "ahmed.khan@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

---

### 7. Reset Password

**Endpoint:** `POST /api/users/reset-password`

**Access:** Public

**Description:** Reset password using OTP.

**Request Body:**

```json
{
  "email": "ahmed.khan@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## Article Management

Base Path: `/api/articles`

### 1. Get All Articles

**Endpoint:** `GET /api/articles`

**Access:** Public

**Description:** Get paginated list of published articles.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:** `GET /api/articles?page=2&limit=5`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "article-id-123",
        "title": "10 Tips for Healthy Living",
        "slug": "10-tips-for-healthy-living",
        "excerpt": "Discover simple ways to improve your health...",
        "content": "Full article content here...",
        "category": "Health Tips",
        "imageUrl": "https://example.com/image.jpg",
        "author": "Dr. Sarah Ahmed",
        "readTime": 5,
        "tags": ["health", "wellness", "lifestyle"],
        "createdAt": "2025-11-20T10:00:00.000Z",
        "updatedAt": "2025-11-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 2,
      "limit": 5,
      "totalPages": 9
    }
  }
}
```

---

### 2. Search Articles

**Endpoint:** `GET /api/articles/search`

**Access:** Public

**Description:** Search articles by title, content, or tags.

**Query Parameters:**

- `q` (required): Search query
- `page` (optional): Page number
- `limit` (optional): Items per page

**Example:** `GET /api/articles/search?q=diabetes&page=1&limit=10`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "articles": [...],
    "pagination": {...}
  }
}
```

---

### 3. Get Articles by Category

**Endpoint:** `GET /api/articles/category/:category`

**Access:** Public

**Description:** Get all articles in a specific category.

**Example:** `GET /api/articles/category/Nutrition`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "category": "Nutrition",
    "articles": [...],
    "total": 12
  }
}
```

---

### 4. Get Article by Slug

**Endpoint:** `GET /api/articles/:slug`

**Access:** Public

**Description:** Get single article by its URL slug.

**Example:** `GET /api/articles/10-tips-for-healthy-living`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "article-id-123",
    "title": "10 Tips for Healthy Living",
    "slug": "10-tips-for-healthy-living",
    "content": "Full article content...",
    "category": "Health Tips",
    "author": "Dr. Sarah Ahmed",
    "readTime": 5,
    "tags": ["health", "wellness"],
    "createdAt": "2025-11-20T10:00:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Article not found"
}
```

---

## Support Tickets

Base Path: `/api/tickets`

**Authentication:** All ticket routes require JWT authentication.

### 1. Create Support Ticket

**Endpoint:** `POST /api/tickets`

**Access:** Protected

**Description:** Submit a new support ticket. Sends email notification to admin.

**Request Body:**

```json
{
  "subject": "Unable to generate meal plan",
  "message": "I'm getting an error when trying to generate a 7-day meal plan. The error says 'OpenAI API error'.",
  "category": "Technical Issue"
}
```

**Validation:**

- `subject`: Required, 5-200 characters
- `message`: Required, 10-2000 characters
- `category`: Optional, enum: ["Technical Issue", "Billing", "Feature Request", "General Inquiry", "Bug Report"]

**Success Response (201):**

```json
{
  "success": true,
  "message": "Support ticket created successfully. We will respond within 24-48 hours.",
  "data": {
    "id": "ticket-id-456",
    "ticketNumber": "TKT-20251123-001",
    "subject": "Unable to generate meal plan",
    "message": "I'm getting an error when...",
    "category": "Technical Issue",
    "status": "open",
    "priority": "medium",
    "createdAt": "2025-11-23T12:00:00.000Z"
  }
}
```

---

### 2. Get My Tickets

**Endpoint:** `GET /api/tickets/my-tickets`

**Access:** Protected

**Description:** Get all tickets created by logged-in user.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status ("open", "in_progress", "resolved", "closed")

**Example:** `GET /api/tickets/my-tickets?status=open&page=1`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket-id-456",
        "ticketNumber": "TKT-20251123-001",
        "subject": "Unable to generate meal plan",
        "category": "Technical Issue",
        "status": "open",
        "priority": "medium",
        "createdAt": "2025-11-23T12:00:00.000Z",
        "updatedAt": "2025-11-23T12:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3. Get Ticket by ID

**Endpoint:** `GET /api/tickets/:id`

**Access:** Protected (User can only view their own tickets)

**Description:** Get detailed information about a specific ticket.

**Example:** `GET /api/tickets/ticket-id-456`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "ticket-id-456",
    "ticketNumber": "TKT-20251123-001",
    "subject": "Unable to generate meal plan",
    "message": "I'm getting an error when...",
    "category": "Technical Issue",
    "status": "in_progress",
    "priority": "high",
    "adminResponse": "We're looking into this issue. Please try clearing your cache.",
    "resolvedAt": null,
    "createdAt": "2025-11-23T12:00:00.000Z",
    "updatedAt": "2025-11-23T14:00:00.000Z",
    "user": {
      "name": "Ahmed Khan",
      "email": "ahmed.khan@example.com"
    }
  }
}
```

---

## Medicines

Base Path: `/api/medicines`

**Authentication:** Public (No authentication required)

### 1. Get All Medicines

**Endpoint:** `GET /api/medicines`

**Access:** Public

**Description:** Get paginated list of all medicines.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example:** `GET /api/medicines?page=1&limit=50`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "id": "med-id-789",
        "name": "Panadol",
        "slug": "panadol",
        "genericName": "Paracetamol",
        "brand": "GlaxoSmithKline",
        "category": "Pain Relief",
        "description": "Fast relief from headaches, fever, and body pain",
        "dosageForm": "Tablet",
        "strength": "500mg",
        "price": 12.5,
        "manufacturer": "GlaxoSmithKline Pakistan",
        "prescriptionRequired": false,
        "sideEffects": ["Nausea", "Allergic reactions (rare)"],
        "warnings": ["Do not exceed 8 tablets in 24 hours"],
        "createdAt": "2025-11-15T08:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 2443,
      "page": 1,
      "limit": 20,
      "totalPages": 123
    }
  }
}
```

---

### 2. Search Medicines

**Endpoint:** `GET /api/medicines/search`

**Access:** Public

**Description:** Search medicines by name, generic name, or brand.

**Query Parameters:**

- `q` (required): Search query
- `page` (optional): Page number
- `limit` (optional): Items per page

**Example:** `GET /api/medicines/search?q=paracetamol&limit=10`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "medicines": [...],
    "pagination": {...}
  }
}
```

---

### 3. Get Medicine Brands

**Endpoint:** `GET /api/medicines/brands`

**Access:** Public

**Description:** Get list of all unique medicine brands.

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "brands": [
      "Abbott Laboratories",
      "Ferozsons Laboratories",
      "GlaxoSmithKline",
      "Getz Pharma",
      "Hilton Pharma",
      "Searle Pakistan"
    ],
    "total": 45
  }
}
```

---

### 4. Get Medicines by Category

**Endpoint:** `GET /api/medicines/category/:category`

**Access:** Public

**Example:** `GET /api/medicines/category/Pain%20Relief`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "category": "Pain Relief",
    "medicines": [...],
    "total": 87
  }
}
```

---

### 5. Get Medicines by Brand

**Endpoint:** `GET /api/medicines/brand/:brand`

**Access:** Public

**Example:** `GET /api/medicines/brand/GlaxoSmithKline`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "brand": "GlaxoSmithKline",
    "medicines": [...],
    "total": 34
  }
}
```

---

### 6. Get Medicine by ID

**Endpoint:** `GET /api/medicines/:id`

**Access:** Public

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "med-id-789",
    "name": "Panadol",
    "genericName": "Paracetamol",
    "brand": "GlaxoSmithKline",
    "category": "Pain Relief",
    "description": "Fast relief from headaches...",
    "dosageForm": "Tablet",
    "strength": "500mg",
    "price": 12.50,
    "prescriptionRequired": false,
    "sideEffects": [...],
    "warnings": [...]
  }
}
```

---

### 7. Get Medicine by Slug

**Endpoint:** `GET /api/medicines/slug/:slug`

**Access:** Public

**Example:** `GET /api/medicines/slug/panadol`

**Success Response (200):**

```json
{
  "success": true,
  "data": {...}
}
```

---

## AI Meal Planner

Base Path: `/api/meal-planner`

**Authentication:** All meal planner routes require JWT authentication.

**AI Model:** OpenAI GPT-4o-mini (optimized for Pakistani cuisine and health conditions)

### 1. Create/Update Health Profile

**Endpoint:** `POST /api/meal-planner/health-profile`

**Access:** Protected

**Description:** Create or update user's health profile for personalized meal planning.

**⚠️ Important:** This endpoint uses an **UPSERT pattern**:

- If no health profile exists for the user → **Creates new profile**
- If profile already exists → **Updates existing profile**
- You can call this endpoint multiple times to update your health data

**Use Cases:**

- First time setup: Create your initial health profile
- Update weight: Post updated weight and other unchanged fields
- Change goals: Update your fitness goals or dietary preferences
- Medical updates: Add new conditions, medications, or allergies

**Request Body:**

```json
{
  "age": 35,
  "height": 172,
  "weight": 85,
  "targetWeight": 75,
  "medicalConditions": ["Diabetes Type 2", "Hypertension"],
  "medications": "Metformin 500mg twice daily, Amlodipine 5mg",
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

**Field Validations:**

- `age`: 1-120
- `height`: 50-300 cm
- `weight`: 20-300 kg
- `dietaryPreference`: ["Non-Vegetarian", "Vegetarian", "Vegan", "Pescatarian", "Halal only"]
- `activityLevel`: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Athlete"]
- `primaryGoal`: ["Weight Loss", "Weight Gain", "Muscle Building", "Maintenance", "Disease Management", "Improved Energy", "Better Digestion", "Overall Health"]
- `sleepQuality`: ["Poor", "Fair", "Good", "Excellent"]
- `cookingSkill`: ["Beginner", "Intermediate", "Advanced", "Have a cook"]
- `mealsPerDay`: 2-6

**Success Response (201):**

```json
{
  "success": true,
  "message": "Health profile saved successfully",
  "data": {
    "id": "profile-id-999",
    "userId": "cm3vwx123abc456def789",
    "age": 35,
    "height": 172,
    "weight": 85,
    "bmi": 28.76,
    "targetWeight": 75,
    "medicalConditions": ["Diabetes Type 2", "Hypertension"],
    "primaryGoal": "Weight Loss",
    "city": "Lahore",
    "createdAt": "2025-11-23T15:00:00.000Z",
    "updatedAt": "2025-11-23T15:00:00.000Z"
  }
}
```

---

### 2. Get Health Profile

**Endpoint:** `GET /api/meal-planner/health-profile`

**Access:** Protected

**Description:** Retrieve user's health profile.

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "profile-id-999",
    "age": 35,
    "height": 172,
    "weight": 85,
    "targetWeight": 75,
    "medicalConditions": ["Diabetes Type 2", "Hypertension"],
    "allergies": ["Peanuts", "Shellfish"],
    "dietaryPreference": "Halal only",
    "activityLevel": "Lightly Active",
    "primaryGoal": "Weight Loss",
    "monthlyBudget": 25000,
    "city": "Lahore"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Health profile not found"
}
```

---

### 3. Generate AI Meal Plan

**Endpoint:** `POST /api/meal-planner/generate`

**Access:** Protected

**Description:** Generate personalized meal plan using AI based on health profile. Requires health profile to be created first.

**Request Body:**

```json
{
  "duration": "7"
}
```

**Validation:**

- `duration`: Must be either "7" or "30"

**Processing Time:** 10-60 seconds (depending on duration)

**Success Response (201):**

```json
{
  "success": true,
  "message": "Meal plan generated successfully",
  "data": {
    "id": "plan-id-888",
    "duration": "7 days",
    "status": "active",
    "totalCalories": 1800,
    "estimatedCost": 8500,
    "createdAt": "2025-11-23T15:30:00.000Z",
    "mealPlanData": {
      "overview": "7-day diabetes-friendly weight loss meal plan tailored for Lahore, Pakistan",
      "healthConsiderations": [
        "Low glycemic index foods to manage blood sugar",
        "Sodium restriction for hypertension control",
        "High fiber content for satiety and blood sugar control",
        "Avoiding peanuts and shellfish due to allergies"
      ],
      "days": [
        {
          "day": 1,
          "date": "Day 1",
          "dailyCalories": 1800,
          "dailyCost": 1200,
          "meals": [
            {
              "mealTime": "Breakfast (8:00 AM)",
              "dishName": "Oats Porridge with Almonds and Skimmed Milk",
              "ingredients": [
                "1/2 cup rolled oats",
                "1 cup skimmed milk",
                "5 almonds (chopped)",
                "1 tsp honey",
                "1/4 tsp cinnamon powder"
              ],
              "recipe": "1. Boil skimmed milk in a pot. 2. Add oats and cook for 5-7 minutes on low heat. 3. Stir continuously to prevent lumps. 4. Add cinnamon and honey. 5. Top with chopped almonds. Serve warm.",
              "calories": 280,
              "protein": 12,
              "carbs": 45,
              "fats": 6,
              "fiber": 5,
              "estimatedCost": 60,
              "healthBenefits": "Low GI breakfast, helps control blood sugar, rich in fiber"
            },
            {
              "mealTime": "Mid-Morning Snack (11:00 AM)",
              "dishName": "Apple with Green Tea",
              "ingredients": ["1 medium apple", "1 cup green tea (no sugar)"],
              "recipe": "Slice apple and enjoy with freshly brewed green tea.",
              "calories": 95,
              "protein": 0.5,
              "carbs": 25,
              "fats": 0.3,
              "estimatedCost": 40,
              "healthBenefits": "Hydration, antioxidants, natural sweetness"
            },
            {
              "mealTime": "Lunch (1:30 PM)",
              "dishName": "Daal Makhani with Brown Rice and Cucumber Raita",
              "ingredients": [
                "1/2 cup cooked daal makhani (minimal butter)",
                "3/4 cup cooked brown rice",
                "1/2 cup cucumber raita (low-fat yogurt)",
                "1 small whole wheat roti",
                "Mixed green salad"
              ],
              "recipe": "Cook daal makhani with minimal oil. Serve with steamed brown rice, raita, and fresh salad.",
              "calories": 450,
              "protein": 18,
              "carbs": 68,
              "fats": 12,
              "fiber": 10,
              "estimatedCost": 180,
              "healthBenefits": "High protein, complex carbs, probiotics from yogurt"
            },
            {
              "mealTime": "Evening Snack (5:00 PM)",
              "dishName": "Roasted Chickpeas (Chana)",
              "ingredients": [
                "1/4 cup roasted chickpeas",
                "Pinch of chaat masala",
                "Lemon juice"
              ],
              "recipe": "Season roasted chickpeas with chaat masala and lemon juice.",
              "calories": 120,
              "protein": 6,
              "carbs": 20,
              "fats": 2,
              "estimatedCost": 30,
              "healthBenefits": "High protein snack, controls hunger"
            },
            {
              "mealTime": "Dinner (8:00 PM)",
              "dishName": "Grilled Chicken Breast with Palak and Whole Wheat Roti",
              "ingredients": [
                "150g grilled chicken breast",
                "1 cup palak (spinach) curry (minimal oil)",
                "2 small whole wheat rotis",
                "Onion and tomato salad"
              ],
              "recipe": "Marinate chicken with yogurt and spices. Grill until cooked. Prepare palak with minimal oil. Serve with fresh rotis and salad.",
              "calories": 480,
              "protein": 42,
              "carbs": 48,
              "fats": 12,
              "fiber": 8,
              "estimatedCost": 350,
              "healthBenefits": "High protein, iron-rich, low carb dinner"
            },
            {
              "mealTime": "Before Bed (10:00 PM)",
              "dishName": "Warm Skimmed Milk with Turmeric",
              "ingredients": [
                "1 cup warm skimmed milk",
                "1/4 tsp turmeric powder"
              ],
              "recipe": "Heat milk and add turmeric. Mix well and drink warm.",
              "calories": 80,
              "protein": 8,
              "carbs": 12,
              "fats": 0.5,
              "estimatedCost": 40,
              "healthBenefits": "Improves sleep, anti-inflammatory"
            }
          ]
        }
        // Days 2-7 follow similar structure
      ],
      "summary": {
        "totalCaloriesPerDay": 1800,
        "proteinPerDay": "90-100g",
        "carbsPerDay": "220-240g",
        "fatsPerDay": "35-40g",
        "estimatedCost": "8500 PKR/week",
        "expectedWeightLoss": "0.5-1 kg per week",
        "keyRecommendations": [
          "Drink 8-10 glasses of water daily",
          "Monitor blood sugar levels before and after meals",
          "Check blood pressure daily",
          "Avoid high-sodium packaged foods",
          "30-minute walk after dinner recommended"
        ]
      },
      "shoppingList": {
        "grains": ["Oats", "Brown rice", "Whole wheat flour"],
        "proteins": [
          "Chicken breast",
          "Eggs",
          "Daal (various types)",
          "Low-fat yogurt"
        ],
        "vegetables": [
          "Spinach",
          "Tomatoes",
          "Cucumbers",
          "Onions",
          "Mixed greens"
        ],
        "fruits": ["Apples", "Oranges", "Bananas"],
        "dairy": ["Skimmed milk", "Low-fat yogurt"],
        "spices": ["Turmeric", "Cumin", "Coriander", "Garam masala"],
        "others": ["Almonds", "Green tea", "Honey"]
      }
    }
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Health profile not found. Please create your health profile first."
}
```

**Error Response (500):**

```json
{
  "success": false,
  "message": "OpenAI API error. Please try again later."
}
```

---

### 4. Get My Meal Plans

**Endpoint:** `GET /api/meal-planner/my-plans`

**Access:** Protected

**Description:** Get all meal plans created by user (paginated).

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:** `GET /api/meal-planner/my-plans?page=1&limit=5`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "mealPlans": [
      {
        "id": "plan-id-888",
        "duration": "7 days",
        "status": "active",
        "totalCalories": 1800,
        "estimatedCost": 8500,
        "createdAt": "2025-11-23T15:30:00.000Z"
      },
      {
        "id": "plan-id-777",
        "duration": "30 days",
        "status": "completed",
        "totalCalories": 2000,
        "estimatedCost": 35000,
        "createdAt": "2025-10-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 5,
      "totalPages": 1
    }
  }
}
```

---

### 5. Get Active Meal Plan

**Endpoint:** `GET /api/meal-planner/active`

**Access:** Protected

**Description:** Get currently active meal plan.

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "plan-id-888",
    "duration": "7 days",
    "status": "active",
    "mealPlanData": {...},
    "totalCalories": 1800,
    "estimatedCost": 8500,
    "createdAt": "2025-11-23T15:30:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "No active meal plan found"
}
```

---

### 6. Get Meal Plan by ID

**Endpoint:** `GET /api/meal-planner/:id`

**Access:** Protected (User can only view their own plans)

**Example:** `GET /api/meal-planner/plan-id-888`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "plan-id-888",
    "duration": "7 days",
    "status": "active",
    "mealPlanData": {...},
    "totalCalories": 1800,
    "estimatedCost": 8500,
    "createdAt": "2025-11-23T15:30:00.000Z"
  }
}
```

---

### 7. Update Meal Plan Status

**Endpoint:** `PATCH /api/meal-planner/:id/status`

**Access:** Protected

**Description:** Update meal plan status (active/completed/archived).

**Request Body:**

```json
{
  "status": "completed"
}
```

**Valid Status Values:**

- `active`
- `completed`
- `archived`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Meal plan status updated successfully",
  "data": {
    "id": "plan-id-888",
    "status": "completed"
  }
}
```

---

### 8. Delete Meal Plan

**Endpoint:** `DELETE /api/meal-planner/:id`

**Access:** Protected

**Description:** Delete a meal plan.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Meal plan deleted successfully"
}
```

---

### 9. Delete Health Profile

**Endpoint:** `DELETE /api/meal-planner/health-profile`

**Access:** Protected

**Description:** Delete user's health profile.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Health profile deleted successfully"
}
```

---

## Admin Panel

Base Path: `/api/admin`

**Authentication:** All admin routes require JWT token + Admin role.

**Authorization Header:**

```
Authorization: Bearer ADMIN_JWT_TOKEN
```

### User Management

#### 1. Get All Users

**Endpoint:** `GET /api/admin/users`

**Access:** Admin Only

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-id-1",
        "name": "Ahmed Khan",
        "email": "ahmed@example.com",
        "role": "user",
        "isVerified": true,
        "createdAt": "2025-11-20T10:00:00.000Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

#### 2. Search Users

**Endpoint:** `GET /api/admin/users/search`

**Access:** Admin Only

**Query Parameters:**

- `q` (required): Search query (name or email)

**Example:** `GET /api/admin/users/search?q=ahmed`

---

#### 3. Get User by ID

**Endpoint:** `GET /api/admin/users/:id`

**Access:** Admin Only

---

#### 4. Update User

**Endpoint:** `PUT /api/admin/users/:id`

**Access:** Admin Only

**Request Body:**

```json
{
  "name": "Updated Name",
  "role": "admin",
  "isVerified": true
}
```

---

#### 5. Delete User

**Endpoint:** `DELETE /api/admin/users/:id`

**Access:** Admin Only

---

### Article Management (Admin)

#### 1. Create Article

**Endpoint:** `POST /api/admin/articles`

**Access:** Admin Only

**Request Body:**

```json
{
  "title": "10 Tips for Healthy Living",
  "content": "Article content here...",
  "excerpt": "Brief summary...",
  "category": "Health Tips",
  "author": "Dr. Sarah Ahmed",
  "imageUrl": "https://example.com/image.jpg",
  "readTime": 5,
  "tags": ["health", "wellness", "lifestyle"]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Article created successfully",
  "data": {
    "id": "article-id",
    "title": "10 Tips for Healthy Living",
    "slug": "10-tips-for-healthy-living",
    "createdAt": "2025-11-23T16:00:00.000Z"
  }
}
```

---

#### 2. Update Article

**Endpoint:** `PUT /api/admin/articles/:id`

**Access:** Admin Only

---

#### 3. Delete Article

**Endpoint:** `DELETE /api/admin/articles/:id`

**Access:** Admin Only

---

### Ticket Management (Admin)

#### 1. Get All Tickets

**Endpoint:** `GET /api/admin/tickets`

**Access:** Admin Only

**Query Parameters:**

- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `page`, `limit`

---

#### 2. Get Ticket Stats

**Endpoint:** `GET /api/admin/tickets/stats`

**Access:** Admin Only

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "total": 156,
    "open": 23,
    "inProgress": 12,
    "resolved": 98,
    "closed": 23,
    "averageResponseTime": "4.5 hours"
  }
}
```

---

#### 3. Resolve Ticket

**Endpoint:** `PUT /api/admin/tickets/:id/resolve`

**Access:** Admin Only

**Request Body:**

```json
{
  "adminResponse": "We've fixed the issue. Please try again.",
  "status": "resolved"
}
```

---

#### 4. Delete Ticket

**Endpoint:** `DELETE /api/admin/tickets/:id`

**Access:** Admin Only

---

### Medicine Management (Admin)

#### 1. Create Medicine

**Endpoint:** `POST /api/admin/medicines`

**Access:** Admin Only

**Request Body:**

```json
{
  "name": "Panadol",
  "genericName": "Paracetamol",
  "brand": "GlaxoSmithKline",
  "category": "Pain Relief",
  "description": "Fast relief from headaches...",
  "dosageForm": "Tablet",
  "strength": "500mg",
  "price": 12.5,
  "manufacturer": "GlaxoSmithKline Pakistan",
  "prescriptionRequired": false,
  "sideEffects": ["Nausea", "Allergic reactions"],
  "warnings": ["Do not exceed 8 tablets in 24 hours"]
}
```

---

#### 2. Update Medicine

**Endpoint:** `PUT /api/admin/medicines/:id`

**Access:** Admin Only

---

#### 3. Delete Medicine

**Endpoint:** `DELETE /api/admin/medicines/:id`

**Access:** Admin Only

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning               | Description                                     |
| ---- | --------------------- | ----------------------------------------------- |
| 200  | OK                    | Request successful                              |
| 201  | Created               | Resource created successfully                   |
| 400  | Bad Request           | Invalid request data or validation error        |
| 401  | Unauthorized          | Missing or invalid authentication token         |
| 403  | Forbidden             | Insufficient permissions (not admin)            |
| 404  | Not Found             | Resource not found                              |
| 409  | Conflict              | Resource already exists (e.g., duplicate email) |
| 500  | Internal Server Error | Server-side error                               |

### Common Error Messages

#### Authentication Errors

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

#### Validation Errors

```json
{
  "success": false,
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters and contain uppercase, lowercase, and numbers"
    },
    {
      "field": "age",
      "message": "Age must be between 1 and 120"
    }
  ]
}
```

#### Resource Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

#### Duplicate Resource

```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

## Rate Limiting & Security

### Rate Limiting

- **User endpoints:** 100 requests per 15 minutes per IP
- **AI Meal Planner:** 5 meal plan generations per day per user
- **OTP requests:** 3 requests per hour per email

### Security Features

- **Password Hashing:** bcrypt with salt rounds = 10
- **JWT Tokens:** HS256 algorithm, 7-day expiry
- **CORS:** Configured for specific origins
- **Input Validation:** express-validator for all inputs
- **SQL Injection Prevention:** Prisma ORM with parameterized queries
- **XSS Protection:** Sanitized inputs and outputs

### Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://user:password@host/database"

# Server
PORT=5050
NODE_ENV=development

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRE=7d

# Email
EMAIL_USER="your-email@gmx.com"
EMAIL_PASS="your-password"
EMAIL_HOST=mail.gmx.com
SMTP_PORT=587

# OpenAI
OPENAI_API_KEY="sk-proj-your-key-here"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5050/api/auth/google/callback"
```

---

## Testing with Postman

### 1. Setup Environment Variables

Create environment in Postman with:

- `base_url`: `http://localhost:5050`
- `jwt_token`: (set after login)

### 2. Import Collection

Use the base URL and create folders:

```
Digital Health Assistant API
├── Authentication
├── User Profile
├── Articles
├── Support Tickets
├── Medicines
├── AI Meal Planner
└── Admin Panel
```

### 3. Authentication Flow

1. Register → Get user ID
2. Verify OTP → Activate account
3. Login → Save JWT token
4. Use token in all subsequent requests

---

## Changelog

### Version 1.0.0 (November 2025)

- ✅ User authentication with email OTP verification
- ✅ Admin panel with role-based access control
- ✅ Article management system
- ✅ Support ticket system with email notifications
- ✅ Medicine database (2443+ medicines)
- ✅ AI-powered meal planner with GPT-4o-mini
- ✅ Pakistani cuisine focus with cultural relevance
- ✅ Health condition-specific meal plans
- ✅ Budget-conscious meal planning

---

## Support

**Email:** DigitalHealthAssistance@gmx.com

**Documentation:** `/API_DOCUMENTATION.md`

**Testing Guide:** `/POSTMAN_TESTING_GUIDE.md`

**GitHub:** healthPortal-backend

---

## License

Proprietary - Digital Health Assistant © 2025

---

**Last Updated:** November 23, 2025
