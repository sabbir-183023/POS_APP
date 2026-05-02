// app/api/orders/[id]/route.ts

import { Client, Databases } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

function getAppwriteClient() {
  const endpoint = "https://fra.cloud.appwrite.io/v1";
  const projectId = "69d4d2dc000176b736f5";
  const databaseId = "69f370360012a2321393";
  const ordersCollectionId = "orders";
  const apiKey = "standard_2f577c01646e126e609aa27a79276d22660586d711cdb9ad8fc01705ddf40d5b1f843e951cae85facdd4657188e599d2148adc458e88352bda52fae56d3502b7b5ecaf89ca2173edf7b230c65fd5d99e746444136b3532e1d83a8ed33a7517deecdb9faa20283f2fa481cbf77426feecb4e8ba22c453c78206f73fc617014dde";

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