# 🚀 Quick Start: Google OAuth

## For Frontend Developers

### 1. Add Login Button

```jsx
const GoogleLoginButton = () => {
  const handleLogin = () => {
    window.location.href =
      "http://digitalhealth.apiv1.wyvt.com/api/auth/google";
  };

  return (
    <button onClick={handleLogin}>
      <img src="/google-icon.svg" alt="Google" />
      Sign in with Google
    </button>
  );
};
```

### 2. Create Callback Page

Create `/auth/callback` route in your app:

```jsx
// pages/auth/callback.jsx
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const user = searchParams.get("user");

    if (token && user) {
      // Save auth data
      localStorage.setItem("token", token);
      localStorage.setItem("user", user);

      // Redirect to dashboard
      navigate("/dashboard");
    } else {
      navigate("/login?error=auth_failed");
    }
  }, []);

  return <div>Logging you in...</div>;
}
```

### 3. Use Token in API Calls

```javascript
// api/client.js
export const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://digitalhealth.apiv1.wyvt.com/api${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.json();
  },

  post: async (endpoint, data) => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://digitalhealth.apiv1.wyvt.com/api${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    return response.json();
  },
};

// Usage
const profile = await api.get("/users/profile");
const mealPlan = await api.post("/meal-planner/generate", { duration: "7" });
```

## For Backend Testing

### Test OAuth Flow

```bash
# 1. Start server
npm run dev

# 2. Open browser
http://localhost:5050/api/auth/google

# 3. Sign in with Google

# 4. You'll be redirected to:
http://localhost:3000/auth/callback?token=eyJhbG...&user=%7B%22id%22...
```

### Test with cURL

```bash
# Get your token from the callback URL, then:
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5050/api/users/profile
```

## Environment Variables

```env
# Backend (.env)
GOOGLE_CLIENT_ID=76175019490-pj8053lob6iadhqij8o0p4tfeh420jh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-DhDzikKibvHTU1OPECNrAzszE9N
GOOGLE_CALLBACK_URL=http://digitalhealth.apiv1.wyvt.com/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

```env
# Frontend (.env.local)
REACT_APP_API_URL=http://digitalhealth.apiv1.wyvt.com
REACT_APP_GOOGLE_LOGIN=http://digitalhealth.apiv1.wyvt.com/api/auth/google
```

## API Endpoints

| Endpoint                    | Method | Description                       |
| --------------------------- | ------ | --------------------------------- |
| `/api/auth/google`          | GET    | Initiate Google login             |
| `/api/auth/google/callback` | GET    | OAuth callback (automatic)        |
| `/api/auth/logout`          | GET    | Logout user                       |
| `/api/users/profile`        | GET    | Get user profile (requires token) |

## Response Format

### After successful OAuth:

**Redirect URL:**

```
http://localhost:3000/auth/callback?token=JWT_TOKEN&user=USER_JSON
```

**User Data (decoded):**

```json
{
  "id": "cm3vwx123abc456def789",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@gmail.com",
  "role": "user",
  "isVerified": true
}
```

**JWT Token Payload:**

```json
{
  "userId": "cm3vwx123abc456def789",
  "email": "john.doe@gmail.com",
  "role": "user",
  "iat": 1732569600,
  "exp": 1733174400
}
```

## Common Issues

### Issue: Redirect URI Mismatch

**Fix:** Ensure callback URL in `.env` matches Google Console

### Issue: Token not working

**Fix:** Check JWT_SECRET is consistent

### Issue: User not redirected

**Fix:** Verify FRONTEND_URL is correct in `.env`

## Security Checklist

- ✅ Use HTTPS in production
- ✅ Store tokens securely (httpOnly cookies recommended)
- ✅ Validate tokens on backend
- ✅ Set proper CORS headers
- ✅ Never expose client secrets in frontend

## Need Help?

📚 **Full Documentation:** `GOOGLE_OAUTH_SETUP.md`  
📖 **API Reference:** `API_DOCUMENTATION.md`  
📧 **Support:** DigitalHealthAssistance@gmx.com

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0
