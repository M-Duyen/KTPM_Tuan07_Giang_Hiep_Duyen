const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const { client, connect } = require("../shared/redisClient");

const app = express();
const PORT = process.env.PORT || 8083;
const IP = process.env.IP || "localhost";

app.use(cors());
app.use(express.json());

const CART_SERVICE = "http://192.168.137.103:8082";
const INVENTORY_SERVICE = "http://192.168.137.13:8084";

app.get("/api/order", (req, res) => {
  res.send("Welcome to the Order PU!");
});

// POST /api/checkout
app.post("/api/checkout", async (req, res) => {
  const { userId } = req.body;
  try {
    // 1. Get cart from Cart PU
    const cartRes = await axios.get(`${CART_SERVICE}/api/cart/${userId}`);
    const cart = cartRes.data;

    if (cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 2. Validate and Decrease stock for each item in Cart (via Inventory PU)
    // In a real high-scale system, this might be optimized or done in a transaction
    for (const item of cart) {
      try {
        await axios.post(`${INVENTORY_SERVICE}/api/stock/decrease`, {
          productId: item.productId,
          quantity: item.quantity,
        });
      } catch (error) {
        return res.status(400).json({
          error: `Failed to checkout item ${item.name}: ${error.response?.data?.error || error.message}`,
        });
      }
    }

    // 3. Create Order in Redis
    const orderId = Date.now().toString();
    const order = {
      orderId,
      userId,
      items: JSON.stringify(cart),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      timestamp: new Date().toISOString(),
    };

    await client.hSet(`order:${orderId}`, order);

    // 4. Clear Cart
    await axios.delete(`${CART_SERVICE}/api/cart/${userId}`);

    res.json({ message: "Order placed successfully", orderId, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:userId
app.get("/api/orders/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Lấy tất cả key order
    const keys = await client.keys("order:*");

    if (keys.length === 0) {
      return res.json([]);
    }

    const orders = [];
    for (const key of keys) {
      const order = await client.hGetAll(key);

      // Filter theo userId
      if (order.userId === userId) {
        orders.push({
          ...order,
          items: JSON.parse(order.items),
          total: parseFloat(order.total),
        });
      }
    }

    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(PORT, IP, async () => {
  await connect();
  console.log(`Order PU running on http://${IP}:${PORT}`);
});
