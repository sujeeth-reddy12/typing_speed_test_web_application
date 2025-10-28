const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/typing_speed', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

app.use('/api/users', require('./routes/users'));

// API routes
app.use("/api/results", require("./routes/results"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/results", require("./routes/results"));


// Serve frontend static files
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// Fallback to index.html for SPA-like behavior
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "login.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
