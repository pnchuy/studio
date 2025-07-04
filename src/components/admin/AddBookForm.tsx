
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Book, Author, Genre } from "@/types";
import { cn, convertYoutubeUrlToEmbed, generateId } from "@/lib/utils";
import { ChevronsUpDown, PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  title: z.string().min(2, { message: "Tiêu đề phải có ít nhất 2 ký tự." }),
  authorId: z.string({ required_error: "Vui lòng chọn một tác giả." }),
  publicationDate: z.string().min(1, { message: "Ngày xuất bản là bắt buộc." }).refine((val) => !isNaN(Date.parse(val)), { message: "Ngày xuất bản không hợp lệ." }),
  coverImage: z.string().optional().or(z.literal('')),
  summary: z.string().optional(),
  series: z.string().optional().nullable(),
  genreIds: z.array(z.string()).optional().default([]),
  youtubeLink: z.array(z.string().url({ message: "Link YouTube không hợp lệ." }).or(z.literal(''))).optional(),
  amazonLink: z.string().url({ message: "Link Amazon không hợp lệ." }).optional().or(z.literal('')),
});

interface AddBookFormProps {
    onBookAdded: (book: Book) => void;
    onFinished: () => void;
    authors: Author[];
    genres: Genre[];
    seriesList: string[];
    onGenreAdded: (genre: Genre) => void;
}

const resizeImage = (file: File, maxWidth: number = 400): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scaleFactor = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scaleFactor;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/webp', 0.8)); // Convert to WebP with 80% quality
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};


export function AddBookForm({ onBookAdded, onFinished, authors, genres, seriesList, onGenreAdded }: AddBookFormProps) {
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [imagePreview, setImagePreview] = useState<string | null>("https://placehold.co/400x600.png");
  const [newGenreName, setNewGenreName] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      authorId: undefined,
      publicationDate: "",
      coverImage: "",
      summary: "",
      series: "",
      genreIds: [],
      youtubeLink: [""],
      amazonLink: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "youtubeLink",
  });

  const coverImageValue = form.watch('coverImage');
  useEffect(() => {
    if (coverImageValue && (coverImageValue.startsWith('http') || coverImageValue.startsWith('data:'))) {
      setImagePreview(coverImageValue);
    } else {
      setImagePreview("https://placehold.co/400x600.png");
    }
  }, [coverImageValue]);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedDataUrl = await resizeImage(file);
        form.setValue('coverImage', resizedDataUrl, { shouldValidate: true });
      } catch (error) {
        console.error("Failed to resize image", error);
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            form.setValue('coverImage', dataUrl, { shouldValidate: true });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddNewGenre = () => {
    if (!newGenreName.trim()) return;
    const newGenre: Genre = {
      id: `genre-${generateId()}`,
      name: newGenreName.trim(),
    };
    onGenreAdded(newGenre);
    const currentGenreIds = form.getValues('genreIds') || [];
    form.setValue('genreIds', [...currentGenreIds, newGenre.id]);
    setNewGenreName('');
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newBook: Book = {
        id: `book-${Date.now()}`, 
        ...values,
        coverImage: values.coverImage || "https://placehold.co/400x600.png",
        series: values.series === 'none' ? null : (values.series || null),
        youtubeLink: values.youtubeLink?.map(link => convertYoutubeUrlToEmbed(link)).filter(Boolean) as string[] ?? [],
        amazonLink: values.amazonLink || "",
    };
    onBookAdded(newBook);
    onFinished();
  }

  const selectedGenreIds = form.watch('genreIds') || [];
  const selectedGenres = genres.filter(g => selectedGenreIds.includes(g.id));

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
                  <Button variant="outline" className={cn("w-full justify-start text-left h-auto min-h-10", !field.value?.length && "text-muted-foreground")}>
                    {selectedGenres.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedGenres.map(genre => (
                            <Badge key={genre.id} variant="secondary">{genre.name}</Badge>
                        ))}
                      </div>
                    ) : "Chọn thể loại"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <div className="flex flex-col p-2 gap-2 max-h-48 overflow-y-auto">
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
                    <Separator />
                    <div className="p-2 flex items-center gap-2">
                        <Input 
                            placeholder="Thêm thể loại mới..." 
                            value={newGenreName} 
                            onChange={(e) => setNewGenreName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNewGenre();
                              }
                            }}
                        />
                        <Button type="button" size="sm" onClick={handleAddNewGenre}>Thêm</Button>
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

        {imagePreview && (
          <div className="w-32 mx-auto">
              <p className="text-center text-sm font-medium mb-2">Ảnh bìa xem trước</p>
              <Image
                  src={imagePreview}
                  alt="Xem trước ảnh bìa"
                  width={400}
                  height={600}
                  className="rounded-md object-cover aspect-[2/3]"
                  data-ai-hint="book cover"
              />
          </div>
        )}
        
        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
              <FormItem>
                  <FormLabel>Ảnh bìa</FormLabel>
                  <RadioGroup
                      value={uploadType}
                      className="flex space-x-4"
                      onValueChange={(value: 'url' | 'file') => {
                          setUploadType(value);
                          form.setValue('coverImage', '', { shouldValidate: true });
                      }}
                  >
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="url" id="r1" />
                          <Label htmlFor="r1">Từ URL</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="file" id="r2" />
                          <Label htmlFor="r2">Tải lên từ máy</Label>
                      </div>
                  </RadioGroup>
                  <FormControl>
                    <div>
                      {uploadType === 'url' ? (
                          <Input
                              key="cover-image-url"
                              placeholder="https://..."
                              value={field.value.startsWith('data:') ? '' : field.value}
                              onChange={field.onChange}
                          />
                      ) : (
                          <Input
                              key="cover-image-file"
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleFileChange}
                              className="pt-2 h-11"
                          />
                      )}
                    </div>
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
                <FormLabel>Series (Tùy chọn)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn series có sẵn" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="none">Không có</SelectItem>
                        {seriesList.map(series => (
                            <SelectItem key={series} value={series}>
                                {series}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
            <FormLabel>Link YouTube (Trailer/Review)</FormLabel>
            {fields.map((item, index) => (
              <FormField
                key={item.id}
                control={form.control}
                name={`youtubeLink.${index}`}
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Input placeholder="https://youtube.com/watch?v=..." {...field} value={field.value ?? ''} />
                            </FormControl>
                            {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
              />
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append("")}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm link
            </Button>
        </div>
        <FormField
          control={form.control}
          name="amazonLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link Amazon (Tùy chọn)</FormLabel>
              <FormControl>
                <Input placeholder="https://amazon.com/dp/..." {...field} value={field.value ?? ''} />
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
