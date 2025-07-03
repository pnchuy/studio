import fs from 'fs/promises';
import path from 'path';
import type { User } from '@/types';

const dataFilePath = path.join(process.cwd(), 'src/data/users.json');

async function readUsers(): Promise<User[]> {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileContent) as User[];
  } catch (error) {
    console.error('Failed to read users data:', error);
    return [];
  }
}

export async function getAllUsers(): Promise<User[]> {
  return readUsers();
}
