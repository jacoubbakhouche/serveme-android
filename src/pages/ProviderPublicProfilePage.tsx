// src/pages/ProviderPublicProfilePage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProviderPublicProfileHeader from '@/components/ProviderPublicProfileHeader';
import ProviderReviews from '@/components/ProviderReviews';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tables } from '@/integrations/supabase/types';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/contexts/AuthContext';

type ReviewWithUser = Tables<'reviews'> & { user: Tables<'profiles'> | null };

type PostWithDetails = Tables<'provider_portfolios'> & {
  comments: (Tables<'comments'> & { user: Tables<'profiles'> | null })[];
  likes: Pick<Tables<'likes'>, 'user_id'>[];
};

const ProviderPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: provider, isLoading: isLoadingProvider, error: providerError } = useQuery({
    queryKey: ['providerProfile', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });

  // ✅ الكود هنا بسيط، فقط يجلب البيانات كما هي من قاعدة البيانات
  const { data: posts, isLoading: isLoadingPosts } = useQuery<PostWithDetails[]>({
    queryKey: ['providerPosts', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('provider_portfolios')
        .select(`*, comments(*, user:profiles!user_id(*)), likes(user_id)`)
        .eq('provider_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching posts with details:", error);
        throw new Error(error.message);
      }
      return (data as PostWithDetails[]) || [];
    },
    enabled: !!id,
  });

  // ✅ نفس الشيء هنا، فقط جلب البيانات بدون تعديل
  const { data: reviews, isLoading: isLoadingReviews } = useQuery<ReviewWithUser[]>({
    queryKey: ['reviews', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('reviews')
        .select('*, user:profiles!user_id(*)')
        .eq('provider_id', id)
        .order('created_at', { ascending: false });
        
      if (error) throw new Error(error.message);
      return (data as ReviewWithUser[]) || [];
    },
    enabled: !!id,
  });

  if (isLoadingProvider) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (providerError || !provider) {
    return (
      <div>
        <div className="text-center p-4">
          <h2 className="text-xl font-semibold mb-4">خطأ</h2>
          <p>عفواً، لم نتمكن من العثور على مزود الخدمة المطلوب.</p>
          <Button onClick={() => navigate(-1)} variant="link" className="mt-4">
            العودة للخلف
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="py-6 space-y-8">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-sm">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة
          </Button>
          <h1 className="text-2xl font-bold gradient-text">ملف مزود الخدمة</h1>
        </div>
        
        <ProviderPublicProfileHeader provider={provider} />
        
        {provider.description && (
          <div className="max-w-4xl mx-auto px-4">
            <div className="dark-card p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">نبذة عني</h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {provider.description}
              </p>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto px-4">
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card/80 backdrop-blur-sm">
              <TabsTrigger value="portfolio">معرض الأعمال</TabsTrigger>
              <TabsTrigger value="reviews">التقييمات</TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="mt-4">
              {isLoadingPosts ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                  {posts && posts.length > 0 ? (
                    posts.map(post => (
                      <PostCard
                        key={post.id}
                        id={post.id}
                        providerId={id!}
                        imageUrl={post.image_url!} // ✅ اسم الخاصية الصحيح
                        description={post.description!}
                        likesCount={post.likes.length}
                        comments={post.comments}
                        isLiked={post.likes.some(like => like.user_id === user?.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>لم يقم مزود الخدمة بإضافة أي أعمال بعد.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <ProviderReviews
                providerId={id!}
                reviews={reviews || []}
                isLoading={isLoadingReviews}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProviderPublicProfilePage;
