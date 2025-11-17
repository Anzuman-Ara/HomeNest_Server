const mongoose = require('mongoose');
require('dotenv').config();

async function debugDatabase() {
  try {
    console.log('🔍 Debugging MongoDB Atlas connection...');
    console.log('Connection string:', process.env.MONGODB_URI);
    
    // Connect to Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📊 Database name:', dbName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections found:', collections.map(c => c.name));
    
    // Check if properties collection exists and get count
    const Property = mongoose.model('Property');
    const count = await Property.countDocuments();
    console.log('🏠 Property count:', count);
    
    if (count > 0) {
      const properties = await Property.find().limit(3);
      console.log('📄 Sample properties:');
      properties.forEach((prop, i) => {
        console.log(`${i + 1}. ${prop.name} - ${prop.location} - $${prop.price}`);
      });
    } else {
      console.log('❌ No properties found in database');
      
      // Let's check what's actually in the database
      const collectionsData = {};
      for (const collection of collections) {
        const collectionName = collection.name;
        const collectionData = await mongoose.connection.db.collection(collectionName).find({}).limit(3).toArray();
        collectionsData[collectionName] = collectionData;
        console.log(`📄 Content of ${collectionName}:`, collectionData);
      }
    }
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Database debug failed:', error.message);
  }
}

debugDatabase();