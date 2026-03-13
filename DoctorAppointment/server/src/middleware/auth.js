import { verifyAccessToken } from '../utils/generateToken.js';
import User from '../models/User.js';

/**
 * Middleware to protect routes - verify JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized to access this route. Please login.',
        },
      });
    }

    try {
      // Verify token
      const decoded = verifyAccessToken(token);

      // Get user from database and attach to request
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found. Token may be invalid.',
          },
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token. Please login again.',
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Server error during authentication',
      },
    });
  }
};

/**
 * Middleware to restrict access based on user roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'doctor', 'patient')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `User role '${req.user.role}' is not authorized to access this route`,
        },
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work differently for authenticated vs non-authenticated users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isEmailVerified) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid or expired, but we don't fail the request
      }
    }

    next();
  } catch (error) {
    next();
  }
};
