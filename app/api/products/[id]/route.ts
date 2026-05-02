// app/api/products/[id]/route.ts

import { Client, Databases } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

function getAppwriteClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !databaseId || !collectionId || !apiKey) {
    throw new Error(
      'Appwrite environment variables are not fully configured. Please set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID, NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID, and APPWRITE_API_KEY.'
    );
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return { client, databaseId, collectionId };
}

// GET method to fetch a single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    console.log('Fetching product with ID:', productId);

    const { client, databaseId, collectionId } = getAppwriteClient();
    const databases = new Databases(client);

    const product = await databases.getDocument(
      databaseId,
      collectionId,
      productId
    );

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// For Next.js 15+ with async params
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    console.log('Updating product with ID:', productId); // Debug log

    const { productName, price } = await request.json();
    console.log('Update data:', { productName, price });

    if (!productName || price === undefined || Number.isNaN(Number(price))) {
      return NextResponse.json(
        { error: 'Product name and valid price are required' },
        { status: 400 }
      );
    }

    const { client, databaseId, collectionId } = getAppwriteClient();
    const databases = new Databases(client);

    const response = await databases.updateDocument(
      databaseId,
      collectionId,
      productId,
      { 
        productName, 
        price: price.toString() // Store as string for consistency
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    console.log('Deleting product with ID:', productId); // Debug log

    const { client, databaseId, collectionId } = getAppwriteClient();
    const databases = new Databases(client);

    await databases.deleteDocument(
      databaseId,
      collectionId,
      productId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    );
  }
}