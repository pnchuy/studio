
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
import type { Book, Author, Genre, Series, CoverImages, YoutubeLink } from "@/types";
import { convertYoutubeUrlToEmbed } from "@/lib/utils";
import { PlusCircle, Trash2, X, Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { useToast } from "@/hooks/use-toast";

const youtubeLinkSchema = z.object({
  url: z.string().url({ message: "Link YouTube không hợp lệ." }).or(z.literal('')),
  chapters: z.string().regex(/^[0-9|]*$/, { message: "Chapters chỉ được chứa số và dấu '|'."}).optional(),
});

const formSchema = z.object({
  title: z.string().min(2, { message: "Tiêu đề phải có ít nhất 2 ký tự." }),
  authorId: z.string({ required_error: "Vui lòng chọn một tác giả." }),
  publicationDate: z.string().min(1, { message: "Ngày xuất bản là bắt buộc." }).refine((val) => !isNaN(Date.parse(val)), { message: "Ngày xuất bản không hợp lệ." }),
  coverImages: z.object({
    size250: z.string(),
    size360: z.string(),
    size480: z.string(),
  }),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  series: z.string().optional().nullable(),
  seriesOrder: z.number().nonnegative({ message: "Thứ tự phải là số không âm."}).optional().nullable(),
  genreIds: z.array(z.string()).optional().default([]),
  youtubeLinks: z.array(youtubeLinkSchema).optional(),
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

const processImageFromBlob = (blob: Blob): Promise<CoverImages> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = async () => {
                const sizes = [250, 360, 480];
                const encodedImages: Partial<CoverImages> = {};

                for (const width of sizes) {
                    const canvas = document.createElement('canvas');
                    const scaleFactor = width / img.width;
                    canvas.width = width;
                    canvas.height = img.height * scaleFactor;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        return reject(new Error('Could not get canvas context'));
                    }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/webp', 0.8);
                    encodedImages[`size${width}` as keyof CoverImages] = dataUrl;
                }
                
                resolve(encodedImages as CoverImages);
            };
            img.onerror = (error) => {
                console.error("Image loading error", error);
                reject(new Error("Image could not be loaded from data URL."));
            };
        };
        reader.onerror = (error) => {
            console.error("FileReader error", error);
            reject(new Error("Could not read image file."));
        };
    });
};


export function EditBookForm({ bookToEdit, onBookUpdated, onFinished, authors, genres, seriesList }: EditBookFormProps) {
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [imagePreview, setImagePreview] = useState<string | null>(bookToEdit.coverImages.size480);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const [genreInputValue, setGenreInputValue] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const genreInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: bookToEdit.title,
      authorId: bookToEdit.authorId,
      publicationDate: bookToEdit.publicationDate,
      coverImages: bookToEdit.coverImages,
      shortDescription: bookToEdit.shortDescription,
      longDescription: bookToEdit.longDescription,
      series: bookToEdit.series || "",
      seriesOrder: bookToEdit.seriesOrder ?? null,
      genreIds: bookToEdit.genreIds,
      youtubeLinks: bookToEdit.youtubeLinks && bookToEdit.youtubeLinks.length > 0 ? bookToEdit.youtubeLinks : [{ url: "", chapters: "" }],
      amazonLink: bookToEdit.amazonLink || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "youtubeLinks",
  });
  
  const seriesValue = form.watch("series");
  const coverImagesValue = form.watch('coverImages');

  useEffect(() => {
    if (coverImagesValue?.size480) {
      setImagePreview(coverImagesValue.size480);
    } else {
      setImagePreview("https://placehold.co/480x720.png");
    }
  }, [coverImagesValue]);
  
  useEffect(() => {
    // Heuristic to check if the image is a data URL or a regular URL
    if (bookToEdit.coverImages.size480.startsWith('data:image')) {
        setUploadType('file');
    } else {
        setUploadType('url');
    }
  }, [bookToEdit.coverImages.size480]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      form.setValue('coverImages', { size250: '', size360: '', size480: '' }); // Clear preview
      try {
        const resizedDataUrls = await processImageFromBlob(file);
        form.setValue('coverImages', resizedDataUrls, { shouldValidate: true });
        toast({ title: "Success", description: "Image processed and ready to be saved." });
      } catch (error) {
        console.error("Failed to resize image", error);
        toast({ variant: "destructive", title: "Error", description: "Could not process image file." });
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (z.string().url().safeParse(url).success) {
      form.setValue('coverImages', {
        size250: url,
        size360: url,
        size480: url,
      }, { shouldValidate: true });
    } else {
       form.setValue('coverImages', {
        size250: "https://placehold.co/250x375.png",
        size360: "https://placehold.co/360x540.png",
        size480: "https://placehold.co/480x720.png",
      }, { shouldValidate: true });
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedBookData: Book = {
        id: bookToEdit.id,
        docId: bookToEdit.docId,
        title: values.title,
        authorId: values.authorId,
        publicationDate: values.publicationDate,
        coverImages: values.coverImages,
        shortDescription: values.shortDescription || '',
        longDescription: values.longDescription || '',
        series: (values.series === 'none' || !values.series) ? null : values.series,
        seriesOrder: (values.series && values.series !== 'none') ? (values.seriesOrder ?? null) : null,
        genreIds: values.genreIds || [],
        youtubeLinks: values.youtubeLinks?.map(link => ({
            ...link,
            url: convertYoutubeUrlToEmbed(link.url)
        })).filter(link => link.url) ?? [],
        amazonLink: values.amazonLink || "",
    };
    onBookUpdated(updatedBookData);
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

        <div className="relative w-32 mx-auto">
            <p className="text-center text-sm font-medium mb-2">Ảnh bìa xem trước</p>
            {isProcessingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
            <Image
                src={imagePreview || "https://placehold.co/480x720.png"}
                alt="Xem trước ảnh bìa"
                width={480}
                height={720}
                className="rounded-md object-cover aspect-[2/3]"
                data-ai-hint="book cover"
            />
        </div>
        
        <FormField
          control={form.control}
          name="coverImages"
          render={() => (
              <FormItem>
                  <FormLabel>Ảnh bìa</FormLabel>
                  <RadioGroup
                      value={uploadType}
                      className="flex space-x-4"
                      onValueChange={(value: 'url' | 'file') => setUploadType(value)}
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
                              disabled={isProcessingImage}
                              defaultValue={coverImagesValue?.size480.startsWith('http') ? coverImagesValue.size480 : ''}
                              onBlur={handleUrlChange}
                          />
                      ) : (
                          <Input
                              key="edit-cover-image-file"
                              type="file"
                              disabled={isProcessingImage}
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
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả ngắn</FormLabel>
              <FormControl>
                <Textarea placeholder="Tóm tắt nội dung sách..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="longDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả chi tiết</FormLabel>
              <FormControl>
                <Textarea placeholder="Mô tả chi tiết nội dung sách, có thể dùng Markdown..." {...field} rows={6}/>
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

        <div className="space-y-4">
            <FormLabel>Link YouTube (Trailer/Review)</FormLabel>
            {fields.map((item, index) => (
               <div key={item.id} className="space-y-2 p-3 border rounded-md relative">
                    {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                    <FormField
                        control={form.control}
                        name={`youtubeLinks.${index}.url`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Link</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://youtube.com/watch?v=..." {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`youtubeLinks.${index}.chapters`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Chapters (tùy chọn)</FormLabel>
                                <FormControl>
                                    <Input placeholder="0|2848|3979..." {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ url: "", chapters: "" })}
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
            <Button type="submit" disabled={isProcessingImage}>
                {isProcessingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cập nhật sách
            </Button>
        </div>
      </form>
    </Form>
  );
}
