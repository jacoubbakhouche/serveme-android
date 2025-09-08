

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, MessagesSquare, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DraggableButton from './DraggableButton';

interface LayoutProps {
  children: React.ReactNode;
}
const fetchUnreadNotificationsCount = async (userId: string | undefined) => {
  if (!userId) return 0;
  const {
    count,
    error
  } = await supabase.from('notifications').select('id', {
    count: 'exact',
    head: true
  }).eq('user_id', userId).eq('is_read', false);
  if (error) {
    console.error("Error fetching unread notifications:", error);
    return 0;
  }
  return count || 0;
};
const Layout = ({
  children
}: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  
  // ==================== بداية التعديل ====================
  // سنحدد إذا كنا في صفحة أدمن أم لا
  const isAdminPage = location.pathname.startsWith('/admin');
  // ===================== نهاية التعديل =====================

  const {
    data: unreadCount = 0
  } = useQuery<number>({
    queryKey: ['unread_notifications', user?.id],
    queryFn: () => fetchUnreadNotificationsCount(user?.id),
    enabled: !!user,
    refetchInterval: 60000
  });

  useEffect(() => {
    // ==================== بداية التعديل ====================
    // أضفنا شرطاً جديداً: لا تقم بتشغيل هذا الكود إذا كنا في صفحة أدمن
    if (isAdminPage || !user?.id) return;
    // ===================== نهاية التعديل =====================

    const channel = supabase.channel(`notifications:${user.id}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications'
    }, payload => {
      console.log('Realtime notification change received!', payload);
      queryClient.invalidateQueries({
        queryKey: ['unread_notifications', user.id]
      });
      queryClient.invalidateQueries({
        queryKey: ['notifications', user.id]
      });
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, isAdminPage]); // أضفنا isAdminPage هنا

  const handleLogout = async () => {
    setIsMenuOpen(false);
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "تم تسجيل الخروج بنجاح"
      });
      queryClient.clear();
      navigate('/auth');
    }
  };
  const handleMenuNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };
  const activeTabValue = location.pathname.startsWith('/providers') ? 'providers' : 'services';
  const isHomePageOrProvidersPage = ['/', '/providers'].includes(location.pathname);
  return <div className="h-screen flex flex-col bg-background text-foreground rtl">
      <header className="bg-background border-b border-border p-4 shrink-0">
        <div className="w-full mx-auto flex items-center justify-between px-4">
          {user ? <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black/30 backdrop-blur-sm border-none flex flex-col items-start justify-start space-y-4 p-6 rtl">
                <SheetHeader>
                  <SheetTitle className="text-white text-lg mb-6">القائمة</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-3 w-full">
                  {[{
                  path: '/notifications',
                  label: 'الإشعارات',
                  icon: Bell,
                  badge: unreadCount
                }, {
                  path: '/messages',
                  label: 'الرسائل',
                  icon: MessagesSquare
                }, {
                  path: '/profile',
                  label: 'ملفي الشخصي',
                  icon: User
                }].map(item => <Button key={item.path} variant="ghost" onClick={() => handleMenuNavigation(item.path)} className="w-full justify-center rounded-full transition relative text-white hover:bg-primary/20 hover:scale-105">
                      <item.icon className="w-4 h-4 ml-2" /> {item.label}
                      {item.badge && item.badge > 0 && <Badge variant="destructive" className="absolute left-4 w-5 h-5 rounded-full flex items-center justify-center p-0">
                          {item.badge}
                        </Badge>}
                    </Button>)}
                  <Button onClick={handleLogout} className="w-full justify-center rounded-full bg-white text-black hover:bg-gray-200 transition">
                    <LogOut className="w-4 h-4 ml-2" /> تسجيل الخروج
                  </Button>
                </div>
              </SheetContent>
            </Sheet> : <div className="w-6 h-6" />
          }
          <h1 className="text-xl font-bold text-primary cursor-pointer" onClick={() => navigate('/')}>Serve Me</h1>
          <div className="flex items-center gap-2">
            {user ? <>
                <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} className="relative">
                  <Bell className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                  {unreadCount > 0 && <Badge variant="destructive" className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center p-0 text-xs">
                      {unreadCount}
                    </Badge>}
                </Button>
                <button onClick={() => navigate('/profile')}>
                  <User className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                </button>
              </> : <Button variant="ghost" onClick={() => navigate('/auth')}>تسجيل الدخول</Button>}
          </div>
        </div>
      </header>

      {isHomePageOrProvidersPage && <div className="bg-background border-b border-border shrink-0 py-2">
          <div className="w-full mx-auto px-4 flex justify-center">
            <Tabs value={activeTabValue} className="w-auto">
              <TabsList className="grid grid-cols-2 bg-input p-1 rounded-full h-auto">
                <TabsTrigger value="services" onClick={() => navigate('/')} className="px-6 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors font-semibold text-lg">
                  الخدمات المتاحة
                </TabsTrigger>
                <TabsTrigger value="providers" onClick={() => navigate('/providers')} className="px-6 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors font-extrabold text-lg">
                  مزودو الخدمات
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>}

      <main className="flex-1 overflow-y-auto">
        <div className="w-full p-4">
          {children}
        </div>
      </main>
      
      {user && <DraggableButton />}
      
    </div>;
};
export default Layout;  
