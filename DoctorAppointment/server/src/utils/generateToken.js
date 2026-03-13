import jwt from 'jsonwebtoken';

/**
 * Generate JWT Access Token (short-lived)
 * @param {string} userId - User's MongoDB ID
 * @param {string} role - User's role (patient, doctor, admin)
 * @returns {string} JWT access token
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' } // 15 minutes
  );
};

/**
 * Generate JWT Refresh Token (long-lived)
 * @param {string} userId - User's MongoDB ID
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7 days
  );
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User's MongoDB ID
 * @param {string} role - User's role
 * @returns {object} Object containing both tokens
 */
export const generateTokens = (userId, role) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);

  return { accessToken, refreshToken };
};

/**
 * Verify JWT Access Token
 * @param {string} token - JWT access token to verify
 * @returns {object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify JWT Refresh Token
 * @param {string} token - JWT refresh token to verify
 * @returns {object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
