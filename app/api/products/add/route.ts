// app/api/products/add/route.ts
import { Client, Databases, ID } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { productName, price } = await request.json();

    if (!productName || !price) {
      return NextResponse.json(
        { error: "Product name and price are required" },
        { status: 400 },
      );
    }

    // Validate price format (optional but recommended)
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      return NextResponse.json(
        { error: "Valid price is required (positive number)" },
        { status: 400 },
      );
    }

    const endpoint = "https://fra.cloud.appwrite.io/v1";
    const projectId = "69d4d2dc000176b736f5";
    const databaseId = "69f370360012a2321393";
    const collectionId = "products";
    const apiKey =
      "standard_2f577c01646e126e609aa27a79276d22660586d711cdb9ad8fc01705ddf40d5b1f843e951cae85facdd4657188e599d2148adc458e88352bda52fae56d3502b7b5ecaf89ca2173edf7b230c65fd5d99e746444136b3532e1d83a8ed33a7517deecdb9faa20283f2fa481cbf77426feecb4e8ba22c453c78206f73fc617014dde";

    const client = new Client()
      .setEndpoint(endpoint!)
      .setProject(projectId!)
      .setKey(apiKey!);

    const databases = new Databases(client);

    const response = await databases.createDocument(
      databaseId!,
      collectionId!,
      ID.unique(),
      {
        productName: productName.trim(),
        price: price, // Store as string
      },
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add product",
      },
      { status: 500 },
    );
  }
}
