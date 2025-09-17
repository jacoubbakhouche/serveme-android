// src/components/LayoutRoute.tsx

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const LayoutRoute = () => {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserProfile = async () => {
      if (user) {
        // ✨ 1. نطلب العمود الجديد 'is_profile_complete'
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_profile_complete') // نحدد العمود الذي يهمنا
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("خطأ في جلب بيانات المستخدم:", error.message);
          return;
        }
        
        // ✨ 2. نغير الشرط ليتحقق من العمود الجديد
        // إذا كان الملف الشخصي موجودًا وحالته "غير مكتمل" (false)، قم بالتوجيه
        if (profile && profile.is_profile_complete === false) {
          navigate('/complete-profile');
        }
      }
    };

    checkUserProfile();
  }, [user, navigate]);
  
  // الكود القديم الخاص بك يبقى كما هو
  const fullWidthPages = [
    '/chat',
    '/messages'
  ];

  const isFullWidthPage = fullWidthPages.some(page => location.pathname.startsWith(page));

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default LayoutRoute;
