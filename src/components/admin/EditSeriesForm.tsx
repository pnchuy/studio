
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
import type { Series } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, { message: "Tên series phải có ít nhất 2 ký tự." }),
});

interface EditSeriesFormProps {
    seriesToEdit: Series;
    series: Series[];
    onSeriesUpdated: (seriesId: string, newName: string) => void;
    onFinished: () => void;
}

export function EditSeriesForm({ seriesToEdit, series, onSeriesUpdated, onFinished }: EditSeriesFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: seriesToEdit.name,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const isDuplicate = series.some(
        (s) => s.name.toLowerCase() === values.name.toLowerCase() && s.id !== seriesToEdit.id
    );

    if (isDuplicate) {
        form.setError("name", { type: "manual", message: "Tên series này đã tồn tại." });
        return;
    }

    onSeriesUpdated(seriesToEdit.id, values.name);
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên Series</FormLabel>
              <FormControl>
                <Input placeholder="The Stormlight Archive" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished}>Hủy</Button>
            <Button type="submit">Cập nhật Series</Button>
        </div>
      </form>
    </Form>
  );
}
