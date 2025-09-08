// src/components/LayoutRoute.tsx

import { Outlet, useLocation } from 'react-router-dom';
import Layout from './Layout';

const LayoutRoute = () => {
  const location = useLocation();
  
  // ✨ التعديل: تحديد صفحات الدردشة فقط كـ fullWidth
  const fullWidthPages = [
    '/chat',
    '/messages'
  ];

  const isFullWidthPage = fullWidthPages.includes(location.pathname);

  return (
    <Layout fullWidth={isFullWidthPage}>
      <Outlet />
    </Layout>
  );
};

export default LayoutRoute;
