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

// --- ADMIN API ROUTE ---
app.get('/api/signatures', async (req, res) => {
    try {
        // 1. Safety Check: Ensure the environment variable actually exists
        if (!process.env.ADMIN_PASSWORD) {
            console.error("CRITICAL: ADMIN_PASSWORD is not set in environment variables!");
            return res.status(500).json({ error: "Server configuration error" });
        }

        // 2. Authentication Check
        if (req.query.password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: "Unauthorized: Invalid Password" });
        }

        // 3. Fetch and Optimize Data
        // Using 'signatures' as you specified
        const data = await signatures.find()
            .sort({ _id: -1 })
            .select('name rollNo department semester createdAt -_id');

        // 4. Send the data back
        res.status(200).json(data);

    } catch (error) {
        console.error("Error fetching signatures:", error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// 5. Start the Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Student Portal backend running on http://localhost:${PORT}`);
});