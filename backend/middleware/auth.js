const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.JWT_SECRET || "dev-secret";

module.exports = function(req, res, next){
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