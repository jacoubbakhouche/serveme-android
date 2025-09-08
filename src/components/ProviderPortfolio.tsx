
import React, { useState } from 'react';   
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from './LoadingSpinner';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

const ProviderPortfolio = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  const { data: portfolioItems, isLoading } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('provider_portfolios')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, description }: { file: File; description: string }) => {
      if (!user) throw new Error('User not authenticated.');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from('provider_portfolios')
        .insert({
          provider_id: user.id,
          image_url: imageUrl,
          description: description,
        });

      if (dbError) {
        await supabase.storage.from('portfolio-images').remove([filePath]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', user?.id] });
      toast({ title: "تم رفع الصورة بنجاح!" });
      setFileToUpload(null);
      setDescription('');
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: Tables<'provider_portfolios'>) => {
      if (!user) throw new Error('User not authenticated.');

      const imagePath = item.image_url.substring(item.image_url.indexOf('/portfolio-images/') + 19);

      if(imagePath) {
        const { error: storageError } = await supabase.storage
          .from('portfolio-images')
          .remove([imagePath]);
        
        if (storageError) {
            console.error("Storage deletion error, proceeding with DB deletion:", storageError);
        }
      }
      
      const { error: dbError } = await supabase
        .from('provider_portfolios')
        .delete()
        .eq('id', item.id);
        
      if (dbError) throw new Error(dbError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', user?.id] });
      toast({ title: "تم حذف الصورة بنجاح." });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: 'destructive' });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (fileToUpload) {
      uploadMutation.mutate({ file: fileToUpload, description });
    } else {
        toast({ title: "الرجاء اختيار صورة أولاً", variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            معرض أعمالي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h2 className="font-semibold">ايضافة صور لملفك  المزود الخدمات </h2>

</div>





          
          
     <div className="grid gap-4 sm:grid-cols-2">
    {/* --- بداية التعديل --- */}

    {/* 1. حقل اختيار الملف الأصلي، الآن مخفي ولكنه لا يزال يعمل في الخلفية */}
    <Input
        id="custom-file-upload" // أضفنا ID لربطه بالـ label
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden" // هذا يخفي الحقل الأصلي
    />

    {/* 2. هذا هو الزر الجديد الذي يراه المستخدم. إنه label مصمم ليبدو كزر */}
    <label
        htmlFor="custom-file-upload" // هذا يربط الـ label بحقل الإدخال المخفي أعلاه
        className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md text-sm font-medium cursor-pointer sm:col-span-2"
    >
        <ImagePlus className="h-4 w-4" />
        <span>اختيار صورة...</span>
    </label>
    
    {/* --- نهاية التعديل --- */}

    <Input
        placeholder="وصف العمل (اختياري)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="sm:col-span-2"
    />
</div>
<Button onClick={handleUpload} disabled={uploadMutation.isPending || !fileToUpload}>
    {uploadMutation.isPending ? 'جاري الرفع...' : 'رفع الصورة الآن'}
</Button>





          




        

        {isLoading ? <div className="flex justify-center"><LoadingSpinner /></div> : (
            portfolioItems && portfolioItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {portfolioItems.map(item => (
                        <div key={item.id} className="relative group aspect-square">
                            <img src={item.image_url} alt={item.description || 'Portfolio item'} className="w-full h-full object-cover rounded-lg"/>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between items-start p-2 rounded-lg">
                                <p className="text-white text-xs line-clamp-3">{item.description}</p>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="self-end !h-8 !w-8"
                                    onClick={() => deleteMutation.mutate(item)}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">لم تقم بإضافة أي أعمال إلى معرضك بعد.</p>
            )
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderPortfolio;   
