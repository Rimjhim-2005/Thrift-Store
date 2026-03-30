// Migration script to calculate and update average ratings for all sellers based on existing reviews
// Run: node backend/scripts/calculateSellerRatings.js

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/thriftly';

async function calculateRatings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Load models
    const Review = require('../models/Review');
    const Seller = require('../models/Seller');

    // Get all reviews grouped by seller
    const reviewStats = await Review.aggregate([
      {
        $group: {
          _id: '$sellerId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    console.log(`📊 Found ${reviewStats.length} sellers with reviews`);

    let updatedCount = 0;

    // Update each seller with their calculated rating
    for (const stat of reviewStats) {
      const sellerId = stat._id;
      const avgRating = Math.round(stat.averageRating * 10) / 10; // Round to 1 decimal
      const count = stat.reviewCount;

      await Seller.findByIdAndUpdate(sellerId, {
        averageRating: avgRating,
        reviewCount: count
      });

      updatedCount++;
      console.log(`   ✓ Seller ${sellerId}: ${avgRating} stars (${count} reviews)`);
    }

    // Reset sellers with no reviews to 0
    const sellersWithNoReviews = await Seller.updateMany(
      { _id: { $nin: reviewStats.map(s => s._id) } },
      { $set: { averageRating: 0, reviewCount: 0 } }
    );

    console.log(`\n📝 Updated ${updatedCount} sellers with reviews`);
    console.log(`📝 Reset ${sellersWithNoReviews.modifiedCount} sellers with no reviews`);

    console.log('\n✅ Rating calculation complete!');

  } catch (error) {
    console.error('❌ Calculation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the calculation
calculateRatings();
