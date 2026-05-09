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

const PRODUCT_PU = "http://HIP_IP:8081/api";
const CART_PU = "http://ZANG_IP:8082/api";
const ORDER_PU = "http://ZANG_IP:8083/api";
const INVENTORY_PU = "http://DUYEN_IP:8084/api";

const USER_ID = "user_123"; // Mock user

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [stocks, setStocks] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
    try {
      const res = await axios.get(`${CART_PU}/cart/${USER_ID}`);
      setCart(res.data);
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  };

  useEffect(() => {
    fetchProducts();

    const interval = setInterval(() => {
      products.forEach(async (p) => {
        const sRes = await axios.get(`${INVENTORY_PU}/stock/${p.id}`);
        setStocks((prev) => ({ ...prev, [p.id]: sRes.data.stock }));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [products.length]);

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
        userId: USER_ID,
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

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Zap className="text-white fill-current" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            FLASH SALE SBA
          </h1>
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
          <div className="mb-8 p-4 glass border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
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
                    className={`text-xs font-medium uppercase tracking-wider ${stocks[product.id] <= 3 ? "text-rose-500 animate-pulse" : "text-slate-500"}`}
                  >
                    {stocks[product.id] > 0
                      ? `${stocks[product.id]} Units Left`
                      : "Sold Out"}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:shadow-none"
                    disabled={stocks[product.id] <= 0}
                    onClick={() => addToCart(product)}
                  >
                    <ShoppingBag size={18} />
                    {stocks[product.id] > 0 ? "Buy Now" : "Sold Out"}
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative glass max-w-lg w-full rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 z-10 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all backdrop-blur-md"
            >
              <X size={20} />
            </button>

            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full h-64 object-cover"
            />

            <div className="p-8">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="flash-badge mb-2 inline-block">
                    Product Detail
                  </span>
                  <h2 className="text-3xl font-bold text-white">
                    {selectedProduct.name}
                  </h2>
                </div>
                <p className="text-3xl font-black text-blue-400">
                  ${selectedProduct.price}
                </p>
              </div>

              <div className="bg-slate-800/50 p-5 rounded-2xl mb-8 border border-white/5">
                <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2">
                  Description
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="bg-slate-800 p-2 rounded-xl">
                  <Package size={18} className="text-slate-400" />
                </div>
                <span
                  className={`font-bold ${stocks[selectedProduct.id] <= 3 ? "text-rose-500" : "text-emerald-500"}`}
                >
                  {stocks[selectedProduct.id]} units available
                </span>
              </div>

              <button
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98] disabled:bg-slate-800 disabled:shadow-none"
                disabled={stocks[selectedProduct.id] <= 0}
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                {stocks[selectedProduct.id] > 0 ? "Add to Cart" : "Sold Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-white/5 p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <ShoppingCart className="text-blue-500" /> Your Cart
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag size={64} className="mb-4" />
                  <p className="text-lg">Your cart is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center bg-slate-800/40 p-4 rounded-2xl border border-white/5"
                  >
                    <div className="text-left">
                      <h4 className="text-white font-bold mb-1">{item.name}</h4>
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                        {item.quantity} x ${item.price}
                      </p>
                    </div>
                    <span className="text-blue-400 font-bold">
                      ${item.price * item.quantity}
                    </span>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-slate-500 font-medium">
                    Total Balance
                  </span>
                  <span className="text-3xl font-black text-white">
                    ${cartTotal}
                  </span>
                </div>
                <button
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
                  disabled={loading}
                  onClick={handleCheckout}
                >
                  {loading ? "Processing..." : "Checkout Now"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
