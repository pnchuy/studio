
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { BookOpen, LogIn, LogOut, UserPlus, Shield, UserCog, Search } from 'lucide-react';
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
import { Skeleton } from './ui/skeleton';
import { GlobalSearch } from './search/GlobalSearch';

const LOGO_STORAGE_KEY = 'bibliophile-logo';

export function ClientSiteHeader() {
  const { user, isLoggedIn, logout, isLoading } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client, so it's safe to use localStorage.
    const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (storedLogo) {
      setLogoUrl(storedLogo);
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" width={24} height={24} className="h-6 w-auto" />
            ) : (
              <BookOpen className="h-6 w-6 text-primary" />
            )}
            <span className="hidden md:inline font-bold font-headline text-lg">Listen and Read</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
           <div className="w-full flex-1 md:w-auto md:flex-none">
             <GlobalSearch />
           </div>
          <ThemeToggle />
          <nav className="flex items-center">
            {isLoading ? (
              <Skeleton className="h-9 w-9 rounded-full" />
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
              <div className="hidden md:flex items-center space-x-2">
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
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
