
"use client";

import { useState } from "react";
import { z } from "zod";
import type { Book, Author, Genre, Series, CoverImages } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Code, FileJson, FileUp, ListChecks, Loader2, Info, Pilcrow } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { generateId } from "@/lib/utils";
import { JSDOM } from "jsdom";

type ImportType = 'books' | 'authors' | 'genres' | 'series';

// Schema for the books in the JSON file, matching the user's provided format.
const importBookSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc."),
  author: z.string().min(1, "Tên tác giả là bắt buộc."),
  date: z.string().min(1, "Ngày là bắt buộc."),
  youtubeLinks: z.string().optional(),
  amazonLink: z.string().url().or(z.literal("")).optional(),
  genreIds: z.string().optional(),
  coverLink: z.string().url().or(z.literal("")).optional(),
  series: z.string().optional(),
  order: z.union([z.string(), z.number()]).optional(),
  base64: z.string().optional(),
});


const importFileSchema = z.array(importBookSchema);
export type ImportBook = Omit<Book, 'id' | 'docId'>;
type RawImportBook = z.infer<typeof importBookSchema>;


interface ImportBooksDialogProps {
  existingBooks: Book[];
  existingAuthors: Author[];
  existingGenres: Genre[];
  existingSeries: Series[];
  onBooksImported: (books: ImportBook[]) => void;
  onAuthorsImported: (names: string[]) => void;
  onGenresImported: (names: string[]) => void;
  onSeriesImported: (names: string[]) => void;
  onFinished: () => void;
}

const processImageFromBase64 = (base64Data: string): Promise<CoverImages> => {
  return new Promise((resolve, reject) => {
    // JSDOM is needed for server-side canvas operations
    const { window } = new JSDOM();
    const { Image, Canvas } = window;
    
    const img = new Image();
    // Ensure the base64 string has the correct data URI prefix
    img.src = base64Data.startsWith('data:image') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
    
    img.onload = async () => {
      const sizes = [250, 360, 480];
      const encodedImages: Partial<CoverImages> = {};

      for (const width of sizes) {
        const canvas = new Canvas(0,0);
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
      console.error("Image loading error from base64", error);
      reject(new Error("Image could not be loaded from base64 data."));
    };
  });
};


export function ImportBooksDialog({ 
    existingBooks, 
    existingAuthors, 
    existingGenres,
    existingSeries,
    onBooksImported, 
    onAuthorsImported,
    onGenresImported,
    onSeriesImported,
    onFinished 
}: ImportBooksDialogProps) {
  const [importType, setImportType] = useState<ImportType>('books');
  const [step, setStep] = useState<'select' | 'preview'>('select');
  
  // For file import
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewBooks, setPreviewBooks] = useState<ImportBook[]>([]);
  const [skippedBookCount, setSkippedBookCount] = useState(0);
  
  // For bulk text import
  const [bulkText, setBulkText] = useState("");
  const [previewItems, setPreviewItems] = useState<string[]>([]);
  const [skippedItemCount, setSkippedItemCount] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setStep('select');
    setSelectedFile(null);
    setBulkText("");
    setError(null);
    setPreviewBooks([]);
    setPreviewItems([]);
    setSkippedBookCount(0);
    setSkippedItemCount(0);
    setIsLoading(false);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/json") {
        setSelectedFile(file);
      } else {
        setError("Vui lòng chọn một tệp có định dạng .json.");
        setSelectedFile(null);
      }
    }
  };

  const handleParseAndValidate = () => {
    if (importType === 'books') {
        handleBookFileValidation();
    } else {
        handleBulkTextValidation();
    }
  }

  const parseDate = (dateStr: string): string => {
      // Handles "May 14th 2019" -> "2019-05-14"
      const cleanedDateStr = dateStr.replace(/(st|nd|rd|th)/, '');
      const date = new Date(cleanedDateStr);
      if (isNaN(date.getTime())) {
          return new Date().toISOString().split('T')[0]; // fallback
      }
      return date.toISOString().split('T')[0];
  };

  const handleBookFileValidation = () => {
    if (!selectedFile) {
      setError("Vui lòng chọn một tệp để import.");
      return;
    }
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        
        const validationResult = importFileSchema.safeParse(jsonData);
        if (!validationResult.success) {
          const firstError = validationResult.error.issues[0];
          setError(`Cấu trúc file JSON không hợp lệ. Lỗi tại [sách ${firstError.path[0]} -> ${firstError.path[1]}]: ${firstError.message}`);
          setIsLoading(false);
          return;
        }

        const existingTitles = new Set(existingBooks.map(b => b.title.toLowerCase()));
        const authorMap = new Map(existingAuthors.map(a => [a.name.toLowerCase(), a.id]));
        const genreMap = new Map(existingGenres.map(g => [g.name.toLowerCase(), g.id]));
        const seriesSet = new Set(existingSeries.map(s => s.name.toLowerCase()));

        const booksToImport: ImportBook[] = [];

        for (const rawBook of validationResult.data) {
          const isTitleDuplicate = existingTitles.has(rawBook.title.toLowerCase());
          const authorId = authorMap.get(rawBook.author.toLowerCase());
          
          if (!isTitleDuplicate && authorId) {
            const genreIds = rawBook.genreIds?.split(',')
                .map(name => genreMap.get(name.trim().toLowerCase()))
                .filter((id): id is string => !!id) || [];
            
            let coverImages: CoverImages;
            if (rawBook.base64 && rawBook.base64.length > 50) {
              try {
                coverImages = await processImageFromBase64(rawBook.base64);
              } catch (imgError) {
                console.error(`Skipping book "${rawBook.title}" due to image processing error:`, imgError);
                continue; // Skip this book if image processing fails
              }
            } else {
              const coverLink = rawBook.coverLink || "https://placehold.co/480x720.png";
              coverImages = {
                  size250: coverLink,
                  size360: coverLink,
                  size480: coverLink,
              };
            }
            
            const bookSeries = rawBook.series && seriesSet.has(rawBook.series.toLowerCase()) ? rawBook.series : null;
            const seriesOrder = rawBook.order ? Number(rawBook.order) : null;


            booksToImport.push({
                id: generateId(),
                title: rawBook.title,
                authorId: authorId,
                publicationDate: parseDate(rawBook.date),
                youtubeLinks: rawBook.youtubeLinks?.split('|').filter(Boolean).map(url => ({ url, chapters: '' })) || [],
                amazonLink: rawBook.amazonLink || "",
                shortDescription: "Sách được import từ file JSON.",
                longDescription: "",
                coverImages: coverImages,
                series: bookSeries,
                seriesOrder: seriesOrder,
                genreIds: genreIds,
            });
          }
        }
        
        setSkippedBookCount(validationResult.data.length - booksToImport.length);
        setPreviewBooks(booksToImport);
        setStep('preview');
        setError(null);
      } catch (err) {
        console.log(err);
        setError("Không thể đọc hoặc phân tích tệp JSON. Vui lòng đảm bảo tệp không bị lỗi.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
       setError("Đã xảy ra lỗi khi đọc tệp.");
       setIsLoading(false);
    }
    reader.readAsText(selectedFile);
  };
  
  const handleBulkTextValidation = () => {
    if (!bulkText.trim()) {
      setError("Vui lòng nhập danh sách.");
      return;
    }
    setIsLoading(true);
    
    const items = bulkText.split('\n').map(item => item.trim().replace(/^"|"$/g, '').trim()).filter(Boolean);
    let existingItemsSet: Set<string>;

    switch(importType) {
        case 'authors':
            existingItemsSet = new Set(existingAuthors.map(a => a.name.toLowerCase()));
            break;
        case 'genres':
            existingItemsSet = new Set(existingGenres.map(g => g.name.toLowerCase()));
            break;
        case 'series':
             existingItemsSet = new Set(existingSeries.map(s => s.name.toLowerCase()));
            break;
        default:
            existingItemsSet = new Set();
    }
    
    const newItems = items.filter(item => !existingItemsSet.has(item.toLowerCase()));
    
    setSkippedItemCount(items.length - newItems.length);
    setPreviewItems(newItems);
    setStep('preview');
    setError(null);
    setIsLoading(false);
  }

  const handleConfirmImport = () => {
    switch(importType) {
        case 'books':
            onBooksImported(previewBooks);
            break;
        case 'authors':
            onAuthorsImported(previewItems);
            break;
        case 'genres':
            onGenresImported(previewItems);
            break;
        case 'series':
            onSeriesImported(previewItems);
            break;
    }
    onFinished();
  };

  const getAuthorName = (authorId: string) => existingAuthors.find(a => a.id === authorId)?.name || <span className="text-destructive">Không tìm thấy</span>;
  
  const renderBookImport = () => (
    <>
      <Alert>
        <Code className="h-4 w-4" />
        <AlertTitle>Định dạng yêu cầu</AlertTitle>
        <AlertDescription>
          Tệp JSON của bạn phải là một mảng (array) các đối tượng sách. Mỗi sách phải có các trường `title`, `author`, `date`. Các trường khác (`base64`, `coverLink`, etc.) là tùy chọn.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <label htmlFor="json-upload" className="text-sm font-medium">Chọn tệp JSON</label>
        <Input
          id="json-upload"
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="pt-2 h-11"
        />
      </div>
    </>
  );

  const renderBulkAdd = () => (
    <>
      <Alert>
        <Pilcrow className="h-4 w-4" />
        <AlertTitle>Hướng dẫn</AlertTitle>
        <AlertDescription>
          Dán danh sách của bạn vào ô bên dưới. Đảm bảo mỗi mục nằm trên một dòng riêng biệt. Hệ thống sẽ tự động bỏ qua các mục đã tồn tại.
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label htmlFor="bulk-add">Danh sách {importType}</Label>
        <Textarea 
            id="bulk-add"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            placeholder={`Tên tác giả 1\nTên tác giả 2\nTên tác giả 3...`}
        />
      </div>
    </>
  )

  const renderSelectStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="import-type">Chọn loại dữ liệu để import</Label>
        <Select value={importType} onValueChange={(value) => { setImportType(value as ImportType); resetState(); }}>
            <SelectTrigger id="import-type">
                <SelectValue placeholder="Chọn loại dữ liệu..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="books">Sách (từ file JSON)</SelectItem>
                <SelectItem value="authors">Tác giả (hàng loạt)</SelectItem>
                <SelectItem value="genres">Thể loại (hàng loạt)</SelectItem>
                <SelectItem value="series">Series (hàng loạt)</SelectItem>
            </SelectContent>
        </Select>
      </div>
      
      {importType === 'books' ? renderBookImport() : renderBulkAdd()}
      
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onFinished}>
          Hủy
        </Button>
        <Button type="button" onClick={handleParseAndValidate} disabled={isLoading || (importType === 'books' && !selectedFile) || (importType !== 'books' && !bulkText)}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
          Kiểm tra dữ liệu
        </Button>
      </div>
    </div>
  );

  const renderBookPreview = () => (
    <>
     {previewBooks.length > 0 && (
         <ScrollArea className="h-72 w-full rounded-md border">
            <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                    <TableRow>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Tác giả</TableHead>
                        <TableHead>Series</TableHead>
                        <TableHead>Ngày XB</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {previewBooks.map((book, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{book.title}</TableCell>
                            <TableCell>{getAuthorName(book.authorId)}</TableCell>
                            <TableCell>{book.series ? `${book.series} #${book.seriesOrder}` : 'N/A'}</TableCell>
                            <TableCell>{new Date(book.publicationDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
      )}
    </>
  );
  
  const renderItemPreview = () => (
    <>
     {previewItems.length > 0 && (
         <ScrollArea className="h-72 w-full rounded-md border">
            <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                    <TableRow>
                        <TableHead>Tên sẽ được thêm</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {previewItems.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{item}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
      )}
    </>
  );

  const renderPreviewStep = () => {
    const isBookImport = importType === 'books';
    const hasItemsToImport = isBookImport ? previewBooks.length > 0 : previewItems.length > 0;
    const skippedCount = isBookImport ? skippedBookCount : skippedItemCount;
    const itemsFound = isBookImport ? previewBooks.length : previewItems.length;

    return (
     <div className="space-y-4">
      <Alert variant={hasItemsToImport ? "default" : "destructive"}>
        <ListChecks className="h-4 w-4" />
        <AlertTitle>Xem trước kết quả Import</AlertTitle>
        <AlertDescription>
          {hasItemsToImport ? `Tìm thấy ${itemsFound} mục hợp lệ để thêm.` : `Không có mục nào hợp lệ để thêm.`}
          {skippedCount > 0 && ` Đã bỏ qua ${skippedCount} mục do bị trùng lặp hoặc không tìm thấy tác giả.`}
        </AlertDescription>
      </Alert>
      
      {isBookImport ? renderBookPreview() : renderItemPreview()}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={resetState}>
          Quay lại
        </Button>
        <Button type="button" onClick={handleConfirmImport} disabled={!hasItemsToImport}>
          <FileJson className="mr-2 h-4 w-4" />
          Xác nhận Import
        </Button>
      </div>
    </div>
    )
  };

  return step === 'select' ? renderSelectStep() : renderPreviewStep();
}
