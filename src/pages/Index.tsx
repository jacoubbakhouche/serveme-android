// src/pages/Index.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from '../App';
import NotFound from './NotFound';
import AddServicePage from './AddServicePage';
import AuthPage from './AuthPage'; 
import HomePage from './HomePage';
import MessagesPage from './MessagesPage';
import ProfilePage from './ProfilePage';
import ProviderPublicProfilePage from './ProviderPublicProfilePage';
import ProvidersPage from './ProvidersPage';
import ServiceDetailPage from './ServiceDetailPage';
import AdminPage from './AdminPage';
import AdminChatPage from './AdminChatPage';
import UpdatePasswordPage from './UpdatePasswordPage';
import TermsPage from './TermsPage';

const Index = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<HomePage />} />
                    <Route path="auth" element={<AuthPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="providers" element={<ProvidersPage />} />
                    <Route path="provider/:id" element={<ProviderPublicProfilePage />} />
                    <Route path="service/:id" element={<ServiceDetailPage />} />
                    <Route path="add-service" element={<AddServicePage />} />
                    <Route path="messages" element={<MessagesPage />} />
                    <Route path="admin" element={<AdminPage />} />
                    <Route path="admin-chat" element={<AdminChatPage />} />
                    <Route path="update-password" element={<UpdatePasswordPage />} />
                    <Route path="terms" element={<TermsPage />} />
                    {/* تأكد من أن مسار * يوضع في النهاية */}
                    <Route path="*" element={<NotFound />} /> 
                </Route>
            </Routes>
        </Router>
    );
};

export default Index;
