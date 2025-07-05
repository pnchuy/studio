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
import type { Genre } from "@/types";
import { generateId } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Tên thể loại phải có ít nhất 2 ký tự." }),
});

interface AddGenreFormProps {
    genres: Genre[];
    onGenreAdded: (genre: Genre) => void;
    onFinished: () => void;
}

export function AddGenreForm({ genres, onGenreAdded, onFinished }: AddGenreFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  const nameValue = form.watch("name");

  const { setError, clearErrors, formState: { isDirty } } = form;
  useEffect(() => {
    if (nameValue && isDirty) {
        const isDuplicate = genres.some(
            (genre) => genre.name.toLowerCase() === nameValue.toLowerCase()
        );
        if (isDuplicate) {
            setError("name", { type: "manual", message: "Thể loại này đã tồn tại." });
        } else {
            clearErrors("name");
        }
    }
  }, [nameValue, genres, setError, clearErrors, isDirty]);

  const filteredSuggestions = genres.filter(genre => 
    genre.name.toLowerCase().includes(nameValue.toLowerCase()) && 
    nameValue.length > 0 &&
    genre.name.toLowerCase() !== nameValue.toLowerCase()
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    const isDuplicate = genres.some(
      (genre) => genre.name.toLowerCase() === values.name.toLowerCase()
    );

    if (isDuplicate) {
      form.setError("name", { type: "manual", message: "Thể loại này đã tồn tại." });
      return; 
    }

    const newGenre: Genre = {
        id: `genre-${generateId()}`, 
        ...values,
    };
    onGenreAdded(newGenre);
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
              <FormLabel>Tên thể loại</FormLabel>
               <Popover open={filteredSuggestions.length > 0 && isDirty}>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Input placeholder="Epic Fantasy" {...field} autoComplete="off" type="text" />
                    </FormControl>
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
                            handleSuggestionClick(genre.name);
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
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished}>Hủy</Button>
            <Button type="submit">Thêm thể loại</Button>
        </div>
      </form>
    </Form>
  );
}
