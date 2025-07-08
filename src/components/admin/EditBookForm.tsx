
"use client";

import { useEffect, useState, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import type { Book, Author, Genre, Series } from "@/types";
import { convertYoutubeUrlToEmbed } from "@/lib/utils";
import { PlusCircle, Trash2, X } from "lucide-react";
import { Badge } from "../ui/badge";

const formSchema = z.object({
  title: z.string().min(2, { message: "Tiêu đề phải có ít nhất 2 ký tự." }),
  authorId: z.string({ required_error: "Vui lòng chọn một tác giả." }),
  publicationDate: z.string().min(1, { message: "Ngày xuất bản là bắt buộc." }).refine((val) => !isNaN(Date.parse(val)), { message: "Ngày xuất bản không hợp lệ." }),
  coverImage: z.string().optional().or(z.literal('')),
  summary: z.string().optional(),
  series: z.string().optional().nullable(),
  seriesOrder: z.number().nonnegative({ message: "Thứ tự phải là số không âm."}).optional().nullable(),
  genreIds: z.array(z.string()).optional().default([]),
  youtubeLink: z.array(z.string().url({ message: "Link YouTube không hợp lệ." }).or(z.literal(''))).optional(),
  amazonLink: z.string().url({ message: "Link Amazon không hợp lệ." }).optional().or(z.literal('')),
});

interface EditBookFormProps {
    bookToEdit: Book;
    onBookUpdated: (book: Book) => void;
    onFinished: () => void;
    authors: Author[];
    genres: Genre[];
    seriesList: Series[];
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

export function EditBookForm({ bookToEdit, onBookUpdated, onFinished, authors, genres, seriesList }: EditBookFormProps) {
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [imagePreview, setImagePreview] = useState<string | null>(bookToEdit.coverImage);
  
  const [genreInputValue, setGenreInputValue] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const genreInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: bookToEdit.title,
      authorId: bookToEdit.authorId,
      publicationDate: bookToEdit.publicationDate,
      coverImage: bookToEdit.coverImage || "",
      summary: bookToEdit.summary,
      series: bookToEdit.series || "",
      seriesOrder: bookToEdit.seriesOrder ?? null,
      genreIds: bookToEdit.genreIds,
      youtubeLink: bookToEdit.youtubeLink && bookToEdit.youtubeLink.length > 0 ? bookToEdit.youtubeLink : [""],
      amazonLink: bookToEdit.amazonLink || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "youtubeLink",
  });
  
  const seriesValue = form.watch("series");
  const coverImageValue = form.watch('coverImage');

  useEffect(() => {
    if (coverImageValue && (coverImageValue.startsWith('http') || coverImageValue.startsWith('data:'))) {
      setImagePreview(coverImageValue);
    } else {
      setImagePreview("https://placehold.co/400x600.png");
    }
  }, [coverImageValue]);
  
  useEffect(() => {
    if (bookToEdit.coverImage.startsWith('data:')) {
        setUploadType('file');
    } else {
        setUploadType('url');
    }
  }, [bookToEdit.coverImage]);

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedBook: Book = {
        id: bookToEdit.id,
        title: values.title,
        authorId: values.authorId,
        publicationDate: values.publicationDate,
        coverImage: values.coverImage || "https://placehold.co/400x600.png",
        summary: values.summary || '',
        series: (values.series === 'none' || !values.series) ? null : values.series,
        seriesOrder: (values.series && values.series !== 'none') ? (values.seriesOrder ?? null) : null,
        genreIds: values.genreIds || [],
        youtubeLink: values.youtubeLink?.map(link => convertYoutubeUrlToEmbed(link)).filter(Boolean) as string[] ?? [],
        amazonLink: values.amazonLink || "",
    };
    onBookUpdated(updatedBook);
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
          render={({ field }) => {
            const selectedGenres = genres.filter(g => (field.value || []).includes(g.id));

            const handleGenreRemove = (genreId: string) => {
                const newGenreIds = (field.value || []).filter((id: string) => id !== genreId);
                field.onChange(newGenreIds);
            };

            const processGenreInput = (input: string) => {
              const newGenreNames = input.split(',').map(name => name.trim()).filter(Boolean);
              if (newGenreNames.length === 0) return;

              const currentIds = field.value || [];
              const newGenreIds = newGenreNames.reduce((acc, name) => {
                  const foundGenre = genres.find(g => g.name.toLowerCase() === name.toLowerCase());
                  if (foundGenre && !currentIds.includes(foundGenre.id)) {
                    acc.push(foundGenre.id);
                  }
                  return acc;
              }, [] as string[]);
              
              if (newGenreIds.length > 0) {
                  field.onChange([...currentIds, ...newGenreIds]);
              }
              setGenreInputValue("");
            };

            const handleGenreInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === ',' || e.key === 'Enter') {
                  e.preventDefault();
                  processGenreInput(genreInputValue);
                  setIsSuggestionsOpen(false);
              } else if (e.key === 'Backspace' && genreInputValue === '' && (field.value || []).length > 0) {
                  const currentIds = field.value || [];
                  const lastGenreId = currentIds[currentIds.length - 1];
                  handleGenreRemove(lastGenreId);
              }
            };

            const handleSuggestionClick = (genreId: string) => {
              const currentIds = field.value || [];
              field.onChange([...currentIds, genreId]);
              setGenreInputValue("");
              setIsSuggestionsOpen(false);
              genreInputRef.current?.focus();
            };

            const filteredSuggestions = genres.filter(genre => 
              !(field.value || []).includes(genre.id) &&
              genre.name.toLowerCase().includes(genreInputValue.toLowerCase()) &&
              genreInputValue.length > 0
            );

            return (
              <FormItem>
                <FormLabel>Thể loại</FormLabel>
                <Popover open={isSuggestionsOpen && filteredSuggestions.length > 0} onOpenChange={setIsSuggestionsOpen}>
                  <PopoverTrigger asChild>
                      <div className="flex flex-wrap gap-2 rounded-md border border-input min-h-10 p-1.5 items-center" onClick={() => genreInputRef.current?.focus()}>
                      {selectedGenres.map(genre => (
                          <Badge key={genre.id} variant="secondary" className="flex items-center gap-1">
                          {genre.name}
                          <button
                              type="button"
                              className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              onClick={() => handleGenreRemove(genre.id)}
                          >
                              <X className="h-3 w-3" />
                          </button>
                          </Badge>
                      ))}
                      <input
                          ref={genreInputRef}
                          type="text"
                          value={genreInputValue}
                          onChange={(e) => {
                              setGenreInputValue(e.target.value);
                              if (!isSuggestionsOpen) setIsSuggestionsOpen(true);
                          }}
                          onKeyDown={handleGenreInputKeyDown}
                          onBlur={() => {
                              processGenreInput(genreInputValue);
                              setIsSuggestionsOpen(false);
                          }}
                          className="inline-flex flex-grow bg-transparent outline-none placeholder:text-muted-foreground text-sm px-1"
                          placeholder={selectedGenres.length > 0 ? "" : "Nhập thể loại, cách nhau bởi dấu phẩy"}
                      />
                      </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <div className="max-h-60 overflow-y-auto">
                      {filteredSuggestions.map((genre) => (
                          <Button
                          key={genre.id}
                          type="button"
                          variant="ghost"
                          className="w-full justify-start rounded-md"
                          onMouseDown={(e) => {
                              e.preventDefault();
                              handleSuggestionClick(genre.id);
                          }}
                          >
                          {genre.name}
                          </Button>
                      ))}
                      </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )
          }}
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
                          <RadioGroupItem value="url" id="edit-r1" />
                          <Label htmlFor="edit-r1">Từ URL</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="file" id="edit-r2" />
                          <Label htmlFor="edit-r2">Tải lên từ máy</Label>
                      </div>
                  </RadioGroup>
                  <FormControl>
                    <div>
                      {uploadType === 'url' ? (
                          <Input
                              key="edit-cover-image-url"
                              placeholder="https://..."
                              value={field.value?.startsWith('data:') ? '' : field.value}
                              onChange={field.onChange}
                          />
                      ) : (
                          <Input
                              key="edit-cover-image-file"
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
                            <SelectItem key={series.id} value={series.name}>
                                {series.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {seriesValue && seriesValue !== 'none' && (
            <FormField
                control={form.control}
                name="seriesOrder"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Thứ tự trong Series</FormLabel>
                    <FormControl>
                    <Input
                        type="number"
                        placeholder="1"
                        {...field}
                        onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        value={field.value ?? ""}
                        step="0.1"
                        min="0"
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

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
            <Button type="submit">Cập nhật sách</Button>
        </div>
      </form>
    </Form>
  );
}
