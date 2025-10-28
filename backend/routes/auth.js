const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.JWT_SECRET || "dev-secret";

// Signup
router.post("/signup", async (req, res) => {
  try{
    const { username, email, password } = req.body;
    if(!email || !password) return res.status(400).json({ error: "Email and password required" });
    let user = await User.findOne({ email });
    if(user) return res.status(400).json({ error: "User already exists" });
    const hash = await bcrypt.hash(password, 10);
    user = new User({ username, email, password: hash });
    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try{
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;