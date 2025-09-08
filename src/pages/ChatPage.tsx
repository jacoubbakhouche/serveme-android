// src/pages/ChatPage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ⛔ تم حذف استيراد Layout من هنا لأنه لم يعد مطلوبًا


import ProviderChat from '@/components/ProviderChat';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const ChatPage = () => {
    const { id: receiverId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: receiver, isLoading, error } = useQuery({ // أضفت error هنا للتعامل معه
        queryKey: ['profile', receiverId],
        queryFn: async () => {
            if (!receiverId) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, is_verified')
                .eq('id', receiverId)
                .single();
            if (error) {
                console.error('Error fetching receiver profile', error);
                throw error;
            }
            return data;
        },
        enabled: !!receiverId,
    });

    // ⛔ تم حذف دالة handleNavigateLayout لأنها لم تعد مطلوبة

    if (isLoading) {
        // ✅ لاحظ أننا نرجع المحتوى مباشرة بدون Layout
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <LoadingSpinner />
            </div>
        );
    }

    // ✅ تمت إضافة معالجة أفضل للخطأ هنا
    if (error || !receiverId || !receiver) {
        // ✅ لاحظ أننا نرجع المحتوى مباشرة بدون Layout
         return (
             <div className="text-center p-4">
                 <h2 className="text-xl font-semibold mb-4">خطأ</h2>
                 <p>عفواً، لم نتمكن من العثور على المستخدم المطلوب.</p>
                 <Button onClick={() => navigate(-1)} variant="link" className="mt-4">
                     العودة للخلف
                 </Button>
             </div>
         );
    }

    

    // ✅زير  الخورج من الهدرا 
    return (
        <div className="p-0 py-6">
            
            <div className="flex items-center mb-4">
                <Button variant="ghost" onClick={() => navigate('/messages')} className="text-sm">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    😶‍🌫️💌كل المحادثات
                </Button>
            </div>
            
            <ProviderChat 
                receiverId={receiverId} 
                receiverName={receiver.full_name || 'مستخدم'}
                receiverAvatarUrl={receiver.avatar_url}
                receiverIsVerified={receiver.is_verified || false}
            />
        </div>
    );
    
};



export default ChatPage;
