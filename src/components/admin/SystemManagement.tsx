
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const LOGO_STORAGE_KEY = 'bibliophile-logo';

export function SystemManagement() {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveChanges = () => {
    if (logoPreview) {
      try {
        localStorage.setItem(LOGO_STORAGE_KEY, logoPreview);
        toast({
          title: "Thành công",
          description: "Logo đã được cập nhật. Tải lại trang để thấy thay đổi.",
        });
      } catch (error) {
         toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể lưu logo.",
        });
      }
    } else {
       toast({
        title: "Chưa có thay đổi",
        description: "Vui lòng chọn một tệp logo để thay đổi.",
      });
    }
  };
  
  const handleIntegrationSave = () => {
    toast({
      title: "Chức năng đang được phát triển",
      description: "Tính năng này sẽ sớm được cập nhật.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thay đổi Logo</CardTitle>
          <CardDescription>
            Tải lên logo mới cho trang web của bạn. Tệp phải có định dạng PNG, JPG hoặc SVG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Tệp logo</Label>
            <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoFileChange} />
          </div>
           {logoPreview && (
            <div className="mt-4">
              <Label>Xem trước</Label>
              <div className="mt-2 w-32 h-16 relative bg-muted rounded-md flex items-center justify-center">
                  <Image src={logoPreview} alt="Logo preview" layout="fill" objectFit="contain" />
              </div>
            </div>
          )}
          <Button onClick={handleSaveChanges}>Lưu thay đổi</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Tích hợp công cụ</CardTitle>
          <CardDescription>
            Kết nối với các dịch vụ của bên thứ ba như Google Analytics và Google Ads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Hướng dẫn</AlertTitle>
                <AlertDescription>
                    Để tích hợp, bạn cần cung cấp ID theo dõi (tracking ID) hoặc các mã thông tin cần thiết từ dịch vụ tương ứng.
                </AlertDescription>
            </Alert>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ga-id">Google Analytics Tracking ID</Label>
              <Input id="ga-id" placeholder="UA-XXXXXXXXX-X" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="gads-id">Google Ads Conversion ID</Label>
              <Input id="gads-id" placeholder="AW-XXXXXXXXX" />
            </div>
          </div>
          <Button onClick={handleIntegrationSave}>Lưu thay đổi</Button>
        </CardContent>
      </Card>
    </div>
  );
}
