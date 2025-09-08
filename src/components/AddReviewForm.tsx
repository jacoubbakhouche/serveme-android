// // src/components/AddReviewForm.tsx

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';

interface AddReviewFormProps {
    providerId: string;
    onReviewSubmitted: () => void;
}

const AddReviewForm = ({ providerId, onReviewSubmitted }: AddReviewFormProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    const addReviewMutation = useMutation({
        mutationFn: async ({ rating, comment }: { rating: number, comment: string }) => {
            if (!user) throw new Error('يجب تسجيل الدخول لإضافة تقييم.');
            if (rating === 0) throw new Error('الرجاء تحديد تقييم (من 1 إلى 5 نجوم).');

            const { error } = await supabase.from('reviews').insert({
                provider_id: providerId,
                user_id: user.id,
                rating,
                comment,
            });

            if (error) {
                if (error.code === '23505') { // unique_violation
                    throw new Error('لقد قمت بتقييم مزود الخدمة هذا بالفعل.');
                }
                throw error;
            }
        },
        onSuccess: async () => {
            toast({
                title: 'شكراً لك!',
                description: 'تمت إضافة تقييمك بنجاح.',
            });
            queryClient.invalidateQueries({ queryKey: ['reviews', providerId] });
            queryClient.invalidateQueries({ queryKey: ['providerProfile', providerId] });
            onReviewSubmitted();

            // ✨ BEGIN MODIFICATION
            const senderName = user?.full_name || 'مستخدم مجهول';
            
            const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    user_id: providerId,
                    type: 'review',
                    message: `لقد تم تقييمك بـ ${rating} نجوم من قبل ${senderName}.`,
                    is_read: false,
                });

            if (notificationError) {
                console.error("Failed to create review notification:", notificationError);
            }
            // ✨ END MODIFICATION
        },
        onError: (error: Error) => {
            toast({
                title: 'خطأ',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addReviewMutation.mutate({ rating, comment });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rtl">
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">تقييمك</label>
                <div className="flex items-center gap-1 justify-center" dir="ltr">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={cn(
                                'w-8 h-8 cursor-pointer transition-colors',
                                (hoverRating >= star || rating >= star)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-muted-foreground/50'
                            )}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="comment" className="block text-sm font-medium text-muted-foreground mb-2">
                    تعليقك (اختياري)
                </label>
                <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="صف تجربتك مع مزود الخدمة..."
                    rows={4}
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={addReviewMutation.isPending || rating === 0}>
                    {addReviewMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    إرسال التقييم
                </Button>
            </div>
        </form>
    );
};

export default AddReviewForm;
