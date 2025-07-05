
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
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Tên series phải có ít nhất 2 ký tự." }),
});

interface AddSeriesFormProps {
    series: string[];
    onSeriesAdded: (seriesName: string) => void;
    onFinished: () => void;
}

export function AddSeriesForm({ series, onSeriesAdded, onFinished }: AddSeriesFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const isDuplicate = series.some(
      (seriesName) => seriesName.toLowerCase() === values.name.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Series đã tồn tại",
        description: `Một series với tên "${values.name}" đã có trong danh sách.`,
      });
      return;
    }

    onSeriesAdded(values.name);
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
            <Button type="submit">Thêm Series</Button>
        </div>
      </form>
    </Form>
  );
}
