"use client";

import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { getAllUsers } from '@/lib/users';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

export function MemberManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = await getAllUsers();
        setUsers(userList);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUserDeleted = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    if (userToDelete) {
        toast({
            variant: "destructive",
            title: "Đã xóa thành viên",
            description: `Thành viên "${userToDelete.name}" đã được xóa.`,
        });
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý thành viên</CardTitle>
        <CardDescription>Xem và quản lý danh sách thành viên.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên thành viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                    const canDelete = currentUser && (
                        (currentUser.role === 'ADMIN' && user.role !== 'ADMIN') ||
                        (currentUser.role === 'MANAGER' && user.role === 'MEMBER')
                    ) && currentUser.id !== user.id;

                  return (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'MANAGER' ? 'secondary' : 'outline'}>
                                {user.role}
                            </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={!canDelete}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleUserDeleted(user.id)} className="text-destructive focus:text-destructive" disabled={!canDelete}>
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Xóa
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
