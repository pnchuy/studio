// Đây là một ví dụ về API Route trong Next.js.
// Trong một ứng dụng thực tế, hàm này sẽ truy vấn dữ liệu từ cơ sở dữ liệu (như Firestore)
// thay vì đọc từ tệp JSON.

import { NextResponse } from 'next/server';
import { getAllBooks } from '@/lib/books';
import type { Book } from '@/types';

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Lấy danh sách tất cả các sách
 *     description: Trả về một mảng chứa tất cả các đối tượng sách trong bộ sưu tập.
 *     responses:
 *       200:
 *         description: Một mảng các đối tượng sách.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */
export async function GET() {
  const books: Book[] = await getAllBooks();
  return NextResponse.json(books);
}
