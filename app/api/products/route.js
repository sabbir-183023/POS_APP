import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import Product from "@/app/models/Product";

// GET: Fetch all products
export async function GET() {
  try {
    await connectToDatabase();
    // Sort by newest first
    const products = await Product.find({}).sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST: Create a new product
export async function POST(request) {
  try {
    const body = await request.json();
    await connectToDatabase();
    const newProduct = await Product.create(body);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}