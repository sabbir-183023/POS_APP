"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  $id: string;
  productName: string;
  price: string; // Changed to string
  $createdAt?: string;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ productName: "", price: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ productName: "", price: "" });
    setEditingId(null);
  };

  const handleEditClick = (product: Product) => {
    setFormMode("edit");
    setEditingId(product.$id);
    setFormData({
      productName: product.productName,
      price: product.price, // Direct string, no conversion needed
    });
  };

  const handleCancel = () => {
    setFormMode(null);
    setEditingId(null);
    setFormData({ productName: "", price: "" });
  };

  // In ProductsPage.tsx, update the handleSubmit function:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.productName.trim() || !formData.price.trim()) {
    setError("Please fill in all fields");
    return;
  }

  // Validate price is a valid number/string format
  const priceValue = parseFloat(formData.price);
  if (isNaN(priceValue) || priceValue < 0) {
    setError("Please enter a valid price (positive number)");
    return;
  }

  try {
    setSaving(true);
    setError(null);

    if (formMode === "add") {
      const response = await fetch("/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: formData.productName,
          price: formData.price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add product");
      }
      setSuccessMessage("Product added successfully!");
    } else if (formMode === "edit" && editingId) {
      // CHANGE THIS: Use dynamic route instead of query parameter
      const response = await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: formData.productName,
          price: formData.price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }
      setSuccessMessage("Product updated successfully!");
    }

    setFormMode(null);
    setEditingId(null);
    setFormData({ productName: "", price: "" });
    fetchProducts();

    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (err) {
    console.error("Full error:", err);
    setError(err instanceof Error ? err.message : "Operation failed");
  } finally {
    setSaving(false);
  }
};

// Also update the handleDelete function:
const handleDelete = async (productId: string) => {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    setSaving(true);
    setError(null);

    // CHANGE THIS: Use dynamic route instead of query parameter
    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete product");
    }
    setSuccessMessage("Product deleted successfully!");
    fetchProducts();

    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to delete product");
  } finally {
    setSaving(false);
  }
};

 

  const formatPrice = (price: string): string => {
    // Format price string to display nicely
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    // Format with 2 decimal places for taka
    return numPrice.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Product Management
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Add, edit, and manage your products
            </p>
          </div>
          <Link
            href="/"
            className="rounded-2xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
          >
            ← Back to Home
          </Link>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          </div>
        )}

        {formMode && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">
              {formMode === "add" ? "Add New Product" : "Edit Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="productName"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Product Name
                </label>
                <input
                  id="productName"
                  type="text"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Price (BDT / Taka)
                </label>
                <input
                  id="price"
                  type="text"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter price in Taka (e.g., 100, 150.50)"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Product"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!formMode && (
          <button
            onClick={handleAddClick}
            className="rounded-2xl bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
          >
            + Add Product
          </button>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900">
            All Products ({products.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No products yet. Add one to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.$id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {product.productName}
                    </p>
                    <p className="text-sm text-slate-600">
                      ৳{formatPrice(product.price)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="rounded-2xl bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.$id)}
                      className="rounded-2xl bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
