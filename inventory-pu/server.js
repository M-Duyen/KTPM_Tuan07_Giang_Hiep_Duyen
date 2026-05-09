const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
const { client, connect } = require('../shared/redisClient');

const app = express();
const PORT = process.env.PORT || 8084;

app.use(cors());
app.use(express.json());

// GET /api/stock/:productId
app.get('/api/stock/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        const stock = await client.get(`stock:${productId}`);
        res.json({ productId, stock: parseInt(stock || 0) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/stock/decrease
app.post('/api/stock/decrease', async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const stockKey = `stock:${productId}`;
        
        const currentStock = await client.get(stockKey);
        if (parseInt(currentStock || 0) < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }
        
        const newStock = await client.decrBy(stockKey, quantity);
        
        if (newStock < 0) {
            await client.incrBy(stockKey, quantity);
            return res.status(400).json({ error: 'Insufficient stock (race condition)' });
        }
        
        res.json({ message: 'Stock decreased', newStock });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/stock/check
app.post('/api/stock/check', async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const stock = await client.get(`stock:${productId}`);
        const currentStock = parseInt(stock || 0);
        if (currentStock < quantity) {
            return res.status(400).json({ 
                valid: false, 
                error: 'Insufficient stock',
                currentStock 
            });
        }
        res.json({ valid: true, currentStock });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', async () => {
    await connect();
    console.log(`Inventory PU running on http://0.0.0.0:${PORT}`);
});