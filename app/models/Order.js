// app/models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: String,
      required: true,
    },
    products: [],
  },
  { timestamps: true },
);

const Order = mongoose.models.Orders || mongoose.model("Orders", orderSchema);

export default Order;
