
"use client";

import { useState, useEffect }from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { storage, db, isFirebaseConfigured } from "@/lib/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";

const LOGO_STORAGE_PATH = 'system/logo.png';
const SETTINGS_DOC_PATH = 'system/settings';


export function SystemManagement() {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentLogo = async () => {
        if (!isFirebaseConfigured || !db) {
            setIsLoading(false);
            return;
        }
        try {
            const settingsDocRef = doc(db, SETTINGS_DOC_PATH);
            const docSnap = await getDoc(settingsDocRef);
            if (docSnap.exists() && docSnap.data().logoUrl) {
                setLogoPreview(docSnap.data().logoUrl);
            }
        } catch (error) {
            console.error("Error fetching current logo:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchCurrentLogo();
  }, []);


  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Tệp không hợp lệ',
          description: 'Vui lòng chọn một tệp hình ảnh (PNG, JPG, SVG).',
        });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveChanges = async () => {
    if (!logoFile || !logoPreview) {
       toast({
        title: "Chưa có thay đổi",
        description: "Vui lòng chọn một tệp logo để thay đổi.",
      });
      return;
    }
    if (!isFirebaseConfigured || !storage || !db) {
        toast({ variant: 'destructive', title: 'Firebase chưa được cấu hình', description: 'Không thể tải lên logo.' });
        return;
    }

    setIsUploading(true);
    try {
        // Upload file to Firebase Storage
        const storageRef = ref(storage, LOGO_STORAGE_PATH);
        await uploadString(storageRef, logoPreview, 'data_url');
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Save URL to Firestore
        const settingsDocRef = doc(db, SETTINGS_DOC_PATH);
        await setDoc(settingsDocRef, { logoUrl: downloadURL }, { merge: true });

        toast({
          title: "Thành công",
          description: "Logo đã được cập nhật. Có thể mất vài phút để thay đổi được áp dụng trên toàn trang.",
        });

    } catch (error) {
         toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể lưu logo. Vui lòng thử lại.",
        });
        console.error("Error uploading logo:", error);
    } finally {
        setIsUploading(false);
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
            Tải lên logo mới cho trang web của bạn. Logo sẽ được hiển thị cho tất cả người dùng.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Tệp logo</Label>
            <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoFileChange} disabled={isUploading}/>
          </div>
           {logoPreview && (
            <div className="mt-4">
              <Label>Xem trước</Label>
              <div className="mt-2 w-32 h-16 relative bg-muted rounded-md flex items-center justify-center p-2 border">
                  <Image src={logoPreview} alt="Logo preview" layout="fill" objectFit="contain" />
              </div>
            </div>
          )}
          <Button onClick={handleSaveChanges} disabled={isUploading || isLoading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
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
