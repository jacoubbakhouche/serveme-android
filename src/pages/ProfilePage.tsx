import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProviderPortfolio from '@/components/ProviderPortfolio';
import ProfileHeader from '@/components/ProfileHeader';
import UserProfileCard from '@/components/UserProfileCard';
import ProviderStatusCard from '@/components/ProviderStatusCard';
import UserServicesCard from '@/components/UserServicesCard';
import { Link, useNavigate } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import ContactSupportButton from '@/components/ContactSupportButton';

type ProfileDataType = {
  full_name: string;
  phone: string;
  location: string;
  provider_category: string;
  is_provider: boolean;
  specialties: string[];
  avatar_url: string;
  description: string;
};

const ProfilePage = () => {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileDataType>({
    full_name: '',
    phone: '',
    location: '',
    provider_category: '', // تم التغيير إلى قيمة افتراضية فارغة
    is_provider: false,
    specialties: [],
    avatar_url: '',
    description: '',
  });

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        provider_category: profile.provider_category || '',
        is_provider: profile.is_provider || false,
        specialties: profile.specialties || [],
        avatar_url: profile.avatar_url || '',
        description: profile.description || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: Partial<ProfileDataType & { is_provider?: boolean }>) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      if (variables.is_provider !== undefined) {
        toast({ title: variables.is_provider ? "تم تفعيل حساب مزود الخدمة" : "تم إلغاء تفعيل حساب مزود الخدمة" });
      } else {
        toast({ title: "تم الحفظ", description: "تم حفظ التغييرات بنجاح" });
        setIsEditing(false);
      }
    },
    onError: (error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveProfile = async (updatedData: Partial<ProfileDataType>, avatarFile: File | null) => {
    if (!user || !profile) return;

    // تم تغيير الشرط هنا ليعكس حالة المستخدم الحالية بدلاً من حالته القديمة
    if (profileData.is_provider || (isEditing && profile?.is_provider)) {
      const description = updatedData.description ?? profileData.description;
      const category = updatedData.provider_category ?? profileData.provider_category;
      
      if (!description?.trim() || !category) {
        toast({
          title: "بيانات غير مكتملة",
          description: "يجب ملء حقلي الوصف وفئة الخدمة.",
          variant: "destructive",
        });
        return; 
      }
    }

    let dataToSubmit: Partial<ProfileDataType> = {
      full_name: updatedData.full_name ?? profileData.full_name,
      phone: updatedData.phone ?? profileData.phone,
      location: updatedData.location ?? profileData.location,
      provider_category: updatedData.provider_category ?? profileData.provider_category,
      description: updatedData.description ?? profileData.description,
    };

    if (avatarFile) {
      try {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const bucketName = 'avatars';
        const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        dataToSubmit.avatar_url = publicUrlData.publicUrl;
      } catch (err: any) {
        toast({ title: "خطأ", description: "حدث خطأ أثناء رفع الصورة: " + err.message, variant: "destructive" });
        return;
      }
    }

    const { is_provider, ...dataToUpdate } = dataToSubmit;
    updateProfileMutation.mutate(dataToUpdate);
};


  // ✅ ==================== هذا هو الجزء الذي تم تعديله بالكامل ==================== ✅
  const toggleProviderStatus = (checked: boolean) => {
    // إذا كان المستخدم يحاول إلغاء التفعيل، اسمح له بذلك مباشرة
    if (!checked) {
      setProfileData(prev => ({ ...prev, is_provider: false }));
      updateProfileMutation.mutate({ is_provider: false });
      return;
    }

    // إذا كان المستخدم يحاول التفعيل...
    const isProfileComplete = profileData.description?.trim() && profileData.provider_category;

    if (isProfileComplete) {
      // إذا كان الملف الشخصي مكتملاً، قم بالتفعيل مباشرة
      setProfileData(prev => ({ ...prev, is_provider: true }));
      updateProfileMutation.mutate({ is_provider: true });
    } else {
      // إذا كان الملف الشخصي غير مكتمل، قم بتفعيل وضع التعديل وأظهر رسالة
      setIsEditing(true); // <-- هذا هو المنطق الجديد!
      toast({
        title: "أكمل ملفك الشخصي أولاً",
        description: "لتفعيل حسابك كمزود، يرجى ملء حقلي الوصف والفئة ثم اضغط حفظ.",
        variant: "default",
      });
    }
  };
  // ✅ ============================== نهاية التعديل ============================== ✅


  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>حدث خطأ: {error.message}</div>;

  return (
    <div className="space-y-6 container mx-auto p-4 pb-24">
      <ProfileHeader />

      {isAdmin && (
        <div className="flex items-center gap-4 mb-6 p-4 dark-card rounded-lg">
          <Link to="/admin" className="inline-block px-5 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200">
            لوحة تحكم المشرف
          </Link>
          <Link to="/admin/ads" className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors duration-200">
            <Megaphone className="h-4 w-4" />
            إدارة الإعلانات
          </Link>
        </div>
      )}

      <UserProfileCard
        initialProfileData={profileData}
        onSave={handleSaveProfile}
        isSaving={updateProfileMutation.isPending}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        isProvider={profileData.is_provider}
      />

      <div className="max-w-md mx-auto pt-4">
        <ContactSupportButton />
      </div>

      <ProviderStatusCard
        isProvider={profileData.is_provider}
        onToggleProviderStatus={toggleProviderStatus}
        providerCategory={profileData.provider_category}
        specialties={profileData.specialties}
        rating={profile?.rating || 0}
        reviewCount={profile?.review_count || 0}
        isUpdating={updateProfileMutation.isPending}
      />

      {profileData.is_provider && <ProviderPortfolio />}
      <UserServicesCard />
    </div>
  );
};

export default ProfilePage;
