// app/api/orders/[id]/route.ts

import { Client, Databases } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

function getAppwriteClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const ordersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !databaseId || !ordersCollectionId || !apiKey) {
    throw new Error('Appwrite environment variables are not fully configured.');
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return { client, databaseId, ordersCollectionId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    
    const { client, databaseId, ordersCollectionId } = getAppwriteClient();
    const databases = new Databases(client);
    
    const order = await databases.getDocument(
      databaseId,
      ordersCollectionId,
      orderId
    );
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

//delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    
    const { client, databaseId, ordersCollectionId } = getAppwriteClient();
    const databases = new Databases(client);
    
    await databases.deleteDocument(
      databaseId,
      ordersCollectionId,
      orderId
    );
    
    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete order' },
      { status: 500 }
    );
  }
}