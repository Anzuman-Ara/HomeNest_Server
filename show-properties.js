const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/homenest')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Define Property schema
const propertySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Rent', 'Sale', 'Commercial', 'Land']
  },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  imageUrl: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  userProfilePhoto: { type: String, required: true },
  postedDate: { type: Date, default: Date.now }
});

const Property = mongoose.model('Property', propertySchema);

// Query and display all properties
async function showProperties() {
  try {
    const properties = await Property.find({}).sort({ postedDate: -1 });
    
    console.log('\n=== ALL PROPERTIES IN DATABASE ===\n');
    console.log(`Total Properties Found: ${properties.length}\n`);
    
    properties.forEach((property, index) => {
      console.log(`--- PROPERTY ${index + 1} ---`);
      console.log(`ID: ${property._id}`);
      console.log(`Name: ${property.name}`);
      console.log(`Description: ${property.description}`);
      console.log(`Category: ${property.category}`);
      console.log(`Price: $${property.price}`);
      console.log(`Location: ${property.location}`);
      console.log(`Image URL: ${property.imageUrl}`);
      console.log(`Posted by: ${property.userName} (${property.userEmail})`);
      console.log(`Profile Photo: ${property.userProfilePhoto}`);
      console.log(`Posted Date: ${property.postedDate}`);
      console.log(`\n`);
    });
    
  } catch (err) {
    console.error('Error fetching properties:', err);
  } finally {
    mongoose.connection.close();
  }
}

showProperties();