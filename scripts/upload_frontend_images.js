const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const websiteDir = path.join(__dirname, '../website');

// Function to get all image files from a directory
function getAllImages(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllImages(filePath, fileList);
    } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Function to get all text files from a directory
function getAllTextFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      // skip img and assets directories, since they shouldn't contain text code
      if (!['img', 'assets', 'uploads'].includes(file)) {
        getAllTextFiles(filePath, fileList);
      }
    } else if (/\.(html|css|js|json)$/i.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function migrateFrontendImages() {
  const imageDirs = [
    path.join(websiteDir, 'img'),
    path.join(websiteDir, 'assets')
  ];

  let allImages = [];
  for (const dir of imageDirs) {
    allImages = getAllImages(dir, allImages);
  }

  // exclude node_modules if any
  allImages = allImages.filter(img => !img.includes('node_modules'));

  console.log(`Found ${allImages.length} images to process.`);

  const textFiles = getAllTextFiles(websiteDir);
  console.log(`Found ${textFiles.length} text files to process.`);

  const urlMap = new Map(); // filename => cloudinary URL

  // Upload images
  for (const imgPath of allImages) {
    const filename = path.basename(imgPath);
    console.log(`Uploading ${filename}...`);
    try {
      const res = await cloudinary.uploader.upload(imgPath, {
        folder: 'chatbottt_frontend',
        use_filename: true,
        unique_filename: false,
        overwrite: true
      });
      console.log(`Uploaded ${filename} -> ${res.secure_url}`);
      urlMap.set(filename, res.secure_url);
    } catch (err) {
      console.error(`Failed to upload ${filename}`, err);
    }
  }

  // Replace paths in files
  console.log('Replacing paths in text files...');
  for (const txtFile of textFiles) {
    let content = fs.readFileSync(txtFile, 'utf8');
    let modified = false;

    for (const [filename, cloudinaryUrl] of urlMap.entries()) {
      // Create a regex to find paths that end with this filename
      // e.g. /assets/categories/saree.png, assets/saree.png, img/kurta.png
      // It matches any combination of word characters, slashes, dashes, dots ending with the filename
      // prefixed by quotes or url(
      
      const regex1 = new RegExp(`['"](?:\\/)?(?:assets|img)\\b[a-zA-Z0-9_\\-/\\.]*\\/${filename}['"]`, 'g');
      const regex2 = new RegExp(`url\\(['"]?(?:\\/)?(?:assets|img)\\b[a-zA-Z0-9_\\-/\\.]*\\/${filename}['"]?\\)`, 'g');
      const regex3 = new RegExp(`['"](?:assets|img)[a-zA-Z0-9_\\-/\\.]*\\/${filename}['"]`, 'g'); // if no slash
      const regex4 = new RegExp(`['"]\\/(?:assets|img)[a-zA-Z0-9_\\-/\\.]*\\/${filename}['"]`, 'g'); // with slash

      // We actually want to replace the whole matched string except the boundary quotes/parentheses.
      // Easiest is just replace the path itself.

      // A more robust regex:
      // /(?<=['"\(])\/?(?:assets|img)\/[^'"\)]*?filename(?=['"\)])/g
      // Node supports lookbehinds.

      const regexRobust = new RegExp(`(?<=['"\\(])\\/?(?:assets|img)(?:\\/[^'"\\)]*)?\\/${filename}(?=['"\\)])`, 'g');

      if (regexRobust.test(content)) {
        content = content.replace(regexRobust, cloudinaryUrl);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(txtFile, content, 'utf8');
      console.log(`Updated ${path.relative(websiteDir, txtFile)}`);
    }
  }
  
  console.log('Migration complete.');
}

migrateFrontendImages().catch(err => {
  console.error(err);
});
