const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a buffer directly to Cloudinary.
 * @param {Buffer} buffer   - File buffer from multer memoryStorage
 * @param {string} folder   - Cloudinary folder (e.g. 'vasudha/products')
 * @param {object} options  - Extra Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
function uploadBuffer(buffer, folder = 'vasudha/general', options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }, // Auto format (WebP/AVIF)
        ],
        ...options,
      },
      (error, result) => {
        if (error) {
          console.warn('Cloudinary upload failed, falling back to local storage:', error.message);
          try {
            const fs = require('fs');
            const path = require('path');
            const filename = (options.public_id || Date.now()) + '.jpg';
            const localPath = path.join(__dirname, '../../website/assets/uploads', filename);
            fs.writeFileSync(localPath, buffer);
            return resolve({
              secure_url: 'assets/uploads/' + filename,
              public_id: options.public_id || filename,
              width: 800, height: 1100, format: 'jpg', bytes: buffer.length
            });
          } catch (localErr) {
            return reject(error); // Return original cloudinary error if local fails
          }
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by its public_id.
 * @param {string} publicId
 */
async function deleteAsset(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Generate a signed upload URL for direct browser-to-Cloudinary upload.
 * @param {string} folder
 * @param {string} [publicId]
 */
function generateSignedUploadParams(folder = 'vasudha/general', publicId = null) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder };
  if (publicId) params.public_id = publicId;

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    folder,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  };
}

module.exports = { cloudinary, uploadBuffer, deleteAsset, generateSignedUploadParams };
