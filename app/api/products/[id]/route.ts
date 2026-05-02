// app/api/products/[id]/route.ts

import { Client, Databases } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

function getAppwriteClient() {
  
  const endpoint = "https://fra.cloud.appwrite.io/v1";
  const projectId = "69d4d2dc000176b736f5";
  const databaseId = "69f370360012a2321393";
  const collectionId = "products";
  const apiKey = "standard_2f577c01646e126e609aa27a79276d22660586d711cdb9ad8fc01705ddf40d5b1f843e951cae85facdd4657188e599d2148adc458e88352bda52fae56d3502b7b5ecaf89ca2173edf7b230c65fd5d99e746444136b3532e1d83a8ed33a7517deecdb9faa20283f2fa481cbf77426feecb4e8ba22c453c78206f73fc617014dde";

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