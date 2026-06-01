"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FiPrinter, FiTrash2 } from "react-icons/fi"; // Added react-icons

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  // Edit State
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editCart, setEditCart] = useState([]); // Holds mutable products for the order being edited
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    //eslint-disable-next-line
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Collapse
  const toggleOrder = (orderId) => {
    if (editingOrderId) return; // Prevent collapse while editing
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Start Editing
  const startEdit = (order) => {
    setEditingOrderId(order._id);
    setEditCart([...order.products]);
    setExpandedOrderId(order._id); // Ensure it's expanded
  };

  // Cancel Editing
  const cancelEdit = () => {
    setEditingOrderId(null);
    setEditCart([]);
    setSearchQuery("");
    setSuggestions([]);
  };

  // Product Search for Edit Mode
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Search error", error);
      }
    };
    const debounce = setTimeout(() => fetchSuggestions(), 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Edit Cart Functions
  const addItemToEditCart = (product) => {
    setEditCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearchQuery("");
    setSuggestions([]);
    toast.success("Item added");
  };

  const updateEditQuantity = (id, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 1) return;
    setEditCart((prev) => prev.map((item) => item._id === id ? { ...item, quantity: qty } : item));
  };

  const removeEditItem = (id) => {
    setEditCart((prev) => prev.filter((item) => item._id !== id));
  };

  const editCartTotal = editCart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

  // Save Edits
  const saveEditedOrder = async (orderId) => {
    if (editCart.length === 0) {
      toast.error("Order must have at least one item. Delete the order instead.");
      return;
    }

    const toastId = toast.loading("Saving changes...");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: editCart,
          totalAmount: editCartTotal.toString()
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      toast.success("Order updated", { id: toastId });
      
      cancelEdit();
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order", { id: toastId });
    }
  };

  // Delete Order
  const deleteOrder = async (id, e) => {
    e.stopPropagation(); // Prevent triggering row collapse
    if (!confirm("Are you sure you want to completely delete this order?")) return;
    
    const toastId = toast.loading("Deleting order...");
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Order deleted", { id: toastId });
        if (expandedOrderId === id) setExpandedOrderId(null);
        fetchOrders();
      } else throw new Error();
    } catch (error) {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  // Print Receipt (Reused logic)
  const printOrder = (order, e) => {
    if (e) e.stopPropagation();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Allow pop-ups to print");
    
    const html = `
      <html>
        <head>
          <title>Receipt - ${order.orderNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 350px; margin: 0 auto; color: #000; }
            h2, p { text-align: center; margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
            th, td { padding: 8px 0; text-align: left; }
            th, .total-row td { border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { font-weight: bold; font-size: 16px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h2>SABBIR POS</h2>
          <p>Order No: <b>${order.orderNumber}</b></p>
          <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
          <table>
            <thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-right">Price</th></tr></thead>
            <tbody>
              ${order.products.map(p => `
                <tr><td>${p.productName}</td><td class="text-center">${p.quantity}</td><td class="text-right">৳ ${(Number(p.price) * p.quantity).toFixed(2)}</td></tr>
              `).join('')}
              <tr><td colspan="3" style="padding: 5px;"></td></tr>
              <tr class="total-row"><td colspan="2">TOTAL</td><td class="text-right">৳ ${order.totalAmount}</td></tr>
            </tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Toaster position="bottom-right" />
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Order History</h1>
            <p className="text-slate-600 mt-1">Manage, edit, and reprint past transactions.</p>
          </div>
        </header>

        {loading ? (
          <div className="py-12 text-center text-slate-500 animate-pulse">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-500 rounded-3xl border border-dashed border-slate-300">
            No orders found.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              const isEditing = editingOrderId === order._id;
              const displayProducts = isEditing ? editCart : order.products;
              const displayTotal = isEditing ? editCartTotal : order.totalAmount;

              return (
                <div key={order._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                  
                  {/* Order Header (Click to expand) */}
                  <div 
                    onClick={() => toggleOrder(order._id)}
                    className={`p-5 flex flex-col sm:flex-row justify-between sm:items-center cursor-pointer hover:bg-slate-50 transition ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : ''}`}
                  >
                    <div className="flex gap-6 items-center">
                      <div className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-xl">
                        {order.orderNumber}
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</div>
                        <div className="font-semibold text-slate-800">{order.products.length} items</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-4 sm:mt-0">
                      <div className="text-xl font-bold text-slate-900">৳ {Number(displayTotal).toFixed(2)}</div>
                      
                      {!isEditing && (
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => printOrder(order, e)} 
                            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center justify-center" 
                            title="Reprint"
                          >
                            <FiPrinter className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={(e) => deleteOrder(order._id, e)} 
                            className="p-2 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition flex items-center justify-center" 
                            title="Delete"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content Area */}
                  {isExpanded && (
                    <div className="p-5">
                      
                      {/* Search Bar for Editing */}
                      {isEditing && (
                        <div className="mb-6 relative bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Add Product to Order</label>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search product..."
                            // Explicit text-slate-900 and bg-white to fix dark mode invisibility
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                          />
                          {suggestions.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-slate-900">
                              {suggestions.map((p) => (
                                <li key={p._id} onClick={() => addItemToEditCart(p)} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between border-b last:border-b-0">
                                  <span className="font-medium">{p.productName}</span>
                                  <span>৳ {p.price}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Items List */}
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-sm text-slate-500 border-b border-slate-200">
                            <th className="pb-3 font-medium">Product</th>
                            <th className="pb-3 font-medium">Price</th>
                            <th className="pb-3 font-medium text-center">Qty</th>
                            <th className="pb-3 font-medium text-right">Subtotal</th>
                            {isEditing && <th className="pb-3 font-medium text-center">Action</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayProducts.map((item) => (
                            <tr key={item._id} className="hover:bg-slate-50">
                              <td className="py-3 font-medium text-slate-800">{item.productName}</td>
                              <td className="py-3 text-slate-600">৳ {item.price}</td>
                              <td className="py-3 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => updateEditQuantity(item._id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 font-bold text-slate-700">-</button>
                                    <input 
                                      type="number" 
                                      min="1" 
                                      value={item.quantity} 
                                      onChange={(e) => updateEditQuantity(item._id, e.target.value)} 
                                      // Explicit text and bg colors here as well
                                      className="w-12 text-center bg-white text-slate-900 border border-slate-300 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    />
                                    <button onClick={() => updateEditQuantity(item._id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 font-bold text-slate-700">+</button>
                                  </div>
                                ) : (
                                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium">{item.quantity}</span>
                                )}
                              </td>
                              <td className="py-3 text-right font-semibold text-slate-800">৳ {(Number(item.price) * item.quantity).toFixed(2)}</td>
                              {isEditing && (
                                <td className="py-3 text-center">
                                  <button onClick={() => removeEditItem(item._id)} className="text-red-500 text-sm font-medium hover:underline">Remove</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Action Buttons */}
                      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        {isEditing ? (
                          <>
                            <button onClick={cancelEdit} className="px-6 py-2 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition">Cancel</button>
                            <button onClick={() => saveEditedOrder(order._id)} className="px-6 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition">Save Changes</button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(order)} className="px-6 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-medium hover:bg-blue-100 transition">Edit Order</button>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}