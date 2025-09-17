import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, User, X, Loader2 } from 'lucide-react';
import { algerianStates } from '@/constants/algerian-states';
import { serviceCategories } from '@/constants/service-categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ✨ 1. Add age and gender to the data type
type ProfileDataType = {
  full_name: string;
  phone: string;
  location: string;
  provider_category: string;
  is_provider: boolean;
  specialties: string[];
  avatar_url: string;
  description: string;
  age: number | null;
  gender: string;
};

interface UserProfileCardProps {
  initialProfileData: ProfileDataType;
  onSave: (updatedData: Partial<ProfileDataType>, avatarFile: File | null) => void;
  isSaving: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  isProvider: boolean;
}

const UserProfileCard = ({
  initialProfileData,
  onSave,
  isSaving,
  isEditing,
  onToggleEdit,
  isProvider,
}: UserProfileCardProps) => {
  const [profileData, setProfileData] = useState(initialProfileData);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfileData.avatar_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileData(initialProfileData);
    if (!avatarFile) {
      setAvatarPreview(initialProfileData.avatar_url || null);
    }
  }, [initialProfileData, avatarFile]);

  useEffect(() => {
    if (!isEditing) {
      setAvatarFile(null);
      setAvatarPreview(initialProfileData.avatar_url || null);
    }
  }, [isEditing, initialProfileData.avatar_url]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    // ✨ 2. Include age and gender in the data sent to be saved
    const { full_name, phone, location, provider_category, description, age, gender } = profileData;
    onSave({ full_name, phone, location, provider_category, description, age, gender }, avatarFile);
    setAvatarFile(null);
  };

  const getInitials = (name: string) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '👤';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            My Profile
          </div>
          <Button variant="ghost" size="icon" onClick={onToggleEdit}>
            {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} alt={profileData.full_name} />
              <AvatarFallback>{getInitials(profileData.full_name)}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button size="icon" variant="outline" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={() => fileInputRef.current?.click()}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" value={profileData.full_name} onChange={handleInputChange} disabled={!isEditing} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" value={profileData.phone} onChange={handleInputChange} disabled={!isEditing} />
          </div>

          {/* ✨ 3. Add the Age field */}
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input 
              id="age" 
              name="age" 
              type="number" 
              value={profileData.age || ''} 
              onChange={handleInputChange} 
              disabled={!isEditing} 
            />
          </div>

          {/* ✨ 4. Add the Gender field */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              name="gender"
              value={profileData.gender}
              onValueChange={(value) => handleSelectChange('gender', value)}
              disabled={!isEditing}
            >
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">State/Province</Label>
            <Select
              name="location"
              value={profileData.location}
              onValue-change={(value) => handleSelectChange('location', value)}
              disabled={!isEditing}
            >
              <SelectTrigger><SelectValue placeholder="Select state/province" /></SelectTrigger>
              <SelectContent>
                {algerianStates.map(state => (<SelectItem key={state} value={state}>{state}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          
          {(isProvider || isEditing) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="provider_category">Service Category *</Label>
                <Select
                  name="provider_category"
                  value={profileData.provider_category}
                  onValueChange={(value) => handleSelectChange('provider_category', value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger><SelectValue placeholder="Select service category" /></SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={profileData.description}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Describe your experience and the services you offer..."
                  rows={4}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>

      {isEditing && (
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<><Save className="ml-2 h-4 w-4" /> Save Changes</>)}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UserProfileCard;
