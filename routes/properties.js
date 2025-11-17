const express = require('express');
const mongoose = require('mongoose');
const Property = require('../models/Property');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all properties with sorting and search
router.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /api/properties - Request received');
    console.log('📊 Database connection status:', mongoose.connection.readyState);
    
    const { sortBy, sortOrder = 'desc', search = '' } = req.query;
    let query = {};

    // Add search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.postedDate = -1; // Default sort by newest first
    }

    console.log('🔍 Query:', query);
    console.log('🔍 Sort:', sort);
    
    const properties = await Property.find(query).sort(sort);
    console.log(`📊 Found ${properties.length} properties`);
    
    if (properties.length > 0) {
      console.log('📄 Sample property:', properties[0]);
    }
    
    res.json(properties);
  } catch (err) {
    console.error('❌ Error in GET /api/properties:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get featured properties (6 most recent)
router.get('/featured', async (req, res) => {
  try {
    const properties = await Property.find()
      .sort({ postedDate: -1 })
      .limit(6);
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get properties by user email
router.get('/user/:email', authenticateToken, async (req, res) => {
  try {
    // Check if user is accessing their own properties
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ message: 'Forbidden: Can only access your own properties' });
    }
    const properties = await Property.find({ userEmail: req.params.email });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single property by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create property
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user matches the property owner
    if (req.user.email !== req.body.userEmail) {
      return res.status(403).json({ message: 'Forbidden: Cannot create property for another user' });
    }
    const property = new Property(req.body);
    const newProperty = await property.save();
    res.status(201).json(newProperty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update property
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    // Check if user owns the property
    if (req.user.email !== property.userEmail) {
      return res.status(403).json({ message: 'Forbidden: Can only update your own properties' });
    }
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedProperty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete property
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    // Check if user owns the property
    if (req.user.email !== property.userEmail) {
      return res.status(403).json({ message: 'Forbidden: Can only delete your own properties' });
    }
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add review to property
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    // Check if reviewer email matches authenticated user
    if (req.user.email !== req.body.reviewerEmail) {
      return res.status(403).json({ message: 'Forbidden: Can only add reviews from your own account' });
    }
    property.reviews.push(req.body);
    await property.save();
    res.status(201).json(property);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all reviews by user email
router.get('/reviews/user/:email', authenticateToken, async (req, res) => {
  try {
    // Check if user is accessing their own reviews
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: 'Unauthorized: Invalid or missing token' });
    }
    
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ message: 'Forbidden: Can only access your own reviews' });
    }
    
    // Find all properties that have reviews by this user
    const properties = await Property.find({
      'reviews.reviewerEmail': req.params.email
    }).select('name imageUrl location price reviews');
    
    // Extract and format the reviews
    const userReviews = [];
    properties.forEach(property => {
      if (property.reviews && property.reviews.length > 0) {
        property.reviews.forEach(review => {
          if (review.reviewerEmail === req.params.email) {
            userReviews.push({
              _id: review._id || `${property._id}_${review.reviewerEmail}_${review.reviewDate}`,
              propertyId: property._id,
              propertyName: property.name,
              propertyImage: property.imageUrl,
              propertyLocation: property.location,
              propertyPrice: property.price,
              userEmail: review.reviewerEmail,
              userName: review.reviewerName,
              rating: review.rating,
              review: review.reviewText,
              reviewDate: review.reviewDate
            });
          }
        });
      }
    });
    
    // Sort by most recent first
    userReviews.sort((a, b) => new Date(b.reviewDate || 0) - new Date(a.reviewDate || 0));
    
    res.json(userReviews);
  } catch (err) {
    console.error('Error in /reviews/user/:email:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Delete review by ID
router.delete('/reviews/:propertyId/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { propertyId, reviewId } = req.params;
    
    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Find the review and check if it belongs to the authenticated user
    const reviewIndex = property.reviews.findIndex(review => 
      review._id.toString() === reviewId || 
      review._id.toString() === reviewId.split('_')[0]
    );
    
    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const review = property.reviews[reviewIndex];
    
    // Check if user owns the review
    if (review.reviewerEmail !== req.user.email) {
      return res.status(403).json({ message: 'Forbidden: Can only delete your own reviews' });
    }
    
    // Remove the review using arrayFilters to avoid validation
    await Property.updateOne(
      { _id: propertyId },
      { $pull: { reviews: { _id: review._id } } }
    );
    
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Update review by ID
router.put('/reviews/:propertyId/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { propertyId, reviewId } = req.params;
    const { rating, reviewText } = req.body;
    
    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Find the review and check if it belongs to the authenticated user
    const review = property.reviews.id(reviewId) || 
                   property.reviews.find(r => r._id.toString() === reviewId.split('_')[0]);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.reviewerEmail !== req.user.email) {
      return res.status(403).json({ message: 'Forbidden: Can only update your own reviews' });
    }
    
    // Update the review using $set to avoid validation issues
    const updateFields = {};
    if (rating !== undefined) updateFields['reviews.$.rating'] = rating;
    if (reviewText !== undefined) updateFields['reviews.$.reviewText'] = reviewText;
    
    // Use findOneAndUpdate with arrayFilters to update specific review
    const result = await Property.findOneAndUpdate(
      { _id: propertyId, 'reviews._id': review._id },
      { $set: updateFields },
      { new: true }
    );
    
    // Get the updated review from the property
    const updatedProperty = await Property.findById(propertyId);
    const updatedReview = updatedProperty.reviews.id(review._id);
    
    res.json({
      message: 'Review updated successfully',
      review: {
        _id: updatedReview._id,
        propertyId: property._id,
        propertyName: property.name,
        propertyImage: property.imageUrl,
        propertyLocation: property.location,
        propertyPrice: property.price,
        userEmail: updatedReview.reviewerEmail,
        userName: updatedReview.reviewerName,
        rating: updatedReview.rating,
        review: updatedReview.reviewText,
        reviewDate: updatedReview.reviewDate
      }
    });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

module.exports = router;
