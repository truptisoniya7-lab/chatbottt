require('dotenv').config();
const { pool } = require('../config/database');

const seedKb = async () => {
  try {
    console.log('Seeding knowledge base...');
    
    const kbEntries = [
      {
        category: 'policies/returns',
        title: 'Return Eligibility Criteria',
        content_en: 'Customers may return products within 30 days of delivery if: 1. Item is unused 2. Original tags intact 3. Original packaging available.',
        content_hi: 'ग्राहक डिलीवरी के 30 दिनों के अंदर वापसी कर सकते हैं, यदि: 1. आइटम अनयूज्ड हो 2. ओरिजिनल टैग लगे हों 3. पैकेजिंग उपलब्ध हो.',
        tags: ['return', 'refund', 'policy']
      },
      {
        category: 'policies/shipping',
        title: 'Shipping Timelines',
        content_en: 'Standard delivery takes 3-5 business days. Express delivery takes 1-2 business days. COD is available for orders under ₹10,000.',
        content_hi: 'स्टैंडर्ड डिलीवरी में 3-5 कार्य दिवस लगते हैं। एक्सप्रेस डिलीवरी में 1-2 दिन लगते हैं। ₹10,000 से कम के ऑर्डर पर COD उपलब्ध है।',
        tags: ['shipping', 'delivery', 'cod']
      }
    ];

    for (const entry of kbEntries) {
      await pool.query(
        `INSERT INTO knowledge_base (category, title, content_en, content_hi, tags) 
         VALUES ($1, $2, $3, $4, $5)`,
        [entry.category, entry.title, entry.content_en, entry.content_hi, entry.tags]
      );
    }
    
    console.log('Knowledge base seeded successfully.');
  } catch (error) {
    console.error('Error seeding KB:', error);
  } finally {
    pool.end();
  }
};

seedKb();
