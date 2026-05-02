// app/actions/noteActions.ts
import { databases } from "@/utils/appwrite"
import { ID, Query } from "appwrite"

export interface Note {
    $id: string
    $createdAt: string
    $updatedAt?: string
    content: string
}

export async function addNote(note: string): Promise<Note> {
    const newNote = { content: note }
    const response = await databases.createDocument(
        'notesApp',      // databaseId
        'documents',     // collectionId
        ID.unique(),     // documentId
        newNote          // data
    )
    
    const createdNote: Note = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        content: response.content
    }
    return createdNote
}

export async function getNotes(): Promise<Note[]> {
    const response = await databases.listDocuments(
        'notesApp',      // databaseId
        'documents',     // collectionId
        [
            Query.orderDesc('$createdAt')  // Show newest first
        ]
    )
    
    const notes: Note[] = response.documents.map((doc) => ({
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        content: doc.content
    }))

    return notes
}

export async function updateNote(noteId: string, newContent: string): Promise<Note> {
    const response = await databases.updateDocument(
        'notesApp',      // databaseId
        'documents',     // collectionId
        noteId,          // documentId
        { content: newContent }  // data to update
    )
    
    const updatedNote: Note = {
        $id: response.$id,
        $createdAt: response.$createdAt,
        $updatedAt: response.$updatedAt,
        content: response.content
    }
    
    return updatedNote
}

export async function deleteNote(noteId: string): Promise<void> {
    await databases.deleteDocument(
        'notesApp',      // databaseId
        'documents',     // collectionId
        noteId           // documentId
    )
}