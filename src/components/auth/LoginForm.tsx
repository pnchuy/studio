
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
  email: z.string().email({ message: "Vui lòng nhập một địa chỉ email hợp lệ." }),
});

export function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // The login logic in useAuth now handles the passwordless flow.
    // It will check the user's status and show appropriate toasts/messages.
    const result = await login(values.email, "password-placeholder"); // Password is not used but required by function signature.

    if (result.success) {
       toast({
        title: "Kiểm tra email của bạn",
        description: "Một liên kết đăng nhập đã được gửi đến email của bạn.",
      });
    } else if (result.errorCode !== 'unverified' && result.errorCode !== 'not-registered') {
       toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: result.message || "Đã xảy ra lỗi không xác định.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Đang xử lý..." : "Tiếp tục với Email"}
        </Button>
      </form>
    </Form>
  );
}
