import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import Product from "@/app/models/Product";

// PUT: Update a specific product
export async function PUT(request, { params }) {
  const { id } = params;
  try {
    const body = await request.json();
    await connectToDatabase();
    const updatedProduct = await Product.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE: Remove a specific product
export async function DELETE(request, { params }) {
  const { id } = params;
  try {
    await connectToDatabase();
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}