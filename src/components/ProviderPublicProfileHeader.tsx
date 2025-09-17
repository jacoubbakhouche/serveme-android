import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// ✨ 1. Import the new icons
import { Star, MapPin, Phone, MessageSquare, BadgeCheck, User, Calendar } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import ProviderChat from './ProviderChat';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';


interface ProviderPublicProfileHeaderProps {
  provider: Tables<'profiles'>;
}

const getInitials = (name: string) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-5 h-5 ${
        i < Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
      }`}
    />
  ));
};

const ProviderPublicProfileHeader = ({ provider }: ProviderPublicProfileHeaderProps) => {
  const { user } = useAuth();
  
  return (
    <div className="p-6 rounded-lg bg-card border">
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 text-3xl">
                <AvatarImage src={provider.avatar_url || undefined} alt={provider.full_name || 'Avatar'} />
                <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-bold">
                {getInitials(provider.full_name || '')}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-right">
                
                <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-2xl font-bold">{provider.full_name}</h2>
                    {provider.is_verified && (
                        <BadgeCheck className="w-6 h-6 text-sky-500" />
                    )}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 my-2">
                    <div className="flex items-center gap-1">{renderStars(Number(provider.rating) || 0)}</div>
                    <span className="text-sm text-muted-foreground">({provider.review_count || 0} reviews)</span>
                </div>
                
                {/* ✨ 2. This is the main updated section */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{provider.location || 'Not specified'}</span>
                    </div>

                    {/* Display Gender if available */}
                    {provider.gender && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{provider.gender}</span>
                      </div>
                    )}

                    {/* Display Age if available */}
                    {provider.age && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{provider.age} سنة</span>
                      </div>
                    )}
                </div>

                <Badge variant="secondary">{provider.provider_category || 'Uncategorized'}</Badge>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 self-center sm:self-start">
              <a href={`tel:${provider.phone}`}>
                <Button disabled={!provider.phone} className="w-full sm:w-auto">
                  <Phone className="ml-2" />
                  {provider.phone ? 'Call Now' : 'No Number'}
                </Button>
              </a>
              {user && user.id !== provider.id && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto">
                          <MessageSquare className="ml-2" />
                          Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] md:max-w-[600px] bg-card p-0 border-0">
                      <ProviderChat receiverId={provider.id} receiverName={provider.full_name || 'Service Provider'}/>
                    </DialogContent>
                  </Dialog>
              )}
            </div>
        </div>
        {provider.specialties && provider.specialties.length > 0 && (
            <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2">Specialties:</h4>
                <div className="flex flex-wrap gap-2">
                {provider.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline">{specialty}</Badge>
                ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default ProviderPublicProfileHeader;
