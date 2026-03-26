import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const sanitizeName = (value, fallback) => {
  if (!value || /\d/.test(value)) {
    return fallback;
  }

  return value.trim();
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(new Error('Google account did not provide an email address'), null);
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            email,
            password: `GoogleAuth!${profile.id}`,
            firstName: sanitizeName(profile.name?.givenName, 'Google'),
            lastName: sanitizeName(profile.name?.familyName, 'User'),
            phone: '0000000000',
            role: 'patient',
            isEmailVerified: true,
            dateOfBirth: new Date('2000-01-01'),
            gender: 'other',
          });
        } else if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          user.emailVerificationToken = undefined;
          user.emailVerificationExpires = undefined;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
