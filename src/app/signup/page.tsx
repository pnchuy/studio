"use client";

import { SignUpForm } from "@/components/auth/SignUpForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.98-4.48 1.98-3.62 0-6.57-3.02-6.57-6.75s2.95-6.75 6.57-6.75c2.06 0 3.49.86 4.34 1.68l2.64-2.58C18.04 1.92 15.7 1 12.48 1 7.23 1 3.25 4.92 3.25 10.17s3.98 9.17 9.23 9.17c5.25 0 8.8-3.62 8.8-8.92 0-.6-.08-1.14-.2-1.68h-8.6z" />
    </svg>
  );
}

export default function SignUpPage() {
  const { signInWithGoogle } = useAuth();
  
  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    // The auth hook will handle redirection and toasts on its own.
  };
  
  return (
    <div className="flex justify-center items-start pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Join Bibliophile to start building your personal library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SignUpForm />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
           <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary hover:text-primary/80">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
