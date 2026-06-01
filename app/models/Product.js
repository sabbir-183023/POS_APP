// app/models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Product = mongoose.models.Products || mongoose.model("Products", productSchema);

export default Product;
