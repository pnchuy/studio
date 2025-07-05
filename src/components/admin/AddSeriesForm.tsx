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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Tên series phải có ít nhất 2 ký tự." }),
});

interface AddSeriesFormProps {
    series: string[];
    onSeriesAdded: (seriesName: string) => void;
    onFinished: () => void;
}

export function AddSeriesForm({ series, onSeriesAdded, onFinished }: AddSeriesFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  const nameValue = form.watch("name");

  const { setError, clearErrors, formState } = form;
  useEffect(() => {
    if (nameValue && formState.isDirty) {
        const isDuplicate = series.some(
            (seriesName) => seriesName.toLowerCase() === nameValue.toLowerCase()
        );
        if (isDuplicate) {
            setError("name", { type: "manual", message: "Series này đã tồn tại." });
        } else {
            clearErrors("name");
        }
    }
  }, [nameValue, series, setError, clearErrors, formState]);

  const filteredSuggestions = series.filter(seriesName => 
    seriesName.toLowerCase().includes(nameValue.toLowerCase()) && 
    nameValue.length > 0 &&
    seriesName.toLowerCase() !== nameValue.toLowerCase()
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    const isDuplicate = series.some(
      (seriesName) => seriesName.toLowerCase() === values.name.toLowerCase()
    );

    if (isDuplicate) {
      form.setError("name", { type: "manual", message: "Series này đã tồn tại." });
      return;
    }

    onSeriesAdded(values.name);
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
              <FormLabel>Tên Series</FormLabel>
              <Popover open={filteredSuggestions.length > 0 && form.formState.isDirty}>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Input placeholder="The Stormlight Archive" {...field} autoComplete="off" type="text" />
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div className="max-h-60 overflow-y-auto">
                    {filteredSuggestions.map((seriesName) => (
                        <Button
                        key={seriesName}
                        type="button"
                        variant="ghost"
                        className="w-full justify-start rounded-md"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionClick(seriesName);
                        }}
                        >
                        {seriesName}
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
            <Button type="submit">Thêm Series</Button>
        </div>
      </form>
    </Form>
  );
}
