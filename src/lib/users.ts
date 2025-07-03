import type { User } from '@/types';
import usersData from '@/data/users.json';

export async function getAllUsers(): Promise<User[]> {
  // We keep the async signature to avoid changing all call sites.
  return Promise.resolve(usersData as User[]);
}
