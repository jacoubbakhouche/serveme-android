import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const fetchUnreadNotifications = async (userId: string | undefined) => {
  if (!userId) return 0;
  
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
    
  if (error) {
    console.error("Error fetching unread notifications:", error);
    return 0;
  }
  
  return count;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const prevCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioRef.current) {
    audioRef.current = new Audio("/notification.mp3"); // ملف الصوت من public
  }

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['unread_notifications', user?.id],
    queryFn: () => fetchUnreadNotifications(user?.id),
    enabled: !!user,
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // ✅ طلب إذن الإشعارات عند أول تحميل
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("🔔 إذن الإشعارات:", permission);
      });
    }
  }, []);

  // ✅ تفعيل الصوت بعد أول تفاعل من المستخدم
  useEffect(() => {
    const enableAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current.currentTime = 0;
          console.log("🔊 تم تفعيل الصوت بعد أول تفاعل من المستخدم");
        }).catch(() => {
          console.log("⚠️ المتصفح منع التشغيل التلقائي.");
        });
      }
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("scroll", enableAudio);
    };

    window.addEventListener("click", enableAudio);
    window.addEventListener("scroll", enableAudio);

    return () => {
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("scroll", enableAudio);
    };
  }, []);

  // ✅ تشغيل الصوت + toast + إشعار متصفح عند وصول إشعار جديد
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      // 🎵 الصوت
      audioRef.current?.play().catch(() => {
        console.log("🔇 المتصفح منع تشغيل الصوت بدون تفاعل المستخدم.");
      });

      // 🔔 toast داخل التطبيق
      toast({
        title: "📩 لقد وصل إشعار جديد",
        description: "تحقق من صندوق إشعاراتك.",
      });

      // 🌐 إشعار المتصفح
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("📩 إشعار جديد", {
          body: "تحقق من صندوق إشعاراتك في Serve Me",
          icon: "/icon.png", // ضع أيقونة مناسبة في public
        });
      }
    }

    prevCountRef.current = unreadCount;
  }, [unreadCount, toast]);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-1 h-5 w-5 rounded-full flex items-center justify-center p-0"
        >
          {unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default NotificationBell;
