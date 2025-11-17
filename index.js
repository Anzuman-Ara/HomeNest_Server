const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// MongoDB connection configuration - Enhanced for Atlas free tier
const mongoOptions = {
  serverSelectionTimeoutMS: 60000, // 60 seconds 
  socketTimeoutMS: 60000, // 60 seconds for socket operations
  maxPoolSize: 15, // pool size
  maxIdleTimeMS: 30000, // 30 seconds
  retryWrites: true,
  w: 'majority'
};

// Connect to MongoDB with enhanced options
mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Function for CORS origin validation
const allowedOrigins = [
  'http://localhost:4173',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
  'https://your-domain.com',
].filter(Boolean);

// Enhanced CORS configuration for production
const corsOptions = {
  // Use a function to handle both fixed URLs and Vercel regex
  origin: function (origin, callback) {
    console.log('CORS check for origin:', origin); // Debug logging
    
    // 1. Allow requests with no origin (like mobile apps, postman, or same-origin)
    if (!origin) {
      console.log('Allowing request with no origin');
      return callback(null, true);
    }

    // 2. Allow specific, known origins
    if (allowedOrigins.includes(origin)) {
      console.log('Allowing known origin:', origin);
      return callback(null, true);
    }

    // 3. Allow any *.vercel.app domain (for Vercel previews)
    if (/\.vercel\.app$/.test(origin)) {
      console.log('Allowing Vercel domain:', origin);
      return callback(null, true);
    }
    
    // Block other requests
    const msg = `The CORS policy for this site does not allow access from origin ${origin}`;
    console.log('Blocking origin:', origin, 'Reason:', msg);
    callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
  ],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'HomeNest API is running!' });
});

// Import routes
const propertyRoutes = require('./routes/properties');
app.use('/api/properties', propertyRoutes);

// Explicit OPTIONS handler for CORS preflight requests
app.options('*', cors(corsOptions));

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS enabled for origins:`, allowedOrigins);
  console.log('Vercel domains allowed via regex');
  console.log('Debug logging enabled for CORS requests');
});

module.exports = app;
