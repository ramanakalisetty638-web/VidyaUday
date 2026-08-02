// backend/server.js
// DigitalUday - Node.js + Express Backend
// Run: npm install express mongoose cors dotenv jsonwebtoken bcryptjs
//      node server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// MONGODB CONNECTION
// ─────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/digitaluday')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────
const SurveySchema = new mongoose.Schema({
  responses: { type: Object, required: true },
  submittedAt: { type: Date, default: Date.now },
  school: String,
  district: String
});

const ScholarshipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  icon: String,
  eligibility: String,
  benefits: String,
  process: String,
  link: String,
  deadline: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const ResourceSchema = new mongoose.Schema({
  name: String, category: String, icon: String,
  description: String, link: String, audience: String,
  rating: Number, active: { type: Boolean, default: true }
});

const AdminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
});

const Survey = mongoose.model('Survey', SurveySchema);
const Scholarship = mongoose.model('Scholarship', ScholarshipSchema);
const Resource = mongoose.model('Resource', ResourceSchema);
const Admin = mongoose.model('Admin', AdminSchema);

// ─────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', platform: 'DigitalUday' }));

// SURVEY
app.post('/api/survey', async (req, res) => {
  try {
    const survey = new Survey(req.body);
    await survey.save();
    res.json({ success: true, message: 'Survey submitted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/survey', authMiddleware, async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ submittedAt: -1 });
    const stats = {
      total: surveys.length,
      byQ1: groupBy(surveys, 'responses.q1'),
      byQ2: groupBy(surveys, 'responses.q2'),
      byQ4: groupBy(surveys, 'responses.q4'),
    };
    res.json({ surveys, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SCHOLARSHIPS
app.get('/api/scholarships', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = { active: true };
    if (category && category !== 'All') query.category = category;
    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { eligibility: new RegExp(search, 'i') }
    ];
    const scholarships = await Scholarship.find(query);
    res.json(scholarships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scholarships', authMiddleware, async (req, res) => {
  try {
    const scholarship = new Scholarship(req.body);
    await scholarship.save();
    res.json({ success: true, scholarship });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/scholarships/:id', authMiddleware, async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, scholarship });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/scholarships/:id', authMiddleware, async (req, res) => {
  try {
    await Scholarship.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RESOURCES
app.get('/api/resources', async (req, res) => {
  try {
    const { category } = req.query;
    let query = { active: true };
    if (category && category !== 'All') query.category = category;
    const resources = await Resource.find(query);
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', authMiddleware, async (req, res) => {
  try {
    const resource = new Resource(req.body);
    await resource.save();
    res.json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN AUTH
app.post('/api/auth/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id, username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create admin (run once, then remove or protect this route)
app.post('/api/auth/setup', async (req, res) => {
  try {
    const { username, password, setupKey } = req.body;
    if (setupKey !== process.env.SETUP_KEY) return res.status(403).json({ error: 'Invalid setup key' });
    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, password: hashed });
    await admin.save();
    res.json({ success: true, message: 'Admin created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DASHBOARD STATS
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    const [surveyCount, scholCount, resourceCount] = await Promise.all([
      Survey.countDocuments(),
      Scholarship.countDocuments({ active: true }),
      Resource.countDocuments({ active: true })
    ]);
    const recentSurveys = await Survey.find().sort({ submittedAt: -1 }).limit(10);
    res.json({ surveyCount, scholCount, resourceCount, recentSurveys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// SERVE STATIC FRONTEND
// ─────────────────────────────────────────
// Serve static files from the parent directory (project root)
app.use(express.static(path.join(__dirname, '..')));

// Route to serve the frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ─────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────
function groupBy(arr, path) {
  return arr.reduce((acc, item) => {
    const keys = path.split('.');
    const val = keys.reduce((obj, k) => obj?.[k], item) || 'Unknown';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 DigitalUday API running on port ${PORT}`));
