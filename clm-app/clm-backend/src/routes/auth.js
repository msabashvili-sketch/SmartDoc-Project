// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateToken, verifyToken } = require('../utils/jwtUtils');

// simple email validator
const isEmail = (v) =>
  typeof v === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// --- Registration ---
router.post('/register', async (req, res) => {
  try {
    console.log('POST /api/auth/register body:', req.body);

    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    email = String(email).trim().toLowerCase();
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // already exists?
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // hash & save
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ email, password: hashed });

    // token
    const token = generateToken({ userId: user._id });
    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// --- Login ---
router.post('/login', async (req, res) => {
  try {
    console.log('POST /api/auth/login body:', req.body);

    let { email, password } = req.body || {};
    if (!email || !password) {
      console.log("Login failed: missing email or password");
      return res.status(400).json({ message: 'Email and password are required' });
    }

    email = String(email).trim().toLowerCase();
    console.log("Normalized email:", email);

    console.log("Searching user in MongoDB...");
    const user = await User.findOne({ email });
    console.log("Found user:", user);

    if (!user) {
      console.log("Login failed: user not found");
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log("Comparing password...");
    const ok = await bcrypt.compare(String(password), user.password);
    console.log("Password match result:", ok);

    if (!ok) {
      console.log("Login failed: password mismatch");
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log("Generating JWT token...");
    const token = generateToken({ userId: user._id });
    console.log("Token generated:", token);

    return res.json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error('Login error caught in catch:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// --- Verify token / current user ---
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const [, token] = auth.split(' ');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = verifyToken(token); // throws if invalid
    const user = await User.findById(decoded.userId).select('_id email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('ME error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// quick health check
router.get('/health', (req, res) => res.json({ ok: true }));


const { protect } = require('../middleware/authMiddleware');

// Example protected route
router.get('/profile', protect, (req, res) => {
  res.json({
    message: 'Protected route accessed successfully',
    user: req.user, // will contain the payload from JWT
  });
});


module.exports = router;
