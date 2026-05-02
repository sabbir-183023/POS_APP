// app/api/products/add/route.ts
import { Client, Databases, ID } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { productName, price } = await request.json();

    if (!productName || !price) {
      return NextResponse.json(
        { error: 'Product name and price are required' },
        { status: 400 }
      );
    }

    // Validate price format (optional but recommended)
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      return NextResponse.json(
        { error: 'Valid price is required (positive number)' },
        { status: 400 }
      );
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

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
        price: price // Store as string
      }
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add product' },
      { status: 500 }
    );
  }
}