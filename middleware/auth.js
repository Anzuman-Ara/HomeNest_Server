const admin = require('firebase-admin');

// Check if FB_SERVICE_KEY environment variable is set
if (!process.env.FB_SERVICE_KEY) {
  console.error('❌ FB_SERVICE_KEY environment variable is not set!');
  console.log('Please add FB_SERVICE_KEY to your Vercel environment variables');
  throw new Error('FB_SERVICE_KEY environment variable is required');
}

try {
  const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
  const serviceAccount = JSON.parse(decoded);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  throw error;
}

const authenticateToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = { authenticateToken };
