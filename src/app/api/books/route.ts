// Đây là một ví dụ về API Route trong Next.js.
// Trong một ứng dụng thực tế, hàm này sẽ truy vấn dữ liệu từ cơ sở dữ liệu (như Firestore)
// thay vì đọc từ tệp JSON.

import { NextResponse } from 'next/server';
import booksData from '@/data/books.json';
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
  // Tạm thời, chúng ta vẫn trả về dữ liệu từ tệp JSON.
  // Trong tương lai, bạn sẽ thay thế phần này bằng mã để truy vấn từ Firestore.
  const books: Book[] = booksData;
  return NextResponse.json(books);
}
