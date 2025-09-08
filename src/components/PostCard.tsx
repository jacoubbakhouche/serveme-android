// src/components/PostCard.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

type CommentWithUser = Tables<'comments'> & { user: Tables<'profiles'> | null };

interface PostCardProps {
  id: string; // post id
  providerId: string; // provider id, needed for cache invalidation
  imageUrl: string;
  description: string;
  likesCount: number;
  comments: CommentWithUser[];
  isLiked: boolean;
}

const PostCard = ({ id, providerId, imageUrl, description, likesCount, comments, isLiked }: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [userHasLiked, setUserHasLiked] = useState(isLiked);
  const [newComment, setNewComment] = useState('');

  const handleLikeClick = async () => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول لتسجيل الإعجاب", variant: "destructive" });
      return;
    }

    setUserHasLiked(!userHasLiked);

    if (!userHasLiked) {
      const { error } = await supabase.from('likes').insert({ post_id: id, user_id: user.id });
      if (error) {
        setUserHasLiked(false);
        toast({ title: "حدث خطأ", variant: "destructive" });
      }
    } else {
      const { error } = await supabase.from('likes').delete().match({ post_id: id, user_id: user.id });
      if (error) {
        setUserHasLiked(true);
        toast({ title: "حدث خطأ", variant: "destructive" });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['providerPosts', providerId] });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      toast({ title: "يجب تسجيل الدخول للتعليق", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: newComment,
    });

    if (error) {
      toast({ title: "حدث خطأ أثناء إرسال التعليق", variant: "destructive" });
    } else {
      setNewComment('');
      toast({ title: "تمت إضافة التعليق بنجاح" });
      queryClient.invalidateQueries({ queryKey: ['providerPosts', providerId] });
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto bg-card border-border rounded-lg overflow-hidden shadow-lg">
      <Dialog>
        <DialogTrigger asChild>
          {/* ✨ تم التعديل هنا: أضفنا حداً أقصى لارتفاع الصورة لجعل المنشور أقصر */}
          <img 
            src={imageUrl} 
            alt={description || 'Post image'} 
            className="w-full h-auto max-h-[500px] object-cover cursor-pointer bg-muted" 
          />
        </DialogTrigger>
        <DialogContent className="p-0 border-none max-w-4xl bg-transparent shadow-none">
          <img src={imageUrl} alt={description || 'Post image'} className="w-full h-auto rounded-lg" />
        </DialogContent>
      </Dialog>
      
      {description && <CardContent className="p-4"><p className="text-foreground">{description}</p></CardContent>}

      <CardFooter className="flex flex-col items-start p-4 border-t border-border">
        <div className="flex items-center space-x-4 w-full mb-4 rtl">
          <Button variant="ghost" onClick={handleLikeClick} className={`flex items-center space-x-2 ${userHasLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
            <Heart className={`w-6 h-6 ${userHasLiked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </Button>
          <Button variant="ghost" className="flex items-center space-x-2 text-muted-foreground">
            <MessageCircle className="w-6 h-6" />
            <span>{comments.length}</span>
          </Button>
        </div>
        
        <div className="space-y-3 w-full max-h-40 overflow-y-auto pr-2">
          {comments.map(comment => (
            <div key={comment.id} className="flex items-start space-x-3 rtl">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.user?.avatar_url || undefined} />
                <AvatarFallback>{comment.user?.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-muted p-2 rounded-lg flex-1">
                <p className="font-semibold text-sm">{comment.user?.full_name || 'مستخدم'}</p>
                <p className="text-sm break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full mt-4 flex items-center space-x-2 rtl">
          <Input 
            placeholder="أضف تعليقاً..." 
            className="bg-input rounded-full flex-1"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <Button onClick={handleAddComment} size="icon" className="rounded-full bg-primary">
            <Send className="w-4 h-4 text-primary-foreground" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
