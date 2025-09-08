import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Notification = Tables<'notifications'>;

const fetchNotifications = async (userId: string | undefined): Promise<Notification[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(error.message);
  return data || [];
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // حذف كل الإشعارات فور دخول الصفحة
useEffect(() => {
  const deleteOldNotifications = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // أقدم من 24 ساعة

    if (error) {
      toast({
        title: "خطأ",
        description: `فشل حذف الإشعارات: ${error.message}`,
        variant: "destructive"
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['unread_notifications', user.id] });
    }
  };

  deleteOldNotifications();
}, [user?.id, queryClient]);


  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user?.id),
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread_notifications', user?.id] });
    },
    onError: (err) => {
      toast({
        title: "خطأ",
        description: `فشل تحديث الإشعار: ${err.message}`,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-[70vh]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-center py-12 text-destructive">حدث خطأ: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" /> إشعاراتي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications && notifications.length > 0 ? (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                notification.is_read ? 'bg-secondary/50 text-muted-foreground' : 'bg-card'
              }`}
            >
              <div className="flex-1">
                <p className={`font-medium ${notification.is_read ? '' : 'text-foreground'}`}>{notification.message}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
                </p>
              </div>
              {!notification.is_read && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => markAsReadMutation.mutate(notification.id)}
                  disabled={markAsReadMutation.isPending}
                  title="وضع علامة كمقروء"
                >
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔥</div>
            <p className="text-muted-foreground text-lg font-medium">لا توجد إشعارات حالياً.</p>
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default NotificationsPage;
