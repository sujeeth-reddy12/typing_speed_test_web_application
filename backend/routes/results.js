
const express = require("express");
const router = express.Router();
const Result = require("../models/Result");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.JWT_SECRET || "dev-secret";

function authMiddleware(req,res,next){
  const auth = req.headers.authorization;
  if(!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.slice(7);
  try{
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  }catch(err){
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Save a result (public or authenticated - if authenticated, prefer user email)
router.post("/", async (req, res) => {
  try{
    const auth = req.headers.authorization;
    let username = req.body.username || "Guest";
    if(auth && auth.startsWith("Bearer ")){
      try{
        const payload = jwt.verify(auth.slice(7), secret);
        username = payload.email || payload.username || username;
      }catch(e){
        // ignore invalid token and fall back to provided username
      }
    }
    const { difficulty, wpm, accuracy, date } = req.body;
    const r = new Result({ username, difficulty, wpm: Number(wpm||0), accuracy: Number(accuracy||0), date: date ? new Date(date) : undefined });
    await r.save();
    res.json({ message: "Result saved", result: r });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user results (protected)
router.get("/me", authMiddleware, async (req, res) => {
  try{
    const results = await Result.find({ username: req.user.email }).sort({ date: -1 }).limit(500);
    res.json({ results });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Growth analysis for authenticated user
// Returns summary: totalSessions, avgWPM, avgAccuracy, lastWPM, changeLast2 (percent), last7Avg, prev7Avg, weeklyChangePercent, trendSlope (wpm/day)
router.get("/growth", authMiddleware, async (req, res) => {
  try{
    const username = req.user.email;
    const results = await Result.find({ username }).sort({ date: 1 }); // oldest -> newest
    if(!results || results.length === 0) return res.json({ message: "No results", totalSessions: 0, results: [] });

    const totalSessions = results.length;
    const sumWPM = results.reduce((a,b)=>a+b.wpm,0);
    const avgWPM = sumWPM / totalSessions;
    const sumAcc = results.reduce((a,b)=>a+b.accuracy,0);
    const avgAccuracy = sumAcc / totalSessions;
    const lastWPM = results[results.length-1].wpm;

    // percent change between last two sessions
    let changeLast2 = 0;
    if(results.length >= 2){
      const prev = results[results.length-2].wpm;
      changeLast2 = prev > 0 ? ((lastWPM - prev)/prev)*100 : 0;
    }

    // weekly averages: compute average for last 7 days vs previous 7 days
    const now = new Date();
    const dayMs = 24*60*60*1000;
    const last7Start = new Date(now.getTime() - 7*dayMs);
    const prev7Start = new Date(now.getTime() - 14*dayMs);

    const last7 = results.filter(r => new Date(r.date) >= last7Start);
    const prev7 = results.filter(r => new Date(r.date) >= prev7Start && new Date(r.date) < last7Start);
    const avgLast7 = last7.length ? (last7.reduce((a,b)=>a+b.wpm,0)/last7.length) : null;
    const avgPrev7 = prev7.length ? (prev7.reduce((a,b)=>a+b.wpm,0)/prev7.length) : null;
    let weeklyChangePercent = null;
    if(avgPrev7 !== null && avgPrev7 > 0 && avgLast7 !== null) weeklyChangePercent = ((avgLast7 - avgPrev7)/avgPrev7)*100;

    // trend slope (simple linear regression of wpm over time in days)
    const xs = results.map(r => (new Date(r.date).getTime() - results[0].date.getTime()) / dayMs); // days from first
    const ys = results.map(r => r.wpm);
    let slope = 0;
    if(xs.length >= 2){
      const n = xs.length;
      const xmean = xs.reduce((a,b)=>a+b,0)/n;
      const ymean = ys.reduce((a,b)=>a+b,0)/n;
      const num = xs.reduce((s,x,i)=>s + (x - xmean)*(ys[i]-ymean),0);
      const den = xs.reduce((s,x)=>s + (x - xmean)*(x - xmean),0);
      slope = den !== 0 ? num/den : 0; // wpm per day
    }

    // recent improvement: average of last 3 vs previous 3
    const last3 = results.slice(-3).map(r=>r.wpm);
    const prev3 = results.slice(-6,-3).map(r=>r.wpm);
    const avgLast3 = last3.length ? last3.reduce((a,b)=>a+b,0)/last3.length : null;
    const avgPrev3 = prev3.length ? prev3.reduce((a,b)=>a+b,0)/prev3.length : null;
    let changeLast3Percent = null;
    if(avgPrev3 !== null && avgPrev3 > 0 && avgLast3 !== null) changeLast3Percent = ((avgLast3 - avgPrev3)/avgPrev3)*100;

    res.json({
      totalSessions,
      avgWPM,
      avgAccuracy,
      lastWPM,
      changeLast2,
      avgLast7,
      avgPrev7,
      weeklyChangePercent,
      trendSlopePerDay: slope,
      avgLast3,
      avgPrev3,
      changeLast3Percent
    });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
