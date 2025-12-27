import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userService from "../services/user.service";

// Validate required environment variables
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL;

if (!clientID || !clientSecret || !callbackURL) {
  console.warn(
    "⚠️  Google OAuth is not fully configured. Missing environment variables:",
    {
      GOOGLE_CLIENT_ID: clientID ? "✓" : "✗",
      GOOGLE_CLIENT_SECRET: clientSecret ? "✓" : "✗",
      GOOGLE_CALLBACK_URL: callbackURL ? "✓" : "✗",
    }
  );
}

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: clientID || "not-configured",
      clientSecret: clientSecret || "not-configured",
      callbackURL: callbackURL || "not-configured",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        console.log("Google OAuth: Processing profile for user:", profile.id);

        // Check if user exists with this Google ID
        let user = await userService.findUserByGoogleId(profile.id);

        if (user) {
          console.log("Google OAuth: Existing user found by Google ID");
          // User exists, return user
          return done(null, user);
        }

        // Check if user exists with this email
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await userService.findUserByEmail(email);

          if (user) {
            console.log(
              "Google OAuth: Linking Google account to existing user"
            );
            // Link Google account to existing user
            const updatedUser = await userService.updateUser(user.id, {
              googleId: profile.id,
              isVerified: true,
            });
            return done(null, updatedUser);
          }
        }

        console.log("Google OAuth: Creating new user");
        // Create new user
        const newUser = await userService.createUser({
          firstName: profile.name?.givenName || "User",
          lastName: profile.name?.familyName || "",
          email: email || `${profile.id}@google.com`,
          googleId: profile.id,
          isVerified: true,
          password: null, // No password for Google OAuth users
        });

        return done(null, newUser);
      } catch (error) {
        console.error("Google OAuth: Error during authentication:", error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userService.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
