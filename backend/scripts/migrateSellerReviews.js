// Migration script to add averageRating and reviewCount fields to existing Sellers
// Run: node backend/scripts/migrateSellerReviews.js

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/thriftly';

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get the Seller collection
    const db = mongoose.connection.db;
    const sellersCollection = db.collection('sellers');

    // Update all sellers that don't have averageRating field
    const result = await sellersCollection.updateMany(
      { averageRating: { $exists: false } },
      {
        $set: {
          averageRating: 0,
          reviewCount: 0
        }
      }
    );

    console.log(`📝 Migration complete:`);
    console.log(`   - Modified: ${result.modifiedCount} sellers`);
    console.log(`   - Matched: ${result.matchedCount} sellers`);

    // Verify the migration
    const totalSellers = await sellersCollection.countDocuments();
    const sellersWithRating = await sellersCollection.countDocuments({ averageRating: { $exists: true } });
    
    console.log(`\n📊 Verification:`);
    console.log(`   - Total sellers: ${totalSellers}`);
    console.log(`   - Sellers with averageRating: ${sellersWithRating}`);

    if (totalSellers === sellersWithRating) {
      console.log('\n✅ All sellers now have the review fields!');
    } else {
      console.log(`\n⚠️  ${totalSellers - sellersWithRating} sellers still need migration`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrate();
