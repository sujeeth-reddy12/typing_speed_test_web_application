const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Signup - plain password (testing only)
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ error: 'Email already registered' });
    const user = new User({ username, email, password });
    await user.save();
    res.json({ message: 'User created', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login - check plain text
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password)
      return res.status(400).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login success', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
