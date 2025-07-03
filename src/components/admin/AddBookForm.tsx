"use client";

import { useEffect, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Book, Author, Genre } from "@/types";
import { getAllAuthors } from "@/lib/authors";
import { getAllGenres } from "@/lib/genres";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, { message: "Tiêu đề phải có ít nhất 2 ký tự." }),
  authorId: z.string({ required_error: "Vui lòng chọn một tác giả." }),
  publicationDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Ngày xuất bản không hợp lệ." }),
  coverImage: z.string().url({ message: "URL ảnh bìa không hợp lệ." }),
  summary: z.string().min(10, { message: "Tóm tắt phải có ít nhất 10 ký tự." }),
  series: z.string().optional().nullable(),
  genreIds: z.array(z.string()).min(1, { message: "Phải chọn ít nhất một thể loại." }),
  youtubeLink: z.string().url({ message: "Link YouTube không hợp lệ." }).optional().or(z.literal('')),
});

interface AddBookFormProps {
    onBookAdded: (book: Book) => void;
    onFinished: () => void;
}

export function AddBookForm({ onBookAdded, onFinished }: AddBookFormProps) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      authorId: undefined,
      publicationDate: "",
      coverImage: "https://placehold.co/400x600.png",
      summary: "",
      series: "",
      genreIds: [],
      youtubeLink: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
        const [authorList, genreList] = await Promise.all([
            getAllAuthors(),
            getAllGenres()
        ]);
        setAuthors(authorList);
        setGenres(genreList);
    };
    fetchData();
  }, []);

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

  const selectedGenres = form.watch('genreIds');
  const selectedGenreNames = genres
    .filter(g => selectedGenres?.includes(g.id))
    .map(g => g.name)
    .join(", ");

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
          name="authorId"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Tác giả</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn một tác giả" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {authors.map(author => (
                            <SelectItem key={author.id} value={author.id}>
                                {author.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="genreIds"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Thể loại</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}>
                      <span className="truncate max-w-xs">{selectedGenreNames.length > 0 ? selectedGenreNames : "Chọn thể loại"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <div className="flex flex-col p-2 gap-2 max-h-60 overflow-y-auto">
                        {genres.map((genre) => (
                           <FormItem key={genre.id} className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(genre.id)}
                                        onCheckedChange={(checked) => {
                                            const currentValue = field.value || [];
                                            return checked
                                            ? field.onChange([...currentValue, genre.id])
                                            : field.onChange(currentValue.filter((value) => value !== genre.id));
                                        }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex-1">
                                    {genre.name}
                                </FormLabel>
                            </FormItem>
                        ))}
                    </div>
                </PopoverContent>
              </Popover>
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
