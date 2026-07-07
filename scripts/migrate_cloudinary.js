/**
 * migrate_cloudinary.js
 * Run once to add Cloudinary-related tables to the Neon DB.
 * Usage: node scripts/migrate_cloudinary.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../src/config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting Cloudinary DB migration...\n');
    await client.query('BEGIN');

    // 1. Ensure image_url column exists in products (UUID-based table)
    console.log('📦 Ensuring image_url exists on products table...');
    await client.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);

    // 2. avatar_url already exists on users table (VARCHAR 500 from init-db.js)
    //    Just widen it to TEXT if needed (safe no-op if already TEXT)
    console.log('👤 Ensuring avatar_url exists on users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);

    // 3. Create user_images table using UUID for user_id (matching users.id)
    console.log('🖼️  Creating user_images table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_images (
        id                    SERIAL PRIMARY KEY,
        user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
        cloudinary_public_id  TEXT NOT NULL,
        image_url             TEXT NOT NULL,
        image_type            VARCHAR(50) DEFAULT 'general',
        created_at            TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Create index for fast lookup by user
    console.log('📇 Creating index on user_images.user_id...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_images_user_id
      ON user_images(user_id);
    `);

    // 5. Create product_images table for multiple images per product
    console.log('🛍️  Creating product_images table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id                    SERIAL PRIMARY KEY,
        product_id            UUID REFERENCES products(id) ON DELETE CASCADE,
        cloudinary_public_id  TEXT NOT NULL,
        image_url             TEXT NOT NULL,
        is_primary            BOOLEAN DEFAULT FALSE,
        display_order         INT DEFAULT 0,
        created_at            TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_images_product_id
      ON product_images(product_id);
    `);

    await client.query('COMMIT');
    console.log('\n✅ Cloudinary DB migration completed successfully!');
    console.log('\nTables/columns ready:');
    console.log('  • products.image_url     — primary Cloudinary URL per product');
    console.log('  • users.avatar_url       — user profile picture from Cloudinary');
    console.log('  • user_images            — all user-uploaded images (profile, order, chat)');
    console.log('  • product_images         — multiple images per product');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

