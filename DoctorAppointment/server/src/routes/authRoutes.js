import express from 'express';
import { body } from 'express-validator';
import passport from '../config/passport.js';
import {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  getMe,
  logout,
  googleOAuthLogin,
  googleOAuthCallback,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateTokens } from '../utils/generateToken.js';

const router = express.Router();

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .matches(/^[A-Za-z\s'-]+$/)
    .withMessage('First name cannot contain numbers'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .matches(/^[A-Za-z\s'-]+$/)
    .withMessage('Last name cannot contain numbers'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('role').optional().isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
];

const resendVerificationValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
];

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
  }),
  googleOAuthCallback
);
router.post('/oauth/google', googleOAuthLogin);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationValidation, validate, resendVerificationEmail);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, validate, resetPassword);
router.post('/refresh-token', refreshAccessToken);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
