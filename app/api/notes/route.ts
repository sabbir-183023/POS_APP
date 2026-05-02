// app/api/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';

const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const DATABASE_ID = 'notesApp';
const COLLECTION_ID = 'documents';
const PROJECT_ID = '69d4d2dc000176b736f5';

// GET all notes - Simplified version without queries first
export async function GET() {
  try {
    console.log('API: Fetching notes from Appwrite...');
    
    // First, test without any queries to see if basic connection works
    const response = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: 'GET',
        headers: {
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        },
      }
    );

    console.log('Appwrite Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Appwrite Error Response:', errorText);
      return NextResponse.json(
        { error: `Appwrite error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Successfully fetched notes:', data.documents?.length || 0);
    
    return NextResponse.json(data.documents || []);
  } catch (error) {
    console.error('API GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST create new note
export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    console.log('API: Creating note:', content);

    const documentId = Date.now().toString() + Math.random().toString(36).substring(7);
    
    const response = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        },
        body: JSON.stringify({
          documentId: documentId,
          data: {
            content: content.trim(),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Appwrite POST Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create note', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Note created successfully:', data.$id);
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT update note
export async function PUT(request: NextRequest) {
  try {
    const { noteId, content } = await request.json();

    if (!noteId || !content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Note ID and content are required' },
        { status: 400 }
      );
    }

    console.log('API: Updating note:', noteId);

    const response = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${noteId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        },
        body: JSON.stringify({
          data: {
            content: content.trim(),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Appwrite PUT Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update note', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Note updated successfully');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE remove note
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    console.log('API: Deleting note:', noteId);

    const response = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${noteId}`,
      {
        method: 'DELETE',
        headers: {
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Appwrite DELETE Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to delete note', details: errorText },
        { status: response.status }
      );
    }

    console.log('Note deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}