import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ShoppingCart,
  ShoppingBag,
  Zap,
  Trash2,
  Package,
  Info,
  X,
} from "lucide-react";

const PRODUCT_PU = "http://192.168.43.17:8081/api";
const CART_PU = "http://192.168.43.46:8082/api";
const ORDER_PU = "http://192.168.43.46:8083/api";
const INVENTORY_PU = "http://192.168.43.95:8084/api";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [stocks, setStocks] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fake Login
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username.trim()) {
      alert("Please enter username");
      return;
    }

    setUserId(username);
    setIsLoggedIn(true);
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${PRODUCT_PU}/products`);
      setProducts(res.data);

      const stockData = {};

      for (const p of res.data) {
        const sRes = await axios.get(`${INVENTORY_PU}/stock/${p.id}`);
        stockData[p.id] = sRes.data.stock;
      }

      setStocks(stockData);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchCart = async () => {
    if (!userId) return;

    try {
      const res = await axios.get(`${CART_PU}/cart/${userId}`);
      setCart(res.data);
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    fetchProducts();

    const interval = setInterval(() => {
      products.forEach(async (p) => {
        const sRes = await axios.get(`${INVENTORY_PU}/stock/${p.id}`);

        setStocks((prev) => ({
          ...prev,
          [p.id]: sRes.data.stock,
        }));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [products.length, isLoggedIn]);

  useEffect(() => {
    fetchCart();

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${CART_PU}/cart/${USER_ID}`);
        console.log("Polling cart:", res.data);

        setCart(res.data);
      } catch (err) {
        console.error("Polling cart failed", err);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = async (product) => {
    try {
      await axios.post(`${CART_PU}/cart/add`, {
        userId: userId,
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
      });

      fetchCart();

      setMessage(`Added ${product.name} to cart!`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Failed to add to cart");
    }
  };

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const res = await axios.post(`${ORDER_PU}/checkout`, { userId: USER_ID });
      setMessage("Flash Sale Success! Order placed.");
      setCart([]);

      fetchProducts();

      setIsCartOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || "Checkout failed");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleRemoveAll = async () => {
    setLoading(true);

    try {
      await axios.delete(`${CART_PU}/cart/${userId}`);

      setCart([]);

      setMessage("All items removed from cart");
    } catch (err) {
      alert("Failed to remove items");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await axios.delete(`${CART_PU}/cart/${userId}/${productId}`);

      setCart((prev) => prev.filter((item) => item.productId !== productId));

      setMessage("Item removed from cart");
    } catch (err) {
      alert("Failed to remove item");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Login</h1>

          <p className="text-slate-400 mb-8">Fake login để giả lập user</p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-blue-500"
                placeholder="Nhập username"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-blue-500"
                placeholder="Nhập password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl transition-all"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Zap className="text-white fill-current" size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              FLASH SALE SBA
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Logged in as: {userId}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-white/5 active:scale-95"
        >
          <ShoppingCart size={20} className="text-slate-400" />

          <span className="font-semibold text-sm">Cart</span>

          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg shadow-rose-500/40">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        {message && (
          <div className="mb-8 p-4 glass border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center gap-3">
            <div className="bg-emerald-500/20 p-1.5 rounded-full">
              <Zap size={16} />
            </div>

            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="group glass rounded-[2rem] overflow-hidden transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div className="absolute top-4 left-4">
                  <span className="flash-badge">Flash Deal</span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h2>
                  <span className="text-2xl font-black text-blue-400">
                    ${product.price}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>

                <div className="flex items-center gap-2 mb-6 mt-auto">
                  <div className="p-1.5 bg-slate-800 rounded-lg">
                    <Package size={14} className="text-slate-400" />
                  </div>

                  <span
                    className={`text-xs font-medium uppercase tracking-wider ${
                      stocks[product.id] <= 3
                        ? "text-rose-500 animate-pulse"
                        : "text-slate-500"
                    }`}
                  >
                    {stocks[product.id] > 0
                      ? `${stocks[product.id]} Units Left`
                      : "Sold Out"}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:shadow-none"
                    disabled={
                      stocks[product.id] <= 0 ||
                      stocks[product.id] -
                        (cart.find((item) => item.productId === product.id)
                          ?.quantity || 0) <=
                        0
                    }
                    onClick={() => addToCart(product)}
                  >
                    <ShoppingBag size={18} />

                    {stocks[product.id] <= 0
                      ? "Sold Out"
                      : stocks[product.id] -
                            (cart.find((item) => item.productId === product.id)
                              ?.quantity || 0) <=
                          0
                        ? "All In Cart"
                        : "Buy Now"}
                  </button>

                  <button
                    className="flex-1 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-white/5 active:scale-95"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Info size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
