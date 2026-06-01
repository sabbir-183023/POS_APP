import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import Order from "@/app/models/Order";

// PUT: Update an order (edit items, quantities, totals)
export async function PUT(request, { params }) {
  const { id } = params;
  try {
    const body = await request.json();
    await connectToDatabase();
    
    const updatedOrder = await Order.findByIdAndUpdate(
      id, 
      { products: body.products, totalAmount: body.totalAmount }, 
      { new: true }
    );
    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// DELETE: Remove an order completely
export async function DELETE(request, { params }) {
  const { id } = params;
  try {
    await connectToDatabase();
    await Order.findByIdAndDelete(id);
    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}