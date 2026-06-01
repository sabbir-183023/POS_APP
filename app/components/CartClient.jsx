"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

const CartClient = () => {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("pos_cart");
    if (savedCart) {
      try {
        //eslint-disable-next-line
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart");
      }
    }
  }, []);

  // Save cart to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("pos_cart", JSON.stringify(cart));
  }, [cart]);

  // Handle character-by-character search
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    };

    // Small debounce to prevent spamming the database on every keystroke
    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Add item to cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setSearchQuery(""); // Clear search after adding
    setSuggestions([]);
    toast.success("Added to cart");
  };

  // Update item quantity
  const updateQuantity = (id, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 1) return; // Prevent negative or invalid text
    
    setCart((prevCart) =>
      prevCart.map((item) => (item._id === id ? { ...item, quantity: qty } : item))
    );
  };

  // Remove item
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== id));
  };

  // Calculate total
  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  // Print Receipt in New Tab
  const printReceipt = (order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print receipts.");
      return;
    }
    
    const html = `
      <html>
        <head>
          <title>Receipt - ${order.orderNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 350px; margin: 0 auto; color: #000; }
            h2 { text-align: center; margin-bottom: 5px; }
            p { margin: 3px 0; text-align: center; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 8px 0; text-align: left; font-size: 14px; }
            th { border-bottom: 1px dashed #000; border-top: 1px dashed #000; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { font-weight: bold; font-size: 16px; border-top: 1px dashed #000; }
            .footer { margin-top: 30px; text-align: center; font-size: 14px; border-top: 1px dashed #000; padding-top: 15px; }
            @media print { 
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h2>SABBIR POS</h2>
          <p>POS Dashboard System</p>
          <p>Order No: <b>${order.orderNumber}</b></p>
          <p>Date: ${new Date().toLocaleString()}</p>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.products.map(p => `
                <tr>
                  <td>${p.productName}</td>
                  <td class="text-center">${p.quantity}</td>
                  <td class="text-right">৳ ${(Number(p.price) * p.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3" style="padding: 5px;"></td>
              </tr>
              <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td class="text-right">৳ ${order.totalAmount}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            Thank you for your business!
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              // Optional: Close tab after print dialog closes
              // window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Save Order
  const handleSaveOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving order...");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: cart,
          totalAmount: cartTotal.toString()
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const savedOrder = await res.json();
      
      toast.success(`Order ${savedOrder.orderNumber} saved!`, { id: toastId });
      
      // Print the receipt
      printReceipt(savedOrder);

      // Clear the cart
      setCart([]);
    } catch (error) {
      toast.error("Error saving order", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <Toaster position="bottom-right" />
      
      {/* Search Section */}
      <div className="relative">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Search Product to Add
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Start typing product name..."
          className="w-full text-gray-600 border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-lg shadow-sm"
        />
        
        {/* Live Search Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((product) => (
              <li
                key={product._id}
                onClick={() => addToCart(product)}
                className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-b-0 transition"
              >
                <span className="font-medium text-slate-800">{product.productName}</span>
                <span className="text-slate-600 font-semibold">৳ {product.price}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cart Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
          <span>Current Cart</span>
          <span className="bg-white px-3 py-1 rounded-full text-sm shadow-sm">{cart.length} items</span>
        </div>
        
        {cart.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Cart is empty. Search for a product to add.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Product Name</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium text-center">Quantity</th>
                  <th className="p-4 font-medium text-right">Subtotal</th>
                  <th className="p-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {cart.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-medium text-slate-800">{item.productName}</td>
                    <td className="p-4 text-slate-600">৳ {item.price}</td>
                    
                    {/* Quantity Controls */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 transition"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item._id, e.target.value)}
                          className="w-16 text-gray-600 text-center border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 transition"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    
                    <td className="p-4 text-right font-semibold text-slate-800">
                      ৳ {(Number(item.price) * item.quantity).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition font-medium text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary and Checkout */}
      {cart.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
          <div className="text-2xl text-slate-800">
            Total: <span className="font-bold text-blue-600">৳ {cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save & Print Receipt"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CartClient;