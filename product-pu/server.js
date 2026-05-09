const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { client, connect } = require('../shared/redisClient');

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());

// GET /api/products - Get all products from Redis
app.get('/api/products', async (req, res) => {
    try {
        const productKeys = await client.keys('product:*');
        if (productKeys.length === 0) {
            return res.json([]);
        }
        
        const products = await Promise.all(
            productKeys.map(async (key) => {
                const data = await client.hGetAll(key);
                return { id: key.split(':')[1], ...data };
            })
        );
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/products/:id - Get product detail
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await client.hGetAll(`product:${id}`);
        if (Object.keys(product).length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ id, ...product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, async () => {
    await connect();
    console.log(`Product PU running on http://localhost:${PORT}`);
});
