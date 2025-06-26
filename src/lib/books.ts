import fs from 'fs/promises';
import path from 'path';
import type { Book } from '@/types';

const dataFilePath = path.join(process.cwd(), 'src/data/books.json');

async function readBooks(): Promise<Book[]> {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileContent) as Book[];
  } catch (error) {
    console.error('Failed to read books data:', error);
    return [];
  }
}

export async function getAllBooks(): Promise<Book[]> {
  return readBooks();
}

export async function getBookById(id: string): Promise<Book | null> {
  const books = await readBooks();
  return books.find((book) => book.id === id) || null;
}
