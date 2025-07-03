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
import type { Author } from "@/types";
import { generateId } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, { message: "Tên tác giả phải có ít nhất 2 ký tự." }),
});

interface AddAuthorFormProps {
    onAuthorAdded: (author: Author) => void;
    onFinished: () => void;
}

export function AddAuthorForm({ onAuthorAdded, onFinished }: AddAuthorFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newAuthor: Author = {
        id: `author-${generateId()}`, 
        ...values,
    };
    onAuthorAdded(newAuthor);
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên tác giả</FormLabel>
              <FormControl>
                <Input placeholder="Brandon Sanderson" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished}>Hủy</Button>
            <Button type="submit">Thêm tác giả</Button>
        </div>
      </form>
    </Form>
  );
}
