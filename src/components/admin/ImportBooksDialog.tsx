
"use client";

import { useState } from "react";
import { z } from "zod";
import type { Book, Author } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Code, FileJson, FileUp, ListChecks, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// Schema for the books in the JSON file
const importBookSchema = z.object({
  title: z.string().min(2, "Tiêu đề phải có ít nhất 2 ký tự."),
  authorId: z.string().min(1, "ID tác giả là bắt buộc."),
  publicationDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Ngày xuất bản không hợp lệ.",
  }),
  youtubeLink: z.array(z.string().url()).optional().default([]),
  amazonLink: z.string().url().or(z.literal("")).optional().default(""),
  summary: z.string().optional().default("Sách được import từ file JSON."),
  coverImage: z.string().url().optional().default("https://placehold.co/400x600.png"),
  series: z.string().nullable().optional().default(null),
  genreIds: z.array(z.string()).optional().default([]),
});

// The file itself must be an array of these book objects
const importFileSchema = z.array(importBookSchema);

type ImportBook = z.infer<typeof importBookSchema>;

interface ImportBooksDialogProps {
  existingBooks: Book[];
  existingAuthors: Author[];
  onBooksImported: (books: (Omit<Book, 'id'>)[]) => void;
  onFinished: () => void;
}

export function ImportBooksDialog({ existingBooks, existingAuthors, onBooksImported, onFinished }: ImportBooksDialogProps) {
  const [step, setStep] = useState<'select' | 'preview'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewBooks, setPreviewBooks] = useState<ImportBook[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!selectedFile) {
      setError("Vui lòng chọn một tệp để import.");
      return;
    }
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        
        // 1. Validate file structure with Zod
        const validationResult = importFileSchema.safeParse(jsonData);
        if (!validationResult.success) {
          const firstError = validationResult.error.issues[0];
          setError(`Cấu trúc file JSON không hợp lệ. Lỗi tại [sách ${firstError.path[0]}]: ${firstError.message}`);
          setIsLoading(false);
          return;
        }

        // 2. Perform custom per-book validation
        const existingTitles = new Set(existingBooks.map(b => b.title.toLowerCase()));
        const existingAuthorIds = new Set(existingAuthors.map(a => a.id));
        const booksToImport: ImportBook[] = [];

        for (const book of validationResult.data) {
          const isTitleDuplicate = existingTitles.has(book.title.toLowerCase());
          const isAuthorValid = existingAuthorIds.has(book.authorId);
          
          if (!isTitleDuplicate && isAuthorValid) {
            booksToImport.push(book);
          }
        }
        
        setSkippedCount(validationResult.data.length - booksToImport.length);
        setPreviewBooks(booksToImport);
        setStep('preview');
        setError(null);
      } catch (err) {
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
  
  const handleConfirmImport = () => {
    const newBooks: (Omit<Book, 'id'>)[] = previewBooks.map(p => ({
        ...p,
        seriesOrder: p.series ? 1 : null, // Basic series order
    }));

    onBooksImported(newBooks);
    onFinished();
  };

  const getAuthorName = (authorId: string) => existingAuthors.find(a => a.id === authorId)?.name || <span className="text-destructive">Không tìm thấy</span>;

  const renderSelectStep = () => (
    <div className="space-y-4">
      <Alert>
        <Code className="h-4 w-4" />
        <AlertTitle>Định dạng yêu cầu</AlertTitle>
        <AlertDescription>
          Tệp JSON của bạn phải là một mảng (array) các đối tượng sách. Mỗi sách phải có các trường `title`, `authorId`, `publicationDate`.
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
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onFinished}>
          Hủy
        </Button>
        <Button type="button" onClick={handleParseAndValidate} disabled={!selectedFile || isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
          Kiểm tra file
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
     <div className="space-y-4">
      <Alert variant={previewBooks.length > 0 ? "default" : "destructive"}>
        <ListChecks className="h-4 w-4" />
        <AlertTitle>Xem trước kết quả Import</AlertTitle>
        <AlertDescription>
          {previewBooks.length > 0 ? `Tìm thấy ${previewBooks.length} sách hợp lệ để thêm.` : `Không có sách nào hợp lệ để thêm.`}
          {skippedCount > 0 && ` Đã bỏ qua ${skippedCount} sách do bị trùng lặp hoặc tác giả không tồn tại.`}
        </AlertDescription>
      </Alert>
      
      {previewBooks.length > 0 && (
         <ScrollArea className="h-72 w-full rounded-md border">
            <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                    <TableRow>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Tác giả</TableHead>
                        <TableHead>Ngày XB</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {previewBooks.map((book, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{book.title}</TableCell>
                            <TableCell>{getAuthorName(book.authorId)}</TableCell>
                            <TableCell>{new Date(book.publicationDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setStep('select')}>
          Quay lại
        </Button>
        <Button type="button" onClick={handleConfirmImport} disabled={previewBooks.length === 0}>
          <FileJson className="mr-2 h-4 w-4" />
          Xác nhận Import
        </Button>
      </div>
    </div>
  );

  return step === 'select' ? renderSelectStep() : renderPreviewStep();
}
