import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // ✨ 1. استيراد useAuth
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from "./integrations/supabase/client"; // ✨ 2. استيراد Supabase client

// Import Pages and Components
import LayoutRoute from "./components/LayoutRoute";
import AddServicePage from "./pages/AddServicePage";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import MessagesPage from "./pages/MessagesPage";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import ProviderPublicProfilePage from "./pages/ProviderPublicProfilePage";
import ProvidersPage from "./pages/ProvidersPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import AdminPage from "./pages/AdminPage";
import AdminChatPage from "./pages/AdminChatPage";
import NotificationsPage from "./pages/NotificationsPage";
import TermsPage from "./pages/TermsPage";
import IntroVideo from "./components/IntroVideo";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import AdminAdsPage from "./pages/AdminAdsPage";

const queryClient = new QueryClient();

const AppWrapper = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<LayoutRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/providers" element={<ProvidersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/add-service" element={<AddServicePage />} />
        <Route path="/provider/:id" element={<ProviderPublicProfilePage />} />
        <Route path="/service/:id" element={<ServiceDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/chat" element={<AdminChatPage />} />
        <Route path="/admin/ads" element={<AdminAdsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// ✨ 3. إنشاء مكون جديد لمعالجة الإشعارات والوصول لبيانات المستخدم
const NotificationHandler = () => {
  const { user } = useAuth(); // يمكننا الآن الوصول للمستخدم

  useEffect(() => {
    // لا تقم بتسجيل الإشعارات إذا لم يكن المستخدم قد سجل دخوله
    if (!user) return;

    // دالة لحفظ التوكن في قاعدة البيانات
    const saveTokenToSupabase = async (tokenValue: string) => {
      if (!user?.id) {
        console.error("User not available, cannot save token.");
        return;
      }
      
      // استخدم upsert لمنع تكرار البيانات
      const { error } = await supabase
        .from('fcm_tokens')
        .upsert(
          { user_id: user.id, token: tokenValue, platform: 'android' },
          { onConflict: 'user_id, token' }
        );

      if (error) {
        console.error('Error saving FCM token:', error);
      } else {
        console.log('FCM token saved successfully!');
      }
    };

    const setupPushNotifications = async () => {
      try {
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch (e) {
        console.error("Push Notification setup error:", e);
      }
    };

    setupPushNotifications();

    PushNotifications.addListener('registration', (token) => {
      console.info('Push registration success, token:', token.value);
      // 🔥 استدعاء دالة الحفظ عند استلام التوكن
      saveTokenToSupabase(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received while app is in foreground:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed:', notification);
    });
    
    return () => {
      PushNotifications.removeAllListeners();
    };

  }, [user]); // سيتم تشغيل هذا الكود عند تسجيل دخول/خروج المستخدم

  return null; // هذا المكون لا يعرض أي شيء في الواجهة
};

const App = () => {
  const [introVideoFinished, setIntroVideoFinished] = useState(false);
  const handleVideoEnd = () => setIntroVideoFinished(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AuthProvider>
            {/* ✨ 4. إضافة المكون الجديد هنا */}
            <NotificationHandler /> 
            {!introVideoFinished && <IntroVideo onVideoEnd={handleVideoEnd} />}
            {introVideoFinished && (
              <AppWrapper />
            )}
          </AuthProvider>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

