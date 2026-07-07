const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadController = require('../controllers/upload.controller');

// ── User image upload (authenticated users only) ──────────────
// POST /api/upload/user-image  (multipart: field name "image")
router.post(
  '/user-image',
  authenticate(true),
  upload.single('image'),
  uploadController.uploadUserImage
);

// ── Product image upload (admin/seller only) ──────────────────
// POST /api/upload/product-image  (multipart: field "image" + body "product_id")
router.post(
  '/product-image',
  authenticate(true),
  upload.single('image'),
  uploadController.uploadProductImage
);

// ── Get signed URL for direct browser upload ──────────────────
// GET /api/upload/signed-url?folder=vasudha/...&public_id=...
router.get(
  '/signed-url',
  authenticate(false), // allow guests to get signed URL too
  uploadController.getSignedUrl
);

// ── List all images uploaded by the current user ──────────────
// GET /api/upload/user-images?image_type=profile
router.get(
  '/user-images',
  authenticate(true),
  uploadController.getUserImages
);

// ── Delete a user's uploaded image ───────────────────────────
// DELETE /api/upload/user-image/:id
router.delete(
  '/user-image/:id',
  authenticate(true),
  uploadController.deleteUserImage
);

module.exports = router;
