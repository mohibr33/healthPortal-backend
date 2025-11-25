# Reviews API Documentation

## Overview

The Reviews module allows users to post reviews with star ratings (1-5) and messages. Reviews require admin approval before being publicly visible.

## Base URL

```
/api/reviews
```

---

## Public Endpoints

### 1. Get Published Reviews

Get all approved and published reviews (visible to public).

**Endpoint:** `GET /api/reviews/published`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "userId": "uuid",
        "rating": 5,
        "message": "Great service!",
        "isApproved": true,
        "isPublished": true,
        "createdAt": "2025-11-24T10:00:00Z",
        "updatedAt": "2025-11-24T10:00:00Z",
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "averageRating": 4.5,
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

### 2. Get Review by ID

Get a specific review by ID.

**Endpoint:** `GET /api/reviews/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "rating": 5,
    "message": "Great service!",
    "isApproved": true,
    "isPublished": true,
    "createdAt": "2025-11-24T10:00:00Z",
    "updatedAt": "2025-11-24T10:00:00Z",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }
}
```

---

## Protected User Endpoints

**Authentication Required:** Bearer token in header

### 3. Create Review

Create a new review (requires authentication).

**Endpoint:** `POST /api/reviews`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "rating": 5,
  "message": "Excellent service! Very satisfied with the meal plans and health advice."
}
```

**Validation:**

- `rating`: Integer between 1-5 (required)
- `message`: String, 10-1000 characters (required)

**Response:**

```json
{
  "success": true,
  "message": "Review created successfully and pending approval",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "rating": 5,
    "message": "Excellent service!...",
    "isApproved": false,
    "isPublished": true,
    "createdAt": "2025-11-24T10:00:00Z",
    "updatedAt": "2025-11-24T10:00:00Z",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }
}
```

### 4. Get My Reviews

Get all reviews created by the authenticated user.

**Endpoint:** `GET /api/reviews/my/reviews`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "userId": "uuid",
        "rating": 5,
        "message": "Great service!",
        "isApproved": false,
        "isPublished": true,
        "createdAt": "2025-11-24T10:00:00Z",
        "updatedAt": "2025-11-24T10:00:00Z"
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

### 5. Update Review

Update user's own review (resets approval status).

**Endpoint:** `PUT /api/reviews/:id`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "rating": 4,
  "message": "Updated review message..."
}
```

**Validation:**

- `rating`: Integer between 1-5 (optional)
- `message`: String, 10-1000 characters (optional)

**Response:**

```json
{
  "success": true,
  "message": "Review updated successfully and pending approval",
  "data": {
    "id": "uuid",
    "rating": 4,
    "message": "Updated message...",
    "isApproved": false,
    "isPublished": true,
    "createdAt": "2025-11-24T10:00:00Z",
    "updatedAt": "2025-11-24T11:00:00Z"
  }
}
```

### 6. Delete Review

Delete user's own review.

**Endpoint:** `DELETE /api/reviews/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## Admin Endpoints

**Authentication Required:** Bearer token + Admin role

### 7. Get All Reviews

Get all reviews with filtering options (admin only).

**Endpoint:** `GET /api/reviews/admin/all`

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `rating` (optional): Filter by rating (1-5)
- `isApproved` (optional): Filter by approval status (true/false)
- `isPublished` (optional): Filter by publish status (true/false)
- `orderBy` (optional): Sort field - "createdAt" or "rating" (default: "createdAt")
- `order` (optional): Sort order - "asc" or "desc" (default: "desc")

**Example:**

```
GET /api/reviews/admin/all?isApproved=false&orderBy=createdAt&order=desc
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "userId": "uuid",
        "rating": 5,
        "message": "Great service!",
        "isApproved": false,
        "isPublished": true,
        "createdAt": "2025-11-24T10:00:00Z",
        "updatedAt": "2025-11-24T10:00:00Z",
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

### 8. Get Review Statistics

Get comprehensive review statistics (admin only).

**Endpoint:** `GET /api/reviews/admin/stats`

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 100,
    "approved": 75,
    "pending": 25,
    "averageRating": 4.3,
    "ratingDistribution": {
      "1": 5,
      "2": 8,
      "3": 12,
      "4": 30,
      "5": 45
    }
  }
}
```

### 9. Approve/Reject Review

Update review approval status (admin only).

**Endpoint:** `PATCH /api/reviews/admin/:id/approve`

**Headers:**

```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "isApproved": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Review approved successfully",
  "data": {
    "id": "uuid",
    "rating": 5,
    "message": "Great service!",
    "isApproved": true,
    "isPublished": true,
    "createdAt": "2025-11-24T10:00:00Z",
    "updatedAt": "2025-11-24T11:00:00Z"
  }
}
```

### 10. Publish/Unpublish Review

Update review publish status (admin only).

**Endpoint:** `PATCH /api/reviews/admin/:id/publish`

**Headers:**

```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "isPublished": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Review unpublished successfully",
  "data": {
    "id": "uuid",
    "rating": 5,
    "message": "Great service!",
    "isApproved": true,
    "isPublished": false,
    "createdAt": "2025-11-24T10:00:00Z",
    "updatedAt": "2025-11-24T11:30:00Z"
  }
}
```

### 11. Delete Review (Admin)

Delete any review (admin only).

**Endpoint:** `DELETE /api/reviews/admin/:id`

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "rating",
      "message": "Rating must be between 1 and 5"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Review not found or unauthorized"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Review Workflow

1. **User creates review** → Status: `isApproved: false`, `isPublished: true`
2. **Admin reviews the submission** → Can approve/reject
3. **If approved** → Status: `isApproved: true`, visible in public endpoint
4. **Admin can also unpublish** → `isPublished: false` (hides from public)
5. **User updates review** → Approval resets to `false`, requires re-approval

---

## Database Schema

```prisma
model Review {
  id            String   @id @default(uuid())
  userId        String
  rating        Int      // 1-5 stars
  message       String   @db.Text
  isApproved    Boolean  @default(false)
  isPublished   Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([rating])
  @@index([isApproved])
  @@index([isPublished])
  @@index([createdAt])
}
```

---

## Example Usage Flow

### Creating a Review (User)

```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "message": "Amazing meal plans! Lost 5kg in a month following the diet plan."
  }'
```

### Getting Published Reviews (Public)

```bash
curl http://localhost:5000/api/reviews/published?page=1&limit=10
```

### Approving a Review (Admin)

```bash
curl -X PATCH http://localhost:5000/api/reviews/admin/<review-id>/approve \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isApproved": true
  }'
```

### Getting Review Stats (Admin)

```bash
curl http://localhost:5000/api/reviews/admin/stats \
  -H "Authorization: Bearer <admin-token>"
```

---

## Features

✅ **User Features:**

- Create reviews with star ratings (1-5) and messages
- View their own reviews
- Update reviews (requires re-approval)
- Delete their own reviews
- View all approved public reviews

✅ **Admin Features:**

- View all reviews with advanced filtering
- Approve/reject reviews
- Publish/unpublish reviews
- Delete any review
- View comprehensive statistics
- Rating distribution analytics

✅ **Security:**

- JWT authentication required for protected routes
- Users can only modify their own reviews
- Admin-only access for moderation features
- Input validation and sanitization

✅ **Data Validation:**

- Rating must be 1-5 stars
- Message: 10-1000 characters
- Proper error messages for validation failures
