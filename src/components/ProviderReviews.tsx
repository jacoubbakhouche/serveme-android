
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Star, PlusCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import AddReviewForm from './AddReviewForm';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoadingSpinner from './LoadingSpinner';

type ReviewWithUser = Tables<'reviews'> & { user: Tables<'profiles'> | null };

interface ProviderReviewsProps {
  providerId: string;
  reviews: ReviewWithUser[];
  isLoading: boolean;
}

const getInitials = (name: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const ProviderReviews = ({ providerId, reviews, isLoading }: ProviderReviewsProps) => {
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const userHasReviewed = user ? reviews.some(review => review.user_id === user.id) : false;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            التقييمات والآراء
          </CardTitle>
          {user && user.id !== providerId && !userHasReviewed && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="ml-2 w-4 h-4" />
                  أضف تقييمك
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>إضافة تقييم</DialogTitle>
                </DialogHeader>
                <AddReviewForm providerId={providerId} onReviewSubmitted={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><LoadingSpinner /></div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
              {reviews.map(review => (
                  <div key={review.id} className="p-4 border rounded-lg bg-muted/30 flex gap-4">
                      <Avatar>
                          <AvatarImage src={review.user?.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(review.user?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className='flex-1'>
                          <div className="flex justify-between items-center mb-2">
                              <p className="font-semibold text-primary">{review.user?.full_name || 'مستخدم محذوف'}</p>
                              <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`} />
                                  ))}
                              </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                          <p className="text-xs text-muted-foreground text-left">
                              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ar })}
                          </p>
                      </div>
                  </div>
              ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground p-8">لا توجد تقييمات حتى الآن. كن أول من يضيف تقييماً!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderReviews;
