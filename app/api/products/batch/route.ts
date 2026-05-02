import { Client, Databases } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json();
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({});
    }
    
    const client = new Client()
      .setEndpoint("https://fra.cloud.appwrite.io/v1")
      .setProject("69d4d2dc000176b736f5")
      .setKey("standard_2f577c01646e126e609aa27a79276d22660586d711cdb9ad8fc01705ddf40d5b1f843e951cae85facdd4657188e599d2148adc458e88352bda52fae56d3502b7b5ecaf89ca2173edf7b230c65fd5d99e746444136b3532e1d83a8ed33a7517deecdb9faa20283f2fa481cbf77426feecb4e8ba22c453c78206f73fc617014dde");

    const databases = new Databases(client);
    const databaseId = "69f370360012a2321393";
    const productsCollectionId = "products";
    
    // Fetch all products in parallel
    const promises = productIds.map((id: string) => 
      databases.getDocument(databaseId, productsCollectionId, id)
    );
    
    const products = await Promise.all(promises);
    
    // Create a map for quick lookup
    const productMap: Record<string, any> = {};
    products.forEach(product => {
      productMap[product.$id] = product;
    });
    
    return NextResponse.json(productMap);
  } catch (error) {
    console.error('Error fetching products batch:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}