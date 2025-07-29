
"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import type { Book, Author, Genre, Series, YoutubeLink } from "@/types";
import { convertYoutubeUrlToEmbed, cn } from "@/lib/utils";
import { PlusCircle, Trash2, X, Loader2, UploadCloud } from "lucide-react";
import { Badge } from "../ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "../ui/rich-text-editor";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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

interface AddBookFormProps {
    books: Book[];
    onBookAdded: (book: Omit<Book, 'id' | 'docId'>) => void;
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


export function AddBookForm({ books, onBookAdded, onFinished, authors, genres, seriesList }: AddBookFormProps) {
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [imagePreview, setImagePreview] = useState<string>("https://placehold.co/480x720.png");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [genreInputValue, setGenreInputValue] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const genreInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      authorId: undefined,
      publicationDate: "",
      coverImages: {
        size250: "https://placehold.co/250x375.png",
        size360: "https://placehold.co/360x540.png",
        size480: "https://placehold.co/480x720.png",
      },
      shortDescription: "",
      longDescription: "",
      series: "",
      seriesOrder: null,
      genreIds: [],
      youtubeLinks: [{ url: "" , chapters: ""}],
      amazonLink: "",
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
  
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload an image file (png, jpg, webp)." });
        return;
    }
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
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
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        if (e.dataTransfer.files.length > 1) {
            toast({ variant: "destructive", title: "Chỉ một ảnh", description: "Vui lòng chỉ kéo thả một ảnh bìa." });
        } else {
            processFile(e.dataTransfer.files[0]);
        }
        e.dataTransfer.clearData();
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const isDuplicate = books.some(
      (book) => book.title.toLowerCase() === values.title.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Sách đã tồn tại",
        description: `Một cuốn sách với tiêu đề "${values.title}" đã có trong bộ sưu tập.`,
      });
      return; 
    }
    
    const newBookData: Omit<Book, 'id' | 'docId'> = {
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
    onBookAdded(newBookData);
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
        <Card>
            <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
                <CardDescription>Nhập các chi tiết chính của sách.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    );
                }}
                />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Ảnh bìa</CardTitle>
                <CardDescription>Tải ảnh bìa lên từ máy hoặc dùng link ngoài.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-6">
                 <div className="sm:col-span-2 space-y-4">
                    <FormField
                        control={form.control}
                        name="coverImages"
                        render={() => (
                            <FormItem>
                                <FormControl>
                                    <RadioGroup
                                        value={uploadType}
                                        className="flex space-x-4"
                                        onValueChange={(value: 'url' | 'file') => setUploadType(value)}
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
                                </FormControl>
                                
                                <FormControl>
                                    <div>
                                    {uploadType === 'url' ? (
                                        <Input
                                            key="cover-image-url"
                                            placeholder="https://..."
                                            disabled={isProcessingImage}
                                            onBlur={handleUrlChange}
                                        />
                                    ) : (
                                        <div
                                            className={cn(
                                                "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors",
                                                isDragging && "border-primary bg-accent"
                                            )}
                                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <UploadCloud className="w-8 h-8 text-muted-foreground" />
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                <span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả
                                            </p>
                                            <p className="text-xs text-muted-foreground">Chỉ chấp nhận một ảnh</p>
                                            <Input
                                                ref={fileInputRef}
                                                id="dropzone-file"
                                                type="file"
                                                className="hidden"
                                                accept="image/png, image/jpeg, image/webp"
                                                disabled={isProcessingImage}
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                 </div>
                 <div className="col-span-1">
                    <div className="relative w-full max-w-[200px] mx-auto">
                        <p className="text-center text-sm font-medium mb-2">Ảnh bìa xem trước</p>
                        {isProcessingImage && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-md">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                        <Image
                            src={imagePreview || "https://placehold.co/250x375.png"}
                            alt="Xem trước ảnh bìa"
                            width={250}
                            height={375}
                            className="rounded-md object-cover aspect-[2/3]"
                            data-ai-hint="book cover"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Nội dung mô tả</CardTitle>
                <CardDescription>Cung cấp mô tả ngắn gọn và chi tiết về cuốn sách.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

                <Controller
                    control={form.control}
                    name="longDescription"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Mô tả chi tiết</FormLabel>
                            <FormControl>
                                <RichTextEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Liên kết ngoài</CardTitle>
                <CardDescription>Thêm các liên kết hữu ích như trailer hoặc trang bán sách.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background py-4">
            <Button type="button" variant="outline" onClick={onFinished}>Hủy</Button>
            <Button type="submit" disabled={isProcessingImage}>
                {isProcessingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Thêm sách
            </Button>
        </div>
      </form>
    </Form>
  );
}
