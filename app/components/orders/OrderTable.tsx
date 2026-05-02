"use client";
import React, { useEffect, useState } from "react";

interface Order {
  $id: string;
  orderNumber: string;
  totalAmount: number;
  items: string[];
  $createdAt: string;
  $updatedAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface ProcessedOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  items: OrderItem[];
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

const OrderTable = () => {
  const [orders, setOrders] = useState<ProcessedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProcessedOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ProcessedOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load orders");
      }

      const processedOrders = await processOrdersWithProducts(data);
      setOrders(processedOrders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const processOrdersWithProducts = async (rawOrders: any[]): Promise<ProcessedOrder[]> => {
    const processedOrders: ProcessedOrder[] = [];

    for (const order of rawOrders) {
      const processedItems: OrderItem[] = [];

      for (const itemString of order.items || []) {
        const [productId, quantityStr] = itemString.split(",");
        const quantity = parseInt(quantityStr, 10);

        if (productId && !isNaN(quantity)) {
          try {
            const productResponse = await fetch(`/api/products/${productId}`);
            
            if (productResponse.ok) {
              const product = await productResponse.json();
              const price = parseFloat(product.price) || 0;
              
              processedItems.push({
                id: `${productId}-${Date.now()}-${Math.random()}`,
                productId: productId,
                productName: product.productName || "Unknown Product",
                quantity: quantity,
                price: price,
                totalPrice: price * quantity,
              });
            } else {
              processedItems.push({
                id: `${productId}-${Date.now()}-${Math.random()}`,
                productId: productId,
                productName: `Product not found (${productId})`,
                quantity: quantity,
                price: 0,
                totalPrice: 0,
              });
            }
          } catch (err) {
            console.error(`Failed to fetch product ${productId}:`, err);
            processedItems.push({
              id: `${productId}-${Date.now()}-${Math.random()}`,
              productId: productId,
              productName: `Error loading product`,
              quantity: quantity,
              price: 0,
              totalPrice: 0,
            });
          }
        }
      }

      processedOrders.push({
        id: order.$id,
        orderNumber: order.orderNumber,
        date: order.$createdAt,
        total: order.totalAmount || processedItems.reduce((sum, item) => sum + item.totalPrice, 0),
        items: processedItems,
      });
    }

    return processedOrders;
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete order");
      }
      
      // Refresh orders list
      await fetchOrders();
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      
    } catch (err) {
      console.error("Error deleting order:", err);
      setError(err instanceof Error ? err.message : "Failed to delete order");
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setDeleting(false);
    }
  };

  const printInvoice = (order: ProcessedOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate table rows HTML
    const tableRows = order.items.map((item, index) => `
      <tr>
        <td class="item-sn">${index + 1}</td>
        <td class="item-name">${item.productName}</td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-rate">${item.price.toFixed(2)}</td>
        <td class="item-price">${item.totalPrice.toFixed(2)}</td>
      </tr>
    `).join('');

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
            <p>Please make ready my order!</p>
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

  const openModal = (order: ProcessedOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const openDeleteModal = (order: ProcessedOrder) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <tbody className="divide-y divide-gray-200">
        <tr>
          <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
            <div className="flex justify-center items-center gap-2">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              Loading orders...
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (error) {
    return (
      <tbody className="divide-y divide-gray-200">
        <tr>
          <td colSpan={5} className="px-6 py-12 text-center">
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <>
      <tbody className="divide-y divide-gray-200">
        {orders.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
              No orders found.
            </td>
          </tr>
        ) : (
          orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-900">
                {order.orderNumber}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {order.items.length} item(s)
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {formatDate(order.date)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                ৳{order.total.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-3">
                  {/* View Details Icon */}
                  <button
                    onClick={() => openModal(order)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all duration-200 group"
                    title="View Details"
                  >
                    <svg 
                      className="w-5 h-5 group-hover:scale-110 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  {/* Print Invoice Icon */}
                  <button
                    onClick={() => printInvoice(order)}
                    className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-all duration-200 group"
                    title="Print Invoice"
                  >
                    <svg 
                      className="w-5 h-5 group-hover:scale-110 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>

                  {/* Delete Icon */}
                  <button
                    onClick={() => openDeleteModal(order)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 group"
                    title="Delete Order"
                  >
                    <svg 
                      className="w-5 h-5 group-hover:scale-110 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedOrder.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(selectedOrder.date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items Count</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedOrder.items.length}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {idx + 1}. {item.productName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × ৳{item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ৳{item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-900">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ৳{selectedOrder.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3">
              <button
                onClick={() => {
                  printInvoice(selectedOrder);
                  closeModal();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Print Invoice
              </button>
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && orderToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">Confirm Delete</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete order <span className="font-semibold">{orderToDelete.orderNumber}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderTable;