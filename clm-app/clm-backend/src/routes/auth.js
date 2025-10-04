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

    // ✅ include email in token
    const token = generateToken({ userId: user._id, email: user.email });

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
    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    email = String(email).trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // ✅ include email in token
    const token = generateToken({ userId: user._id, email: user.email });

    return res.json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
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

module.exports = router;