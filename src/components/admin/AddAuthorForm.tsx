
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Tên tác giả phải có ít nhất 2 ký tự." }),
});

interface AddAuthorFormProps {
    authors: Author[];
    onAuthorAdded: (author: Author) => void;
    onFinished: () => void;
}

export function AddAuthorForm({ authors, onAuthorAdded, onFinished }: AddAuthorFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange"
  });

  const nameValue = form.watch("name");

  useEffect(() => {
    if (nameValue && form.formState.isDirty) {
        const isDuplicate = authors.some(
            (author) => author.name.toLowerCase() === nameValue.toLowerCase()
        );
        if (isDuplicate) {
            form.setError("name", { type: "manual", message: "Tác giả này đã tồn tại." });
        } else {
            form.clearErrors("name");
        }
    }
  }, [nameValue, authors, form]);

  const filteredSuggestions = authors.filter(author => 
    author.name.toLowerCase().includes(nameValue.toLowerCase()) && 
    nameValue.length > 0 &&
    author.name.toLowerCase() !== nameValue.toLowerCase()
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    const isDuplicate = authors.some(
      (author) => author.name.toLowerCase() === values.name.toLowerCase()
    );

    if (isDuplicate) {
        form.setError("name", { type: "manual", message: "Tác giả này đã tồn tại." });
        return; 
    }
    
    const newAuthor: Author = {
        id: `author-${generateId()}`, 
        ...values,
    };
    onAuthorAdded(newAuthor);
    onFinished();
  }
  
  const handleSuggestionClick = (name: string) => {
    form.setValue("name", name, { shouldValidate: true });
    form.clearErrors("name");
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
              <Popover open={filteredSuggestions.length > 0 && form.formState.isDirty}>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Input placeholder="Brandon Sanderson" {...field} autoComplete="off" />
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div className="max-h-60 overflow-y-auto">
                    {filteredSuggestions.map((author) => (
                        <Button
                        key={author.id}
                        type="button"
                        variant="ghost"
                        className="w-full justify-start rounded-md"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionClick(author.name);
                        }}
                        >
                        {author.name}
                        </Button>
                    ))}
                    </div>
                </PopoverContent>
              </Popover>
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
