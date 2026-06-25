const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function loadModule(name) {
    const filePath = path.join(__dirname, 'modules', `${name}.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return {};
}

async function seed() {
    const client = await pool.connect();
    try {
        console.log("Starting Neon DB Migration...");
        await client.query('BEGIN');

        // 1. Create Tables
        console.log("Creating tables...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                product_id VARCHAR(50) UNIQUE,
                name VARCHAR(255),
                category VARCHAR(100),
                gender VARCHAR(50),
                price INT,
                fabric VARCHAR(100),
                occasion VARCHAR(255),
                colour VARCHAR(100),
                in_stock BOOLEAN,
                data JSONB
            );

            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(50) UNIQUE,
                phone_last4 VARCHAR(10),
                status VARCHAR(100),
                data JSONB
            );

            CREATE TABLE IF NOT EXISTS knowledge_base_docs (
                id SERIAL PRIMARY KEY,
                topic VARCHAR(100) UNIQUE,
                data JSONB
            );
        `);

        // 2. Clear existing data
        await client.query(`TRUNCATE TABLE products, orders, knowledge_base_docs RESTART IDENTITY CASCADE`);

        // 3. Seed Products
        console.log("Seeding products...");
        const catalog = await loadModule('catalog');
        const allProducts = [...(catalog.products_women || []), ...(catalog.products_men || [])];
        
        for (const p of allProducts) {
            // gender deduction based on id
            const gender = p.product_id.includes('-W-') ? 'women' : (p.product_id.includes('-M-') ? 'men' : 'unisex');
            // extract primary colour
            const colour = (p.colours && p.colours.length > 0) ? p.colours[0] : '';
            
            await client.query(`
                INSERT INTO products (product_id, name, category, gender, price, fabric, occasion, colour, in_stock, data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [p.product_id, p.name, p.category, gender, p.price, p.fabric, p.occasion, colour, p.in_stock, JSON.stringify(p)]);
        }

        // 4. Seed Orders
        console.log("Seeding orders...");
        const ordersDb = await loadModule('orders');
        for (const o of (ordersDb.orders || [])) {
            await client.query(`
                INSERT INTO orders (order_id, phone_last4, status, data)
                VALUES ($1, $2, $3, $4)
            `, [o.order_id, o.phone_last4, o.status, JSON.stringify(o)]);
        }

        // 5. Seed Knowledge Base (Policies, FAQs, etc.)
        console.log("Seeding knowledge base...");
        const sizeCharts = await loadModule('size_charts');
        const returnsDb = await loadModule('returns');
        const promos = await loadModule('promotions');
        const shipping = await loadModule('shipping');
        const payments = await loadModule('payments');
        const faqs = await loadModule('faqs');
        const fabricCare = await loadModule('fabric_care');

        const kbDocs = [
            { topic: 'size_charts', data: sizeCharts },
            { topic: 'returns', data: returnsDb },
            { topic: 'promotions', data: promos },
            { topic: 'shipping', data: shipping },
            { topic: 'payments', data: payments },
            { topic: 'faqs', data: faqs },
            { topic: 'fabric_care', data: fabricCare }
        ];

        for (const doc of kbDocs) {
            await client.query(`
                INSERT INTO knowledge_base_docs (topic, data)
                VALUES ($1, $2)
            `, [doc.topic, JSON.stringify(doc.data)]);
        }

        await client.query('COMMIT');
        console.log("Migration completed successfully!");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
