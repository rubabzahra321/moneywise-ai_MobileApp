const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,  // Uses your 128-char secret
    {
      expiresIn: process.env.JWT_EXPIRY || '7d',
    }
  );
};

/**
 * Generate refresh token (longer expiry)
 * @param {string} userId - User ID
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,  // Uses your 128-char refresh secret
    {
      expiresIn: '30d',  // Refresh tokens last 30 days
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired. Please login again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token. Please login again.');
    }
    throw new Error('Authentication failed');
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired. Please login again.');
    }
    throw new Error('Invalid refresh token');
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get remaining time on token
 * @param {string} token - JWT token
 * @returns {number} Seconds remaining
 */
const getTokenRemainingTime = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return 0;
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - currentTime);
  } catch (error) {
    return 0;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenRemainingTime,
};