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
import { Textarea } from "@/components/ui/textarea";
import type { Book } from "@/types";

const formSchema = z.object({
  title: z.string().min(2, { message: "Tiêu đề phải có ít nhất 2 ký tự." }),
  author: z.string().min(2, { message: "Tác giả phải có ít nhất 2 ký tự." }),
  publicationDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Ngày xuất bản không hợp lệ." }),
  coverImage: z.string().url({ message: "URL ảnh bìa không hợp lệ." }),
  summary: z.string().min(10, { message: "Tóm tắt phải có ít nhất 10 ký tự." }),
  series: z.string().optional().nullable(),
  genre: z.string().min(2, { message: "Thể loại phải có ít nhất 2 ký tự." }),
  youtubeLink: z.string().url({ message: "Link YouTube không hợp lệ." }).optional().or(z.literal('')),
});

interface AddBookFormProps {
    onBookAdded: (book: Book) => void;
    onFinished: () => void;
}

export function AddBookForm({ onBookAdded, onFinished }: AddBookFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      publicationDate: "",
      coverImage: "https://placehold.co/400x600.png",
      summary: "",
      series: "",
      genre: "",
      youtubeLink: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newBook: Book = {
        id: `book-${Date.now()}`, 
        ...values,
        series: values.series || null,
        youtubeLink: values.youtubeLink || "",
    };
    onBookAdded(newBook);
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề</FormLabel>
              <FormControl>
                <Input placeholder="The Way of Kings" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tác giả</FormLabel>
              <FormControl>
                <Input placeholder="Brandon Sanderson" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="publicationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày xuất bản</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Ảnh bìa</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tóm tắt</FormLabel>
              <FormControl>
                <Textarea placeholder="Tóm tắt nội dung sách..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="series"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Series</FormLabel>
              <FormControl>
                <Input placeholder="The Stormlight Archive" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="genre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thể loại</FormLabel>
              <FormControl>
                <Input placeholder="Epic Fantasy" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="youtubeLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link YouTube (Trailer/Review)</FormLabel>
              <FormControl>
                <Input placeholder="https://youtube.com/embed/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished}>Hủy</Button>
            <Button type="submit">Thêm sách</Button>
        </div>
      </form>
    </Form>
  );
}
