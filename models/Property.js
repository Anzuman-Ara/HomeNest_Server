const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewerName: { type: String, required: true },
  reviewerEmail: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true },
  reviewDate: { type: Date, default: Date.now }
});

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
  postedDate: { type: Date, default: Date.now },
  reviews: [reviewSchema]
});

module.exports = mongoose.model('Property', propertySchema);
