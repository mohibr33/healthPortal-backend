# Digital Health Assistant

A comprehensive digital health assistant API built with Node.js, Express, Prisma, PostgreSQL, and TypeScript.

## Features

- ✅ User Registration & Authentication
- ✅ Email Verification with OTP
- ✅ Password Reset via Email
- ✅ JWT-based Authentication
- ✅ **Google OAuth 2.0 Login**
- ✅ Profile Management
- ✅ Secure Password Hashing
- ✅ TypeScript for type safety
- ✅ Admin Panel with RBAC
- ✅ Article Management System
- ✅ Support Ticket System
- ✅ Medicine Database (2443+ medicines)
- ✅ AI-Powered Meal Planner (GPT-4o-mini)
- ✅ Medicine Reviews & Ratings

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT + Passport.js
- **OAuth**: Google OAuth 2.0
- **AI**: OpenAI GPT-4o-mini
- **Email**: Nodemailer (GMX SMTP)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following in `.env`:

- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure random string for JWT signing
- Email configuration (if you want to send actual emails)

### 3. Set Up Database

Make sure PostgreSQL is running, then:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 4. Start the Server

Development mode (with TypeScript):

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

#### Google OAuth Login

```http
GET /api/auth/google
```

Redirects to Google OAuth consent screen. After authentication, redirects to frontend with JWT token.

**Frontend Integration:**

```javascript
// Redirect user to Google login
window.location.href = "http://digitalhealth.apiv1.wyvt.com/api/auth/google";

// Handle callback at /auth/callback
const token = searchParams.get("token");
const user = searchParams.get("user");
localStorage.setItem("token", token);
```

See `GOOGLE_OAUTH_SETUP.md` for complete integration guide.

### Public Routes

#### Register User

```http
POST /api/users/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "gender": "Male",
  "phone": "1234567890"
}
```

#### Verify OTP

```http
POST /api/users/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Login

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Request Password Reset

```http
POST /api/users/request-password-reset
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password

```http
POST /api/users/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "newpassword123"
}
```

### Protected Routes (Require JWT Token)

#### Get Profile

```http
GET /api/users/profile
Authorization: Bearer <your-jwt-token>
```

#### Update Profile

```http
PUT /api/users/profile
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "gender": "Male",
  "phone": "9876543210"
}
```

#### Get All Users (Admin)

```http
GET /api/users/all?page=1&limit=10
Authorization: Bearer <your-jwt-token>
```

## Database Schema

### User Model

```prisma
model User {
  id               String    @id @default(uuid())
  firstName        String
  lastName         String
  email            String    @unique
  password         String?
  gender           String?
  phone            String?
  isVerified       Boolean   @default(false)
  otp              String?
  otpExpiry        DateTime?
  googleId         String?   @unique
  resetToken       String?
  resetTokenExpiry DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── database.ts        # Prisma client configuration
│   ├── controllers/
│   │   └── user.controller.ts # User route handlers
│   ├── middlewares/
│   │   ├── auth.middleware.ts # JWT authentication
│   │   ├── validation.middleware.ts # Input validation rules
│   │   └── errorHandler.middleware.ts # Error handling
│   ├── routes/
│   │   └── user.routes.ts     # User API routes
│   ├── services/
│   │   └── user.service.ts    # User business logic
│   ├── types/
│   │   └── user.types.ts      # TypeScript interfaces
│   └── server.ts              # Express app entry point
├── dist/                      # Compiled JavaScript (generated)
├── .env                       # Environment variables
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project dependencies
```

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database
npx prisma migrate reset
```

## Development

For development with auto-reload and TypeScript:

```bash
npm run dev
```

The TypeScript compiler will check types in real-time, and nodemon will restart the server on file changes.

## Building for Production

```bash
# Compile TypeScript to JavaScript
npm run build

# Run the compiled code
npm start
```

## Security Features

- Passwords are hashed using bcryptjs
- JWT tokens for stateless authentication
- OTP expiration (10 minutes)
- Reset token expiration (1 hour)
- Input validation on all routes
- CORS enabled
- SQL injection protection via Prisma

## Next Steps

- [x] Implement email service for OTP and password reset
- [x] Add Google OAuth implementation
- [ ] Add refresh token mechanism
- [ ] Implement rate limiting
- [ ] Add logging system
- [ ] Add unit and integration tests
- [x] Add API documentation

## Documentation

- **API Documentation**: `API_DOCUMENTATION.md` - Complete API reference
- **Google OAuth Setup**: `GOOGLE_OAUTH_SETUP.md` - OAuth integration guide
- **OAuth Summary**: `OAUTH_IMPLEMENTATION_SUMMARY.md` - Implementation details
- **Postman Testing**: `POSTMAN_TESTING_GUIDE.md` - Testing guide

## License

ISC
