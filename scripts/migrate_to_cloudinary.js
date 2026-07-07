require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');
const { uploadBuffer } = require('../src/config/cloudinary');

async function migrateImages() {
  console.log('--- Cloudinary Migration Script ---');
  console.log('Using Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  
  if (process.env.CLOUDINARY_CLOUD_NAME === 'vasudha' || !process.env.CLOUDINARY_API_KEY) {
    console.error('ERROR: Your .env file is not correctly configured for Cloudinary!');
    console.error('Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are accurate.');
    process.exit(1);
  }

  try {
    const res = await pool.query("SELECT id, image_url FROM products WHERE image_url LIKE '%assets/uploads%'");
    console.log(`Found ${res.rows.length} products with local images that need to be migrated to Cloudinary.`);
    
    if (res.rows.length === 0) {
      console.log('Nothing to migrate! All products are using cloud URLs.');
      process.exit(0);
    }

    let successCount = 0;
    for (const row of res.rows) {
      const filename = path.basename(row.image_url);
      const filePath = path.join(__dirname, '../website/assets/uploads', filename);
      
      if (fs.existsSync(filePath)) {
        console.log(`Uploading ${filename} to Cloudinary...`);
        const buf = fs.readFileSync(filePath);
        
        try {
          const result = await uploadBuffer(buf, 'vasudha/products', { public_id: filename.replace('.jpg','') });
          
          if (result && result.secure_url && result.secure_url.includes('cloudinary')) {
            await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [result.secure_url, row.id]);
            console.log(`✔ Success! Product ${row.id} updated -> ${result.secure_url}`);
            successCount++;
          } else {
            console.error(`✘ Failed to get a valid Cloudinary URL for product ${row.id}. Make sure your API keys are correct.`);
          }
        } catch (uploadErr) {
          console.error(`✘ Cloudinary rejected the upload for product ${row.id}. Error:`, uploadErr.message || uploadErr);
        }
      } else {
        console.error(`✘ Local file not found: ${filePath}`);
      }
    }
    
    console.log(`\nMigration complete! Successfully migrated ${successCount} out of ${res.rows.length} images.`);
    if (successCount === res.rows.length) {
      console.log('Your Vercel website will now show these images perfectly!');
    }
  } catch(e) {
    console.error('Database Error:', e.message || e);
  } finally {
    pool.end();
  }
}

migrateImages();
