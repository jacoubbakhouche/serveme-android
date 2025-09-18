import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import AdminAdsPage from "./pages/AdminAdsPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";

const queryClient = new QueryClient();

const VAPID_PUBLIC_KEY =
  "BLkGz0mJpatxjHHUHfsHafwI6H8DqqVB6WQ6Bpy_GCNzl3o8Rw40jvRdlCcyifud2g-9jAdWO0PzFnyn8KFHQ2E";

// ==================== ✨ تم التعديل هنا ✨ ====================
const AppWrapper = () => {
  return (
    <Routes>
      {/* المسار العام الوحيد الذي لا يحتاج شريط علوي هو صفحة الدخول */}
      <Route path="/auth" element={<AuthPage />} />

      {/* جميع المسارات الأخرى تستخدم LayoutRoute لإظهار الشريط العلوي */}
      <Route element={<LayoutRoute />}>
        <Route path="/" element={<HomePage />} /> {/* الصفحة الرئيسية الآن هنا */}
        <Route path="/dashboard" element={<HomePage />} />
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
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
      </Route>

      {/* صفحة الخطأ 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
// ==========================================================


// ... (بقية الكود يبقى كما هو بدون تغيير)

const NotificationSetup = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("🚫 المتصفح لا يدعم Push Notifications");
      return;
    }

    const registerPush = async () => {
      try {
        let registration;
        try {
          registration = await navigator.serviceWorker.register("/sw.js", {
            scope: '/',
            updateViaCache: 'none'
          });
          console.log("✅ Service Worker مسجل:", registration);
          
          if (registration.installing) {
            await new Promise<void>((resolve) => {
              registration.installing.addEventListener('statechange', () => {
                if (registration.installing.state === 'installed') {
                  resolve();
                }
              });
            });
          }
        } catch (swError) {
          console.error("❌ خطأ في تسجيل Service Worker:", swError);
          return;
        }

        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        
        if (permission !== "granted") {
          console.log("🚫 المستخدم رفض الإشعارات، الحالة:", permission);
          return;
        }

        console.log("✅ تم منح إذن الإشعارات");

        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          console.log("📝 إنشاء push subscription جديد");
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
          } catch (subscribeError) {
            console.error("❌ خطأ في إنشاء Push Subscription:", subscribeError);
            return;
          }
        } else {
          console.log("📩 استخدام push subscription موجود مسبقاً");
        }

        console.log("📩 Push Subscription:", subscription);

        if (user && subscription) {
          try {
            console.log("💾 حفظ Push Subscription للمستخدم:", user.id);
            const { data, error } = await supabase.functions.invoke('save-subscription', {
              body: {
                user_id: user.id,
                subscription: subscription.toJSON(),
              },
            });

            if (error) {
              console.error("❌ خطأ في حفظ الاشتراك:", error);
              setTimeout(registerPush, 5000);
            } else {
              console.log("✅ تم حفظ الاشتراك في Supabase:", data);
              
              if (process.env.NODE_ENV === 'development') {
                setTimeout(async () => {
                  try {
                    await supabase.functions.invoke('send-push-notification', {
                      body: {
                        user_id: user.id,
                        title: "🎉 مرحباً!",
                        body: "تم تفعيل الإشعارات بنجاح، ستصلك الإشعارات حتى لو كان التطبيق مغلقاً!"
                      }
                    });
                  } catch (testError) {
                    console.log("تعذر إرسال إشعار تجريبي:", testError);
                  }
                }, 2000);
              }
            }
          } catch (saveError) {
            console.error("❌ خطأ في استدعاء دالة حفظ الاشتراك:", saveError);
          }
        }

        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('📨 رسالة من Service Worker:', event.data);
          
          if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED') {
            console.log('🔔 تم استلام إشعار أثناء فتح التطبيق:', event.data.data);
          }
        });

        registration.addEventListener('updatefound', () => {
          console.log('🔄 تم العثور على تحديث للـ Service Worker');
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 Service Worker جديد متاح، يتم التحديث...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        });

      } catch (err) {
        console.error("❌ خطأ عام في إعداد الإشعارات:", err);
        setTimeout(registerPush, 10000);
      }
    };

    const timeoutId = setTimeout(registerPush, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('👁️ التطبيق أصبح مرئياً، التحقق من صحة Push Subscription');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  return null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationSetup />
            <AppWrapper />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
