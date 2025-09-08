// src/pages/AddServicePage.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Siren, Upload, XIcon, Terminal } from 'lucide-react'; // ✨ 1. استيراد أيقونة جديدة
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TablesInsert } from '@/integrations/supabase/types';
import { serviceCategories } from '@/constants/service-categories';
import { algerianStates } from '@/constants/algerian-states';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // ✨ 2. استيراد مكون التنبيه

const AddServicePage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    is_urgent: false,
    contact_number: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const categories = serviceCategories;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const combinedFiles = [...files, ...selectedFiles].slice(0, 5);
      setFiles(combinedFiles);

      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      const combinedPreviews = [...previews, ...newPreviews].slice(0, 5);
      setPreviews(combinedPreviews);
    }
  };

  const removeImage = (indexToRemove: number) => {
    URL.revokeObjectURL(previews[indexToRemove]);
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setPreviews(previews.filter((_, index) => index !== indexToRemove));
  };

  const addServiceMutation = useMutation({
    mutationFn: async ({ newService, serviceFiles }: { newService: Omit<TablesInsert<'services'>, 'user_id' | 'id' | 'created_at' | 'image_urls'>, serviceFiles: File[] }) => {
      if (!user) throw new Error("User not authenticated");

      let imageUrls: string[] = [];
      if (serviceFiles.length > 0) {
        const uploadPromises = serviceFiles.map(async (file) => {
          const sanitizedFileName = file.name.replace(/[^\w.-]/g, '_');
          const fileName = `${user.id}/${Date.now()}-${sanitizedFileName}`;
          const { data, error } = await supabase.storage
            .from('service-images')
            .upload(fileName, file);

          if (error) {
              console.error("Error uploading image:", error);
              throw new Error("فشل تحميل الصورة: " + error.message);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('service-images')
            .getPublicUrl(data.path);
            
          return publicUrl;
        });
        imageUrls = await Promise.all(uploadPromises);
      }
      
      const { data, error } = await supabase
        .from('services')
        .insert([{ 
          ...newService, 
          image_urls: imageUrls,
          user_id: user.id 
        }])
        .select();

      if (error) {
        throw new Error("فشل نشر الخدمة: " + error.message);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "تم النشر بنجاح",
        description: "تم نشر طلب الخدمة.",
      });

      if (data && data.length > 0) {
        const newServiceId = data[0].id;
        navigate(`/service/${newServiceId}`);
      } else {
        navigate('/home');
      }
    },
    
    onError: (error) => {
      toast({
        title: "خطأ في النشر",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.location) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    addServiceMutation.mutate({ newService: formData, serviceFiles: files });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h2 className="text-3xl font-bold gradient-text mb-2">
          اطلب خدمة جديدة
        </h2>
        <p className="text-muted-foreground">
          صف المشكلة التي تحتاج إلى حل واحصل على المساعدة فوراً
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            تفاصيل الخدمة المطلوبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الطلب *</Label>
              <Input
                id="title"
                placeholder="مثال: تصليح مكيف الهواء"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">وصف تفصيلي للمشكلة *</Label>
              <Textarea
                id="description"
                placeholder="صف المشكلة بالتفصيل والحلول المطلوبة..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>نوع الخدمة *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>الولاية *</Label>
              <Select 
                value={formData.location} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الولاية" />
                </SelectTrigger>
                <SelectContent>
                  {algerianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Number */}
            <div className="space-y-2">
              <Label htmlFor="contact">رقم الهاتف</Label>
              <Input
                id="contact"
                placeholder="0555123456"
                value={formData.contact_number}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>صور توضيحية (اختياري، 5 كحد أقصى)</Label>
              <div className="p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary transition-colors">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">اسحب وأفلت الصور هنا أو انقر للتحميل</span>
                  </div>
                </label>
                <Input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={files.length >= 5}
                />
              </div>
              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={preview} alt={`preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Urgent Switch */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Siren className="w-5 h-5 text-destructive" />
                <div>
                  <Label htmlFor="urgent" className="font-medium">
                    طلب عاجل
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    سيتم إعطاء أولوية أعلى لطلبك
                  </p>
                </div>
              </div>
              <Switch
                id="urgent"
                checked={formData.is_urgent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_urgent: checked }))}
              />
            </div>




            

            
            
           {/* السطر الجديد الذي يزيل الفراغ */}
<Alert className="bg-card border-yellow-500/50 text-yellow-500">







  
              
              <Terminal className="h-4 w-4" />
              <AlertTitle className="text-yellow-400">ملاحظة هامة</AlertTitle>
              <AlertDescription>
                سيتم حذف منشور الخدمة تلقائيًا بعد مرور 10 أيام من تاريخ النشر.
              </AlertDescription>
            </Alert>
            
            <Button type="submit" className="w-full btn-gradient" disabled={addServiceMutation.isPending}>
              {addServiceMutation.isPending ? 'جاري النشر...' : 'نشر الطلب'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddServicePage;
