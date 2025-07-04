"use client";

import Link from 'next/link';
import { BookOpen, LogIn, LogOut, UserPlus, Shield, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  const { user, isLoggedIn, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg">Bibliophile</span>
        </Link>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <nav className="flex items-center space-x-2">
            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
            ) : isLoggedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                      <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href="/manage">
                              <UserCog className="mr-2 h-4 w-4" />
                              <span>Quản lý</span>
                          </Link>
                      </DropdownMenuItem>
                      {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                          <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href="/admin">
                              <Shield className="mr-2 h-4 w-4" />
                              <span>Admin</span>
                              </Link>
                          </DropdownMenuItem>
                      )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
