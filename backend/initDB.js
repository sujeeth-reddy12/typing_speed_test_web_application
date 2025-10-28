const mongoose = require('mongoose');
const User = require('./models/User');

async function init() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/typing_speed';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for init');

  const existing = await User.findOne({ email: 'admin@example.com' });
  if (!existing) {
    const u = new User({ username: 'admin', email: 'admin@example.com', password: 'admin123' });
    await u.save();
    console.log('Created sample user admin@example.com / admin123');
  } else {
    console.log('Sample user already exists');
  }
  process.exit(0);
}

init().catch(err => { console.error(err); process.exit(1); });
