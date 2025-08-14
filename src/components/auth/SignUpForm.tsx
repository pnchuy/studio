
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
  name: z.string().min(1, { message: "Tên không được để trống." }),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters."})
    .max(20, { message: "Username must not exceed 20 characters."})
    .regex(/^[a-z0-9]+$/, { message: "Username can only contain lowercase letters and numbers."}),
  email: z.string().email({ message: "Invalid email address." }),
});

export function SignUpForm() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // The password is no longer collected from the form.
    // The auth hook will handle sending a verification/login link.
    const result = await signup(values.name, values.email, values.username, "password-placeholder");
    
    if (result.success) {
        toast({
            title: "Tài khoản đã được tạo!",
            description: "Một liên kết xác minh đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến.",
            duration: 8000,
        });
        router.push('/login');
    } else {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: result.message,
      });
      if (result.field) {
        form.setError(result.field as "name" | "username" | "email", { message: result.message });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="janedoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          {form.formState.isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>
      </form>
    </Form>
  );
}
