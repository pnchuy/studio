
"use client";

import { useState } from "react";
import { z } from "zod";
import type { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Code, FileJson } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  authorId: z.string(),
  publicationDate: z.string(),
  coverImage: z.string(),
  summary: z.string(),
  series: z.string().nullable(),
  genreIds: z.array(z.string()),
  youtubeLink: z.array(z.string()),
  amazonLink: z.string(),
});

const booksArraySchema = z.array(bookSchema);

interface ImportBooksDialogProps {
  onBooksImported: (books: Book[]) => void;
  onFinished: () => void;
}

export function ImportBooksDialog({ onBooksImported, onFinished }: ImportBooksDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleImport = () => {
    if (!selectedFile) {
      setError("Vui lòng chọn một tệp để import.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        const validationResult = booksArraySchema.safeParse(jsonData);

        if (!validationResult.success) {
          console.error("Validation Error:", validationResult.error.flatten());
          setError(`Cấu trúc file JSON không hợp lệ. Vui lòng kiểm tra lại. Lỗi: ${validationResult.error.issues[0].message} tại đường dẫn ${validationResult.error.issues[0].path.join('.')}`);
          return;
        }

        onBooksImported(validationResult.data);
        onFinished();
      } catch (err) {
        console.error("Parsing Error:", err);
        setError("Không thể đọc hoặc phân tích tệp JSON. Vui lòng đảm bảo tệp không bị lỗi.");
        toast({
          variant: "destructive",
          title: "Lỗi Import",
          description: "Có lỗi xảy ra khi đọc tệp JSON."
        })
      }
    };
    reader.onerror = () => {
       setError("Đã xảy ra lỗi khi đọc tệp.");
    }

    reader.readAsText(selectedFile);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Code className="h-4 w-4" />
        <AlertTitle>Định dạng yêu cầu</AlertTitle>
        <AlertDescription>
          Tệp JSON của bạn phải là một mảng (array) các đối tượng sách. Mỗi đối tượng phải tuân theo cấu trúc dữ liệu của ứng dụng.
          Hãy chắc chắn rằng `authorId` và `genreIds` tương ứng với các ID đã có trong hệ thống.
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
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onFinished}>
          Hủy
        </Button>
        <Button type="button" onClick={handleImport} disabled={!selectedFile}>
          <FileJson className="mr-2 h-4 w-4" />
          Import
        </Button>
      </div>
    </div>
  );
}
