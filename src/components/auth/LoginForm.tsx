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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  credential: z.string().min(3, { message: "Vui lòng nhập email hoặc username hợp lệ." }),
  password: z.string().min(1, { message: "Mật khẩu là bắt buộc." }),
});

export function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credential: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const success = await login(values.credential, values.password);
    if (!success) {
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: "Thông tin không hợp lệ. Vui lòng kiểm tra lại email/username và mật khẩu.",
      });
      form.setError("credential", { message: " " });
      form.setError("password", { message: " " });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="credential"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email hoặc Username</FormLabel>
              <FormControl>
                <Input placeholder="your_username hoặc you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </Form>
  );
}
