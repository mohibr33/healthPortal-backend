import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userService from "../services/user.service";

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await userService.findUserByGoogleId(profile.id);

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if user exists with this email
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await userService.findUserByEmail(email);

          if (user) {
            // Link Google account to existing user
            const updatedUser = await userService.updateUser(user.id, {
              googleId: profile.id,
              isVerified: true,
            });
            return done(null, updatedUser);
          }
        }

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
