const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// MongoDB connection configuration - Enhanced for Atlas free tier
const mongoOptions = {
  serverSelectionTimeoutMS: 60000, // 60 seconds 
  socketTimeoutMS: 60000, // 60 seconds for socket operations
  maxPoolSize: 11, // pool size
  maxIdleTimeMS: 30000, // 30 seconds
  retryWrites: true,
  w: 'majority'
};

// Connect to MongoDB with enhanced options
mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware - Simplified CORS configuration for development
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
