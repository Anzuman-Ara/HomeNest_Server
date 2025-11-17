const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// MongoDB connection configuration
const mongoOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds (increase from default 10s)
  socketTimeoutMS: 45000, // 45 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
  socketTimeoutMS: 0, // Never time out, wait indefinitely
  bufferMaxEntries: 0 // Disable mongoose buffering
};

// Connect to MongoDB with enhanced options
mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'HomeNest API is running!' });
});

// Import routes
const propertyRoutes = require('./routes/properties');
app.use('/api/properties', propertyRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
