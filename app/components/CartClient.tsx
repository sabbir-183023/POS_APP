"use client";

import React, { useEffect, useMemo, useState } from "react";

interface Product {
  $id: string;
  productName: string;
  price: number | string;
  $createdAt?: string;
}

// Database model (for API responses)
interface DbOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: string; // Stored as string in database
}

// Print model (for invoice display)
interface PrintOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number; // Used as number for calculations
}

interface CartItem extends Product {
  quantity: number;
}


interface OrderForPrint {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  items: PrintOrderItem[]; // Use PrintOrderItem here
}

const formatDate = (rawDate: string) => {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (rawDate: string) => {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CartClient = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    return products.filter((product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    setCart((existingCart) => {
      const found = existingCart.find((item) => item.$id === product.$id);
      if (found) {
        return existingCart.map((item) =>
          item.$id === product.$id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...existingCart, { ...product, quantity: 1 }];
    });
    setStatusMessage(null);
    setError(null);
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart((existingCart) =>
      existingCart.map((item) =>
        item.$id === productId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((existingCart) =>
      existingCart.filter((item) => item.$id !== productId),
    );
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price =
        typeof item.price === "string" ? parseFloat(item.price) : item.price;
      return sum + (Number.isFinite(price) ? price * item.quantity : 0);
    }, 0);
  }, [cart]);

  // Create order data for print directly from cart
  const createOrderForPrint = (
    orderId: string,
    orderNumber: string,
    createdAt: string,
  ): OrderForPrint => {
    const processedItems: PrintOrderItem[] = cart.map((item, index) => {
      const price =
        typeof item.price === "string" ? parseFloat(item.price) : item.price;
      return {
        id: `${item.$id}-${Date.now()}-${index}`,
        productId: item.$id,
        productName: item.productName,
        quantity: item.quantity,
        price: price,
        totalPrice: price * item.quantity, // Keep as number for calculations
      };
    });

    return {
      id: orderId,
      orderNumber: orderNumber,
      date: createdAt,
      total: totalAmount,
      items: processedItems,
    };
  };

  // Print Invoice function
  const printInvoice = (order: OrderForPrint) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = order.items
      .map(
        (item, index) => `
      <tr>
        <td class="item-sn">${index + 1}</td>
        <td class="item-name">${item.productName}</td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-rate">${item.price.toFixed(2)}</td>
        <td class="item-price">${item.totalPrice.toFixed(2)}</td>
      </tr>
    `,
      )
      .join("");

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white;
            padding: 10px;
            display: flex;
            justify-content: center;
            min-height: 100vh;
          }
          .invoice {
            max-width: 210mm;
            width: 100%;
            background: white;
            padding: 15mm;
            margin: 0 auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          
          @media print {
            body {
              padding: 0;
              background: white;
            }
            .invoice {
              box-shadow: none;
              padding: 15mm;
              max-width: 100%;
            }
            .no-print {
              display: none;
            }
            button {
              display: none;
            }
          }
          
          .header {
            text-align: center;
            margin-bottom: 5px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
          
          .business-name {
            font-size: 28px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 5px;
          }
          
          .contact-info {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          
          .contact-info p {
            margin: 2px 0;
          }
          
          .order-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          
          .order-info-box {
            flex: 1;
          }
          
          .order-info-box p {
            margin: 0;
            font-size: 12px;
          }
          
          .order-info-box .label {
            font-weight: bold;
            color: #555;
          }
          
          .order-info-box .value {
            color: #333;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          
          th {
            background: #333;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
          }
          
          td {
            padding: 5px 8px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 12px;
          }
          
          .item-sn {
            width: 50px;
            text-align: center;
          }
          
          .item-name {
            text-align: left;
          }
          
          .item-qty, .item-rate, .item-price {
            text-align: right;
          }
          
          .total-section {
            margin-top: 10px;
            text-align: right;
            padding-top: 10px;
            border-top: 2px solid #333;
          }
          
          .total-row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-top: 5px;
          }
          
          .total-label {
            font-size: 15px;
            font-weight: bold;
            margin-right: 20px;
          }
          
          .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #1a1a1a;
          }
          
          .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #999;
            padding-top: 10px;
            border-top: 1px solid #e0e0e0;
          }
          
          .print-button {
            text-align: center;
            margin-top: 20px;
          }
          
          button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            cursor: pointer;
            border-radius: 5px;
            margin: 0 10px;
          }
          
          button:hover {
            background: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="business-name">Sabbir POS</div>
            <div class="contact-info">
              <p>Email: sabbir183023@gmail.com</p>
              <p>WhatsApp/Phone: 01303934257</p>
            </div>
          </div>
          
          <div class="order-info">
            <div class="order-info-box">
              <p><span class="label">Invoice No:</span> <span class="value">${order.orderNumber}</span></p>
              <p><span class="label">Date:</span> <span class="value">${formatDate(order.date)}</span></p>
              <p><span class="label">Time:</span> <span class="value">${formatTime(order.date)}</span></p>
            </div>
            <div class="order-info-box">
              <p><span class="label">Order ID:</span> <span class="value">${order.id.toUpperCase()}</span></p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th class="item-sn">SL</th>
                <th class="item-name">Product Name</th>
                <th class="item-qty">Quantity</th>
                <th class="item-rate">Rate (৳)</th>
                <th class="item-price">Price (৳)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-row">
              <div class="total-label">Total Amount:</div>
              <div class="total-amount">৳ ${order.total.toFixed(2)}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer generated invoice - no signature required</p>
          </div>
          
          <div class="print-button no-print">
            <button onclick="window.print()">Print Invoice</button>
            <button onclick="window.close()">Close</button>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setError("Add at least one product to the cart first.");
      setStatusMessage(null);
      return;
    }

    try {
      setSavingOrder(true);
      const orderNumber = `ORD-${Date.now()}`;
      const orderData = {
        orderNumber,
        totalAmount: totalAmount.toString(), // Convert to string
        items: cart.map((item) => item.$id + "," + item.quantity),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const createdOrder = await response.json();

      // Create order data for printing directly from cart
      const orderForPrint = createOrderForPrint(
        createdOrder.$id,
        createdOrder.orderNumber,
        createdOrder.$createdAt,
      );

      // Clear the cart
      setCart([]);
      setStatusMessage(
        `Order ${orderNumber} created successfully. Printing invoice...`,
      );

      // Print the invoice
      printInvoice(orderForPrint);

      // Update status message after a short delay
      setTimeout(() => {
        setStatusMessage(
          `Order ${orderNumber} created successfully. Invoice printed.`,
        );

        // Clear status message after 3 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      }, 1000);

      setError(null);
    } catch (err) {
      console.error("Error creating order:", err);
      setError(err instanceof Error ? err.message : "Failed to create order");
      setStatusMessage(null);
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                POS Order Builder
              </h1>
              <p className="mt-2 text-sm text-slate-600">Make your order</p>
            </div>
            <div className="grid gap-3 sm:grid-flow-col sm:auto-cols-max">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                Products:{" "}
                <span className="font-semibold text-slate-900">
                  {products.length}
                </span>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                Cart items:{" "}
                <span className="font-semibold text-slate-900">
                  {cart.length}
                </span>
              </div>
            </div>
          </div>
        </header>

        {(error || statusMessage) && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            {error ? (
              <p className="text-sm font-medium text-red-700">{error}</p>
            ) : (
              <p className="text-sm font-medium text-emerald-700">
                {statusMessage}
              </p>
            )}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          {/* Products Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Live Search
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Type a product name to filter available products.
                </p>
              </div>
              <div className="max-w-xs">
                <label className="sr-only" htmlFor="product-search">
                  Search products
                </label>
                <input
                  id="product-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-inner outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                  No matching products found.
                </div>
              ) : (
                <div className="max-h-[550px] overflow-y-auto pr-2 space-y-4">
                  {filteredProducts.map((product) => {
                    const price =
                      typeof product.price === "string"
                        ? parseFloat(product.price)
                        : product.price;
                    return (
                      <div
                        key={product.$id}
                        className="rounded-3xl border border-slate-200 p-5 shadow-sm transition hover:border-blue-300"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">
                              {product.productName}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Price: ৳{price.toFixed(2)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Add to cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Cart</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Review selected items before creating the order.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                ৳{totalAmount.toFixed(2)} total
              </div>
            </div>

            <div className="mt-6 max-h-[550px] overflow-y-auto space-y-4 pr-2">
              {cart.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  Your cart is empty.
                </div>
              ) : (
                cart.map((item) => {
                  const price =
                    typeof item.price === "string"
                      ? parseFloat(item.price)
                      : item.price;
                  return (
                    <div
                      key={item.$id}
                      className="rounded-3xl border border-slate-200 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {item.productName}
                          </p>
                          <p className="text-sm text-slate-500">
                            ৳{price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-slate-600">
                            Qty
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(event) =>
                                updateCartQuantity(
                                  item.$id,
                                  parseInt(event.target.value) || 1,
                                )
                              }
                              className="w-20 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.$id)}
                            className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={savingOrder || cart.length === 0}
                className="w-full rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingOrder ? "Creating order..." : "Create Order"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CartClient;
