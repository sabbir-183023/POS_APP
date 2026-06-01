import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import Order from "@/app/models/Order";

// GET: Fetch all orders
export async function GET() {
  try {
    await connectToDatabase();
    // Fetch orders, newest first
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await connectToDatabase();
    
    // Generate a simple 6-digit order number for the POS
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const newOrder = await Order.create({
      orderNumber,
      totalAmount: body.totalAmount,
      products: body.products
    });
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}