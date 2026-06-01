"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({ productName: "", price: "" });
  const [editingId, setEditingId] = useState(null);

  // Load products on mount
  useEffect(() => {
    //eslint-disable-next-line
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error("Could not load products.");
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const actionPhrase = editingId ? "updated" : "added";

    // We can use a loading toast while the request processes
    const toastId = toast.loading(`Saving product...`);

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Product ${actionPhrase} successfully!`, { id: toastId });
        // Reset form and refresh list
        setFormData({ productName: "", price: "" });
        setEditingId(null);
        fetchProducts();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error(`Failed to save product.`, { id: toastId });
      console.error("Error saving product:", error);
    }
  };

  const handleEdit = (product) => {
    setFormData({ productName: product.productName, price: product.price });
    setEditingId(product._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    const toastId = toast.loading("Deleting product...");
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted.", { id: toastId });
        fetchProducts();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete product.", { id: toastId });
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Initialize the Toaster so notifications can render */}
      <Toaster position="bottom-right" reverseOrder={false} />
      
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">Liz Fashions Inventory</h1>
          <p className="text-slate-600 mt-1">Manage your catalog for the upcoming sales.</p>
        </header>

        {/* Create / Edit Form */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">
            {editingId ? "Edit Product Details" : "Add New Product"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full text-gray-600 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="e.g., Summer Collection Dress"
                required
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (৳)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full text-gray-600 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="0"
                required
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                {editingId ? "Update" : "Save"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setFormData({ productName: "", price: "" }); }}
                  className="w-full sm:w-auto bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Product List */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">Ready for Pack & Print</h2>
          
          {loading ? (
            <div className="py-8 text-center text-slate-500 animate-pulse">Loading inventory...</div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              No products found. Add your first item above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-4 pt-2 font-medium text-slate-600">Product Name</th>
                    <th className="pb-4 pt-2 font-medium text-slate-600">Price</th>
                    <th className="pb-4 pt-2 font-medium text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50 transition">
                      <td className="py-4 text-slate-800 font-medium">{product.productName}</td>
                      <td className="py-4 text-slate-600">৳ {product.price}</td>
                      <td className="py-4 text-right space-x-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-500 hover:text-red-700 font-medium transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}