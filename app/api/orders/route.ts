//app/api/orders/route.ts

import { Client, Databases, ID, Query } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

function getAppwriteClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const ordersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !databaseId || !ordersCollectionId || !apiKey) {
    throw new Error(
      'Appwrite environment variables are not fully configured.\nPlease set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID, NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID, and APPWRITE_API_KEY.'
    );
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return { client, databaseId, ordersCollectionId };
}

export async function GET() {
  try {
    const { client, databaseId, ordersCollectionId } = getAppwriteClient();
    const databases = new Databases(client);

    const response = await databases.listDocuments(
      databaseId,
      ordersCollectionId,
      [Query.orderDesc('$createdAt')]
    );

    return NextResponse.json(response.documents);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    const { client, databaseId, ordersCollectionId } = getAppwriteClient();
    const databases = new Databases(client);

    const response = await databases.createDocument(
      databaseId,
      ordersCollectionId,
      ID.unique(),
      orderData
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
