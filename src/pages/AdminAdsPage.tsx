// src/pages/AdminAdsPage.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Megaphone, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

type Ad = Database['public']['Tables']['ads']['Row'];

const AdminAdsPage = () => {
  const queryClient = useQueryClient();
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState<Partial<Ad> | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const { user, isAdmin, loading: authLoading } = useAuth();

  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isAdmin,
  });

  const adMutation = useMutation({
    mutationFn: async (adData: Partial<Ad>) => {
      if (!user) throw new Error("User not authenticated");

      const { id, ...rest } = adData;

      if (id) {
        const { error } = await supabase.from('ads').update(rest).eq('id', id);
        if (error) throw new Error(error.message);
      } else {
        const dataToInsert = { ...rest, user_id: user.id };
        console.log("🔍 البيانات التي يتم إرسالها إلى قاعدة البيانات:", dataToInsert);
        const { error } = await supabase.from('ads').insert(dataToInsert);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast({ title: "نجاح", description: "تم حفظ الإعلان بنجاح." });
      setIsAdModalOpen(false);
      setCurrentAd(null);
      setFileToUpload(null);
    },
    onError: (error) => {
      toast({ title: "خطأ في الرفع", description: error.message, variant: "destructive" });
    }
  });

  // ✨ إضافة منطق حذف الإعلان
  const deleteAdMutation = useMutation({
    mutationFn: async (adId: number) => {
      const { error } = await supabase.from('ads').delete().eq('id', adId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast({ title: "نجاح", description: "تم حذف الإعلان بنجاح." });
    },
    onError: (error) => {
      toast({ title: "خطأ في الحذف", description: error.message, variant: "destructive" });
    },
  });

  // ✨ إضافة منطق تغيير حالة الإعلان
  const toggleAdStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean; }) => {
      const { error } = await supabase.from('ads').update({ is_active }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast({ title: "نجاح", description: "تم تحديث حالة الإعلان." });
    },
    onError: (error) => {
      toast({ title: "خطأ في التحديث", description: error.message, variant: "destructive" });
    },
  });


  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAd) return;
    let finalMediaUrl = currentAd.media_url;
    if (fileToUpload) {
      toast({ description: "جاري رفع الملف..." });
      const fileName = `${Date.now()}_${fileToUpload.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('ad_media').upload(fileName, fileToUpload, { upsert: true });
      if (uploadError) {
        toast({ title: "خطأ في الرفع", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = supabase.storage.from('ad_media').getPublicUrl(uploadData.path);
      finalMediaUrl = urlData.publicUrl;
    }
    if (!finalMediaUrl && !currentAd.id) {
      toast({ title: "خطأ", description: "الرجاء رفع ملف صورة أو فيديو.", variant: "destructive" });
      return;
    }
    const finalAdData = { ...currentAd };
    if (finalMediaUrl) {
      finalAdData.media_url = finalMediaUrl;
    }
    adMutation.mutate(finalAdData);
  };

  const openAdModal = (ad: Partial<Ad> | null = null) => {
    setCurrentAd(ad || { title: '', media_type: 'image', media_url: '', target_url: '', is_active: true });
    setFileToUpload(null);
    setIsAdModalOpen(true);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold mb-4">وصول مرفوض</h1>
      <p className="text-muted-foreground mb-6">ليس لديك الصلاحيات اللازمة لعرض هذه الصفحة.</p>
      <Button asChild><Link to="/">العودة للصفحة الرئيسية</Link></Button>
    </div>
  );

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Megaphone className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">إدارة الإعلانات</h1>
          </div>
          <Button onClick={() => openAdModal()} className="flex items-center gap-2 btn-gradient">
            <PlusCircle className="w-4 h-4" />
            إضافة إعلان جديد
          </Button>
        </div>

        {adsLoading ? <LoadingSpinner /> : (
          <div className="dark-card overflow-hidden">
            {ads && ads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map(ad => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>
                        <Badge variant={ad.media_type === 'image' ? 'secondary' : 'default'}>
                          {ad.media_type === 'image' ? 'صورة' : 'فيديو'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={ad.is_active}
                          onCheckedChange={(checked) => toggleAdStatusMutation.mutate({ id: ad.id, is_active: checked })}
                          disabled={toggleAdStatusMutation.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => openAdModal(ad)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => deleteAdMutation.mutate(ad.id)} disabled={deleteAdMutation.isPending}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-muted-foreground">لا توجد إعلانات حالياً.</div>
            )}
          </div>
        )}

        <Dialog open={isAdModalOpen} onOpenChange={setIsAdModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentAd?.id ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveAd} className="space-y-4 py-4">
              <div>
                <Label htmlFor="ad-title">عنوان الإعلان</Label>
                <Input id="ad-title" value={currentAd?.title || ''} onChange={(e) => setCurrentAd({ ...currentAd, title: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="ad-media-type">نوع الوسائط</Label>
                <Select
                  value={currentAd?.media_type || 'image'}
                  onValueChange={(value) => setCurrentAd({ ...currentAd, media_type: value as 'image' | 'video' })}
                >
                  <SelectTrigger id="ad-media-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">صورة</SelectItem>
                    <SelectItem value="video">فيديو</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ad-media-file">ملف الصورة/الفيديو</Label>
                <Input 
                  id="ad-media-file" 
                  type="file" 
                  accept="image/*,video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileToUpload(e.target.files[0]);
                    }
                  }}
                  required={!currentAd?.id} 
                />
                {currentAd?.media_url && !fileToUpload && (
                  <p className="text-xs text-muted-foreground mt-2">
                    الحالي: <a href={currentAd.media_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">عرض الملف</a>
                  </p>
                )}
              </div>
              <div>
                
                <Label htmlFor="ad-target-url">الرابط المستهدف (عند الضغط)</Label>


                
               
                <Input id="ad-target-url" type="url" value={currentAd?.target_url || ''} onChange={(e) => setCurrentAd({ ...currentAd, target_url: e.target.value })} />
               



                
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">إلغاء</Button></DialogClose>
                <Button type="submit" disabled={adMutation.isPending}>
                  {adMutation.isPending ? <LoadingSpinner size="sm" /> : 'حفظ الإعلان'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default AdminAdsPage; 
