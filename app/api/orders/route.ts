//app/api/orders/route.ts

import { Client, Databases, ID, Query } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

function getAppwriteClient() {
 
  const endpoint = "https://fra.cloud.appwrite.io/v1";
  const projectId = "69d4d2dc000176b736f5";
  const databaseId = "69f370360012a2321393";
  const ordersCollectionId = "orders";
  const apiKey = "standard_2f577c01646e126e609aa27a79276d22660586d711cdb9ad8fc01705ddf40d5b1f843e951cae85facdd4657188e599d2148adc458e88352bda52fae56d3502b7b5ecaf89ca2173edf7b230c65fd5d99e746444136b3532e1d83a8ed33a7517deecdb9faa20283f2fa481cbf77426feecb4e8ba22c453c78206f73fc617014dde";

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
