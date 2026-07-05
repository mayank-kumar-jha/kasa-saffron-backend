import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import prisma from './db.js';
import { sendWelcomeEmail } from '../utils/email.js';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Helper to handle OAuth login/register
const handleOAuthUser = async (profile, provider, done) => {
  try {
    const email = profile.emails && profile.emails[0]?.value;
    if (!email) {
      return done(new Error('No email found from OAuth provider'), false);
    }

    // Check if user exists by email
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // User exists, update with provider ID if not present
      if (provider === 'google' && !user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id }
        });
      }
      return done(null, user);
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name: profile.displayName || email.split('@')[0],
        email: email,
        googleId: provider === 'google' ? profile.id : null,
        avatar: profile.photos && profile.photos[0]?.value,
        isEmailVerified: true, // OAuth implies verified email
      }
    });

    // Send Welcome Email
    sendWelcomeEmail(newUser.email, newUser.name);

    done(null, newUser);
  } catch (err) {
    done(err, false);
  }
};

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/v1/auth/google/callback',
      proxy: true,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      await handleOAuthUser(profile, 'google', done);
    }
  )
);

export default passport;
