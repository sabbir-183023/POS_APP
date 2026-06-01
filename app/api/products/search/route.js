import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import Product from "@/app/models/Product";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q) {
      return NextResponse.json([]);
    }

    await connectToDatabase();
    
    // Find products where the name matches the search query (case-insensitive)
    const products = await Product.find({
      productName: { $regex: q, $options: 'i' }
    }).limit(10); // Limit to 10 suggestions

    return NextResponse.json(products);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}