const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { client, connect } = require("../shared/redisClient");

const app = express();
const PORT = process.env.PORT || 8082;
const IP = process.env.IP || "localhost";

app.use(cors());
app.use(express.json());

app.get("/api/cart", (req, res) => {
  res.send("Welcome to the Cart PU!");
});

// GET /api/cart/:userId
app.get("/api/cart/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const cartData = await client.get(`cart:${userId}`);
    res.json(cartData ? JSON.parse(cartData) : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cart/add
app.post("/api/cart/add", async (req, res) => {
  const { userId, productId, name, price, quantity } = req.body;
  try {
    const cartKey = `cart:${userId}`;
    const cartData = await client.get(cartKey);
    let cart = cartData ? JSON.parse(cartData) : [];

    const existingItem = cart.find((item) => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, name, price, quantity });
    }

    await client.set(cartKey, JSON.stringify(cart));
    res.json({ message: "Added to cart", cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart/:userId
app.delete("/api/cart/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await client.del(`cart:${userId}`);
    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart/:userId/:productId
app.delete("/api/cart/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const cartKey = `cart:${userId}`;
    const cartData = await client.get(cartKey);

    let cart = cartData ? JSON.parse(cartData) : [];

    cart = cart.filter((item) => item.productId !== productId);

    await client.set(cartKey, JSON.stringify(cart));

    res.json({
      message: "Item removed",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(PORT, IP, async () => {
  await connect();
  console.log(`Cart PU running on http://${IP}:${PORT}`);
});
