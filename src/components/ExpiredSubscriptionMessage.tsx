import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import ContactSupportButton from './ContactSupportButton';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ExpiredSubscriptionMessage = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at, is_provider')
        .eq('id', user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  // Check if subscription is expired
  const isExpired = profile?.subscription_status === 'expired' || 
    (profile?.subscription_status === 'active' && 
     profile?.subscription_expires_at && 
     new Date(profile.subscription_expires_at) <= new Date());

  if (!profile?.is_provider || !isExpired) {
    return null;
  }

  return (
    <Alert className="border-destructive/50 bg-destructive/5 mb-6">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="text-right">
        <div className="space-y-3">
          <p className="font-medium text-destructive">
            ⚠️ انتهى اشتراكك، يرجى التجديد
          </p>
          <p className="text-sm text-muted-foreground">
            لقد انتهت صلاحية اشتراكك وتم إخفاء ملفك الشخصي من نتائج البحث العامة. يرجى التواصل مع الإدارة لتجديد اشتراكك.
          </p>
          <div className="mt-3">
            <ContactSupportButton />
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ExpiredSubscriptionMessage;