const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Generate a token with payload (like user id) and expiry (e.g. 1 day)
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

// Verify token and return decoded data or throw error
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
