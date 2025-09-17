// src/pages/CompleteProfilePage.tsx

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { algerianStates } from '@/constants/algerian-states';
import { serviceCategories } from '@/constants/service-categories';

const CompleteProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for form fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [state, setState] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  
  // State for avatar management
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const getInitials = (name: string) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '👤';

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !age || !gender || !state || !serviceCategory) {
      setError('يرجى ملء جميع الحقول الإلزامية.');
      return;
    }

    if (!user) {
      setError('خطأ: لم يتم العثور على مستخدم مسجل.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let avatar_url = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const bucketName = 'avatars';

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
        
        avatar_url = publicUrlData.publicUrl;
      }

      const profileData: any = {
        full_name: fullName,
        age: parseInt(age, 10),
        gender: gender,
        location: state,
        provider_category: serviceCategory,
        updated_at: new Date(),
        is_profile_complete: true,
      };

      if (avatar_url) {
        profileData.avatar_url = avatar_url;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      navigate('/dashboard');

    } catch (err: any) {
      setError(`حدث خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-center">أكمل ملفك الشخصي</h2>
          <p className="text-sm text-muted-foreground text-center">
            نحتاج إلى بعض المعلومات الإضافية للبدء.
          </p>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} alt={fullName} />
                <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
              </Avatar>
              <Button 
                type="button" 
                size="icon" 
                variant="outline" 
                className="absolute bottom-0 right-0 rounded-full h-8 w-8" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <div>
            <Label htmlFor="fullName" className="block text-sm font-medium">الاسم الكامل *</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: أحمد محمد" required />
          </div>

          <div>
            <Label htmlFor="age" className="block text-sm font-medium">العمر *</Label>
            <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="مثال: 25" required />
          </div>

          <div>
            <Label htmlFor="gender" className="block text-sm font-medium">الجنس *</Label>
            <Select onValueChange={setGender} value={gender} required>
              <SelectTrigger><SelectValue placeholder="اختر الجنس..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ذكر">ذكر</SelectItem>
                <SelectItem value="أنثى">أنثى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="state" className="block text-sm font-medium">الولاية *</Label>
            <Select onValueChange={setState} value={state} required>
              <SelectTrigger><SelectValue placeholder="اختر ولايتك..." /></SelectTrigger>
              <SelectContent>
                {algerianStates.map((stateName) => (
                  <SelectItem key={stateName} value={stateName}>{stateName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="serviceCategory" className="block text-sm font-medium">فئة الخدمة *</Label>
            <Select onValueChange={setServiceCategory} value={serviceCategory} required>
              <SelectTrigger><SelectValue placeholder="اختر فئة الخدمة..." /></SelectTrigger>
              <SelectContent>
                {serviceCategories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <LoadingSpinner /> : 'حفظ ومتابعة'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
