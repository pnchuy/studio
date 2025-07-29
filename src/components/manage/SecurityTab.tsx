
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";

const formSchema = z.object({
  currentPassword: z.string().min(1, { message: "Mật khẩu hiện tại là bắt buộc." }),
  newPassword: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu không khớp.",
  path: ["confirmPassword"],
});

export function SecurityTab() {
  const { toast } = useToast();
  const { authProviderId } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, you would call an API to change the password.
    // Here, we just simulate the success.
    console.log("Changing password with values:", values);
    toast({
      title: "Thành công",
      description: "Mật khẩu của bạn đã được thay đổi thành công.",
    });
    form.reset();
  }

  const isPasswordProvider = authProviderId === 'password';

  return (
    <Card>
        <CardHeader>
            <CardTitle>Bảo mật tài khoản</CardTitle>
             <CardDescription>
                {isPasswordProvider
                    ? "Quản lý mật khẩu của bạn."
                    : "Bạn đang đăng nhập thông qua một nhà cung cấp bên ngoài."
                }
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isPasswordProvider ? (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
                        <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Mật khẩu hiện tại</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Mật khẩu mới</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Đang đổi..." : "Đổi mật khẩu"}
                        </Button>
                    </form>
                </Form>
            ) : (
                 <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Quản lý mật khẩu bên ngoài</AlertTitle>
                    <AlertDescription>
                        Tài khoản của bạn được liên kết với một nhà cung cấp bên ngoài (ví dụ: Google). Để thay đổi mật khẩu, vui lòng thực hiện thông qua trang web của nhà cung cấp đó.
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
    </Card>
  );
}
