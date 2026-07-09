require('dotenv').config({ path: '.env' });
const { pool } = require('../src/config/database');
async function fixNames() {
  try {
    await pool.query("UPDATE products SET name = REPLACE(name, 'Product', 'Saree') WHERE name LIKE 'Restored%Product%'");
    console.log('Names updated to Saree.');
  } catch(e) { console.error(e); }
  finally { process.exit(); }
}
fixNames();
