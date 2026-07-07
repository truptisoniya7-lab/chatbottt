const db = require('../config/database');
const { uploadBuffer, deleteAsset, generateSignedUploadParams } = require('../config/cloudinary');

/* ─────────────────────────────────────────────────────────────
   POST /api/upload/user-image
   Authenticated user uploads a profile pic / custom order photo.
   Saves the Cloudinary URL + public_id to user_images table.
───────────────────────────────────────────────────────────── */
async function uploadUserImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.user.id;
    const imageType = req.body.image_type || 'general'; // 'profile', 'custom_order', 'chat'

    // Upload to Cloudinary under vasudha/users/<userId>
    const result = await uploadBuffer(
      req.file.buffer,
      `vasudha/users/${userId}`,
      { public_id: `${imageType}_${Date.now()}` }
    );

    // If it's a profile image, delete the old one
    if (imageType === 'profile') {
      const existing = await db.query(
        `SELECT cloudinary_public_id FROM user_images
         WHERE user_id = $1 AND image_type = 'profile'
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      if (existing.rows.length > 0) {
        await deleteAsset(existing.rows[0].cloudinary_public_id).catch(() => {});
        await db.query(
          `DELETE FROM user_images WHERE user_id = $1 AND image_type = 'profile'`,
          [userId]
        );
      }
    }

    // Save to DB
    const saved = await db.query(
      `INSERT INTO user_images (user_id, cloudinary_public_id, image_url, image_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, result.public_id, result.secure_url, imageType]
    );

    // If profile image, also update users table avatar_url
    if (imageType === 'profile') {
      await db.query(
        `UPDATE users SET avatar_url = $1 WHERE id = $2`,
        [result.secure_url, userId]
      ).catch(() => {}); // graceful — column may not exist yet
    }

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        id: saved.rows[0].id,
        url: result.secure_url,
        public_id: result.public_id,
        image_type: imageType,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (err) {
    console.error('User image upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/upload/product-image
   Admin/Seller uploads a product image. Updates products table.
   Body (multipart): file + product_id (optional)
───────────────────────────────────────────────────────────── */
async function uploadProductImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { product_id } = req.body;

    // Upload to Cloudinary under vasudha/products
    const publicIdSuffix = product_id
      ? product_id.replace(/[^a-zA-Z0-9_-]/g, '_')
      : `product_${Date.now()}`;

    const result = await uploadBuffer(
      req.file.buffer,
      'vasudha/products',
      {
        public_id: publicIdSuffix,
        transformation: [
          { width: 800, height: 1100, crop: 'fill', gravity: 'auto' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      }
    );

    // Update the products table if product_id given
    if (product_id) {
      await db.query(
        `UPDATE products SET image_url = $1 WHERE id = $2`,
        [result.secure_url, product_id]
      );
    }

    res.status(201).json({
      message: 'Product image uploaded successfully',
      image: {
        url: result.secure_url,
        public_id: result.public_id,
        product_id: product_id || null,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (err) {
    console.error('Product image upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/upload/signed-url
   Returns a signed upload token so the browser can upload
   DIRECTLY to Cloudinary (no file goes through our server).
   Query params: folder (optional), public_id (optional)
───────────────────────────────────────────────────────────── */
function getSignedUrl(req, res) {
  try {
    const folder = req.query.folder || `vasudha/users/${req.user?.id || 'guest'}`;
    const publicId = req.query.public_id || null;
    const params = generateSignedUploadParams(folder, publicId);
    res.json({ ...params, upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload` });
  } catch (err) {
    console.error('Signed URL error:', err);
    res.status(500).json({ error: 'Could not generate signed URL' });
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/upload/user-images
   Returns all images uploaded by the current user.
───────────────────────────────────────────────────────────── */
async function getUserImages(req, res) {
  try {
    const userId = req.user.id;
    const { image_type } = req.query;

    let query = `SELECT * FROM user_images WHERE user_id = $1`;
    const params = [userId];

    if (image_type) {
      query += ` AND image_type = $2`;
      params.push(image_type);
    }

    query += ` ORDER BY created_at DESC`;
    const result = await db.query(query, params);
    res.json({ images: result.rows });
  } catch (err) {
    console.error('Get user images error:', err);
    res.status(500).json({ error: 'Could not fetch images' });
  }
}

/* ─────────────────────────────────────────────────────────────
   DELETE /api/upload/user-image/:id
   Deletes a user's image from Cloudinary and the DB.
───────────────────────────────────────────────────────────── */
async function deleteUserImage(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM user_images WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found or not owned by you' });
    }

    const image = result.rows[0];

    // Delete from Cloudinary
    await deleteAsset(image.cloudinary_public_id).catch(() => {});

    // Delete from DB
    await db.query(`DELETE FROM user_images WHERE id = $1`, [id]);

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: 'Could not delete image' });
  }
}

module.exports = {
  uploadUserImage,
  uploadProductImage,
  getSignedUrl,
  getUserImages,
  deleteUserImage,
};
