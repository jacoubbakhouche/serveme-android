 import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, User, BadgeCheck } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';

interface ProviderCardProps {
  provider: Tables<'profiles'>;
}

const getInitials = (name: string) => {
  if (!name || name === 'مستخدم جديد') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${
        i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
      }`}
    />
  ));
};

const ProviderCard = ({ provider }: ProviderCardProps) => {
  const displayName = provider.full_name || 'مستخدم جديد';

  return (
    // ## تم التعديل هنا لاستخدام كلاس dark-card الموحد ##
    <Card className="dark-card card-hover h-full text-white">
      <CardContent className="p-4 sm:p-5 h-full flex flex-col">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border-2 border-white/20">
            <AvatarImage src={provider.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-slate-800 text-white font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold truncate text-white">{displayName}</h3>
              {provider.is_verified && (
                <BadgeCheck className="w-5 h-5 text-sky-400" />
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {renderStars(Number(provider.rating) || 0)}
              </div>
              <span className="text-sm text-slate-400">
                ({provider.review_count || 0} تقييم)
              </span>
            </div>
            
            <div className="flex items-center gap-1 mb-3 text-sm text-slate-400">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{provider.location || 'غير محدد'}</span>
            </div>
            
            <Badge variant="secondary" className="mb-3 bg-white/5 text-slate-300 w-fit">
              {provider.provider_category || 'غير محدد'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 my-3">
          {provider.specialties?.slice(0, 3).map((specialty, index) => (
            <Badge key={index} variant="outline" className="text-xs bg-transparent border-white/20 text-slate-300">
              {specialty}
            </Badge>
          ))}
        </div>

        {provider.description && (
          <p className="text-sm text-slate-300 mt-2 mb-4 line-clamp-2 leading-relaxed">
            {provider.description}
          </p>
        )}
        
        <div className="flex-grow" />

        <Link to={`/provider/${provider.id}`} className="w-full block mt-auto">
          <Button className="w-full btn-gradient" size="sm">
            <User className="w-4 h-4 ml-2" />
            عرض الملف الشخصي
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ProviderCard;
