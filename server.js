const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware to parse incoming JSON data from the frontend
app.use(express.json());

// Serve the frontend HTML files from the "public" directory
app.use(express.static(path.join(__dirname, 'frontend')));

// 1. Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas Successfully'))
  .catch(err => {
      console.error('❌ MongoDB Connection Error:');
      console.error(err);
  });

// 2. Define the Database Schema & Model
const signatureSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, unique: true, trim: true }, // unique: true prevents database-level duplicates
  department: { type: String, required: true },
  semester: { type: String, required: true },
  signedAt: { type: Date, default: Date.now }
});

const Signature = mongoose.model('Signature', signatureSchema);

// 3. API Route: Submit a New Signature
app.post('/api/signatures/sign', async (req, res) => {
  const { fullName, rollNumber, department, semester } = req.body;

  // Basic Backend Validation
  if (!fullName || !rollNumber || !department || !semester) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (rollNumber.length !== 11) {
      return res.status(400).json({ error: 'Roll number must be exactly 11 digits.' });
  }

  try {
    const newSignature = new Signature({ fullName, rollNumber, department, semester });
    await newSignature.save();
    res.status(201).json({ message: 'Signature registered successfully!' });
  } catch (err) {
    // MongoDB duplicate key error code is 11000
    if (err.code === 11000) {
      return res.status(400).json({ error: 'This MAKAUT Roll Number has already signed the petition.' });
    }
    console.error('Save Error:', err);
    res.status(500).json({ error: 'Internal server error saving signature.' });
  }
});

// 4. API Route: Get Total Live Signatures Count
app.get('/api/signatures/count', async (req, res) => {
  try {
    const count = await Signature.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Count Error:', err);
    res.status(500).json({ error: 'Database error fetching count' });
  }
});

// 5. Start the Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Student Portal backend running on http://localhost:${PORT}`);
});