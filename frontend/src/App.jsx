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
  Plus,
  Edit2,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import MyOrders from "./components/MyOrders";

const PRODUCT_PU = "http://192.168.137.68:8081/api";
const CART_PU = "http://192.168.137.103:8082/api";
const ORDER_PU = "http://192.168.137.103:8083/api";
const INVENTORY_PU = "http://192.168.137.13:8084/api";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [stocks, setStocks] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [adminMode, setAdminMode] = useState(false);

  const [userId, setUserId] = useState(
    localStorage.getItem('userId') || ''
  );

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('userId')
  );

  // Admin panel states
  const [newProduct, setNewProduct] = useState({
    id: '',
    name: '',
    price: '',
    description: '',
    image: '',
    quantity: '10',
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username.trim()) {
      alert("Please enter username");
      return;
    }

    localStorage.setItem('userId', username);

    setUserId(username);
    setIsLoggedIn(true);
    if(username === 'admin') {
      isAdmin = true;
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      'Are you sure you want to logout?'
    );

    if (!confirmed) return;

    localStorage.removeItem('userId');

    setUserId('');
    setUsername('');
    setPassword('');
    setCart([]);

    setIsLoggedIn(false);
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
        const res = await axios.get(`${CART_PU}/cart/${userId}`);
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

      // setMessage(`Added ${product.name} to cart!`);
      // setTimeout(() => // setMessage(""), 3000);
    } catch (err) {
      alert("Failed to add to cart");
    }
  };

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const res = await axios.post(`${ORDER_PU}/checkout`, {
        userId: userId,
      });

      setMessage("Order placed successfully!");
      setCart([]);

      fetchProducts();

      setIsCartOpen(false);

      const section = document.getElementById("section-scroll");

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch (err) {
      alert(err.response?.data?.error || "Checkout failed");
    } finally {
      setLoading(false);

      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleRemoveAll = async () => {
    setLoading(true);

    try {
      await axios.delete(`${CART_PU}/cart/${userId}`);

      setCart([]);

      // setMessage("All items removed from cart");
    } catch (err) {
      alert("Failed to remove items");
    } finally {
      setLoading(false);

      // setTimeout(() => // setMessage(""), 3000);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await axios.delete(`${CART_PU}/cart/${userId}/${productId}`);

      setCart((prev) => prev.filter((item) => item.productId !== productId));

      // setMessage("Item removed from cart");
    } catch (err) {
      alert("Failed to remove item");
    } finally {
      // setTimeout(() => // // setMessage(""), 3000);
    }
  };

  // ADMIN FUNCTIONS
  const isAdmin = userId === 'admin';

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.id || !newProduct.name || !newProduct.price) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create product
      await axios.post(`${PRODUCT_PU}/products`, {
        id: newProduct.id,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        image: newProduct.image,
      });

      // Initialize stock
      await axios.post(`${INVENTORY_PU}/stock/initialize`, {
        productId: newProduct.id,
        initialStock: parseInt(newProduct.quantity),
      });

      setMessage('Product added successfully!');
      setNewProduct({ id: '', name: '', price: '', description: '', image: '', quantity: '10' });
      setShowAddForm(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add product');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${PRODUCT_PU}/products/${editingProduct.id}`, {
        name: editingProduct.name,
        price: parseFloat(editingProduct.price),
        description: editingProduct.description,
        image: editingProduct.image,
      });

      setMessage('Product updated successfully!');
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update product');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    setLoading(true);
    try {
      await axios.delete(`${PRODUCT_PU}/products/${productId}`);
      setMessage('Product deleted successfully!');
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getNextProductId = async () => {
    try {
      const res = await axios.get(`${PRODUCT_PU}/products/next-id`);
      setNewProduct({ ...newProduct, id: res.data.nextId });
    } catch (err) {
      console.error('Failed to get next product ID', err);
      setNewProduct({ ...newProduct, id: `P${(products.length + 1).toString().padStart(3, '0')}` });
    }
  };

  const handleShowAddForm = () => {
    getNextProductId();
    setShowAddForm(true);
  };

  const handleCancelAddForm = () => {
    setShowAddForm(false);
    setNewProduct({ id: '', name: '', price: '', description: '', image: '', quantity: '10' });
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

          <p className="text-slate-400 mb-8">Please enter your credentials to login</p>

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

            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-slate-500">
                Logged in as: {userId} {isAdmin && '(Admin)'}
              </p>

              <button
                onClick={handleLogout}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && false && (
            <button
              onClick={() => setAdminMode(!adminMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border active:scale-95 ${
                adminMode
                  ? 'bg-green-600 border-green-400 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 border-white/5 text-slate-400'
              }`}
            >
              <BarChart3 size={20} />
              <span className="font-semibold text-sm">Management</span>
            </button>
          )}

          {
            !isAdmin && (
            <button
            onClick={() => setIsOrdersOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-white/5 active:scale-95"
          >
            <ClipboardList size={20} className="text-slate-400" />
            <span className="font-semibold text-sm">My Orders</span>
          </button>)
          }

          {!isAdmin && (
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
          )}
        </div>
      </header>

      {isOrdersOpen && (
        <MyOrders userId={userId} onClose={() => setIsOrdersOpen(false)} />
      )}

      <main className="max-w-7xl mx-auto p-6 lg:p-10" id="section-scroll" style={{ scrollMarginTop: '100px' }}>
        {message && (
          <div className="mb-8 p-4 glass border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center gap-3">
            {/* <div className="bg-emerald-500/20 p-1.5 rounded-full">
              <Zap size={16} />
            </div> */}

            {message}
          </div>
        )}

        {/* ADMIN MANAGEMENT VIEW */}
        { isAdmin ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Product Management</h2>
              <button
                onClick={handleShowAddForm}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>

            {/* Add Product Form */}
            {showAddForm && (
              <div className="glass p-8 rounded-2xl border border-blue-500/20">
                <h3 className="text-xl font-bold text-white mb-6">New Product</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 border border-white/10 rounded-xl px-4 py-2 flex items-center text-slate-400">
                      <span className="text-sm">ID: <span className="text-blue-400 font-bold">{newProduct.id}</span></span>
                    </div>
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Initial Stock"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                      className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                    rows="3"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl transition-all"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Product'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAddForm}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Product Form */}
            {editingProduct && (
              <div className="glass p-8 rounded-2xl border border-orange-500/20">
                <h3 className="text-xl font-bold text-white mb-6">Edit Product</h3>
                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                    rows="3"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl transition-all"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products Table */}
            <div className="glass rounded-2xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-900/50">
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-400">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-400">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-400">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-400">Description</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-white/5 hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4 text-sm text-slate-300">{product.id}</td>
                        <td className="px-6 py-4 text-sm text-white font-semibold">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-blue-400 font-bold">${product.price}</td>
                        <td className="px-6 py-4 text-sm text-slate-400 line-clamp-2">{product.description}</td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="inline-flex items-center gap-1 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 px-3 py-1 rounded-lg transition"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1 rounded-lg transition"
                            disabled={loading}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* SHOPPING VIEW */
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
        )}
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="relative w-full max-w-md bg-slate-900 border-l border-white/5 p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <ShoppingCart className="text-blue-500" />
                Your Cart
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
                cart.map(item => (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center bg-slate-800/40 p-4 rounded-2xl border border-white/5"
                  >
                    <div className="text-left">
                      <h4 className="text-white font-bold mb-1">
                        {item.name}
                      </h4>

                      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                        {item.quantity} x ${item.price}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 font-bold">
                        ${item.price * item.quantity}
                      </span>

                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
                      >
                        <Trash2
                          size={16}
                          className="text-red-500"
                        />
                      </button>
                    </div>
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

                <div className="flex justify-between gap-4">
                  <button
                    className="w-full py-4 font-bold text-lg rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
                    style={{
                      color: 'red',
                      border: '1px solid red',
                      background: 'white'
                    }}
                    onClick={handleRemoveAll}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Remove All'}
                  </button>

                  <button
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
                    disabled={loading}
                    onClick={handleCheckout}
                  >
                    {loading ? 'Processing...' : 'Checkout Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                  className={`font-bold ${
                    stocks[selectedProduct.id] <= 3
                      ? 'text-rose-500'
                      : 'text-emerald-500'
                  }`}
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
                {stocks[selectedProduct.id] > 0
                  ? 'Add to Cart'
                  : 'Sold Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
