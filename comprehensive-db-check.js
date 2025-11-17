const mongoose = require('mongoose');
require('dotenv').config();

async function comprehensiveDbCheck() {
  try {
    console.log('🔍 COMPREHENSIVE DATABASE INSPECTION');
    console.log('='.repeat(50));
    
    // Connect to Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}`);
    
    // List ALL collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📋 Collections found (${collections.length}):`);
    collections.forEach((collection, i) => {
      console.log(`${i + 1}. ${collection.name} (${collection.type})`);
    });
    
    // Check each collection for data
    console.log('\n🔍 Checking each collection for data:');
    for (const collection of collections) {
      const collectionName = collection.name;
      const collectionData = await mongoose.connection.db.collection(collectionName).find({}).limit(5).toArray();
      
      console.log(`\n📄 Collection: ${collectionName}`);
      console.log(`   Count: ${collectionData.length} documents`);
      
      if (collectionData.length > 0) {
        console.log(`   Sample document structure:`);
        const sampleDoc = collectionData[0];
        console.log(`   Keys: ${Object.keys(sampleDoc).join(', ')}`);
        console.log(`   Sample:`, JSON.stringify(sampleDoc, null, 2).substring(0, 300) + '...');
      }
    }
    
    // Try to find properties data in ANY collection
    console.log('\n🔍 SEARCHING FOR PROPERTY DATA:');
    for (const collection of collections) {
      try {
        const data = await mongoose.connection.db.collection(collection.name).find({}).limit(1).toArray();
        if (data.length > 0) {
          const doc = data[0];
          // Check if this looks like property data
          const hasPropertyFields = doc.name || doc.title || doc.price || doc.location;
          const hasPropertyStructure = Object.keys(doc).some(key => 
            ['name', 'price', 'location', 'description', 'category'].includes(key)
          );
          
          if (hasPropertyFields || hasPropertyStructure) {
            console.log(`🎯 FOUND POTENTIAL PROPERTY DATA in collection: ${collection.name}`);
            console.log(`   Document structure:`, Object.keys(doc));
            
            // Try to read it with Property model
            try {
              const Property = mongoose.model('Property', doc);
              const directQuery = await mongoose.connection.db.collection(collection.name).find({}).limit(3).toArray();
              console.log(`   Direct query count: ${directQuery.length}`);
              
              if (directQuery.length > 0) {
                console.log(`   Sample:`, JSON.stringify(directQuery[0], null, 2).substring(0, 200) + '...');
              }
            } catch (modelError) {
              console.log(`   Model compatibility issue:`, modelError.message);
            }
          }
        }
      } catch (err) {
        console.log(`   Error checking ${collection.name}:`, err.message);
      }
    }
    
    await mongoose.connection.close();
    console.log('\n🔌 Inspection completed');
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  }
}

comprehensiveDbCheck();