"use client";

import { LoginForm } from "@/components/auth/LoginForm";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.98-4.48 1.98-3.62 0-6.57-3.02-6.57-6.75s2.95-6.75 6.57-6.75c2.06 0 3.49.86 4.34 1.68l2.64-2.58C18.04 1.92 15.7 1 12.48 1 7.23 1 3.25 4.92 3.25 10.17s3.98 9.17 9.23 9.17c5.25 0 8.8-3.62 8.8-8.92 0-.6-.08-1.14-.2-1.68h-8.6z" />
    </svg>
  );
}

export default function LoginPage() {
  const { signInWithGoogle, unverifiedUser, resendVerificationEmail } = useAuth();

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    // The auth hook will handle redirection and toasts on its own.
  };

  const handleResend = async () => {
    await resendVerificationEmail();
  }

  return (
    <div className="flex justify-center items-start pt-16">
      <div className="w-full max-w-md space-y-4">
        {unverifiedUser && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Email chưa được xác minh</AlertTitle>
                <AlertDescription>
                    Vui lòng kiểm tra hộp thư của bạn để tìm liên kết xác minh. Nếu bạn không nhận được, hãy nhấp vào nút bên dưới để gửi lại.
                </AlertDescription>
                <Button variant="outline" size="sm" className="mt-4 bg-white text-destructive-foreground hover:bg-white/90" onClick={handleResend}>
                  Gửi lại email xác minh
                </Button>
            </Alert>
        )}
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your library.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <LoginForm />
              
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
                Tiếp tục với Google
              </Button>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline text-primary hover:text-primary/80">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
